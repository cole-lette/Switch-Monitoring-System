const mqtt = require("mqtt");
const CanvasLayout = require("./model/CanvasLayout");
const Logs = require("./model/Logs"); // Import your Logs model

// Normalize addresses for comparison
const normalizeAddress = (addr) => (addr || "").toLowerCase().replace(/^0x/, "");

const updateTimers = new Map();
const updateDelays = 200; // milliseconds debounce delay

// Cache to prevent repeated logs of the same error per device within cooldown period
const lastLoggedHealthStatus = new Map(); // key: `${email}_${mqttAddr}`, value: { status: string, timestamp: number }
const LOG_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown

async function subscribeToNode(node) {
  const { brokerUrl, address, email, username, password } = node;

  if (!brokerUrl || !address) {
    console.warn("Skipping node without brokerUrl or address", node);
    return;
  }

  const clientId = `client_${Math.random().toString(16).slice(2, 8)}`;
  const options = {
    clientId,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
  };

  if (username && password) {
    options.username = username;
    options.password = password;
  }

  const client = mqtt.connect(brokerUrl, options);

  client.on("connect", () => {
    console.log(`📡 Connected to MQTT broker: ${brokerUrl}`);
    client.subscribe("modbus/readparams/result", (err) => {
      if (err) {
        console.error("❌ MQTT subscribe error:", err.message);
      }
    });
  });

  client.on("message", async (topic, message) => {
    if (topic !== "modbus/readparams/result") return;

    try {
      const payload = JSON.parse(message.toString());
      if (payload.response !== "ReadParameters") return;

      const mqttAddr = normalizeAddress(payload.address);

      // Clear any previous timer for this device to debounce
      if (updateTimers.has(mqttAddr)) {
        clearTimeout(updateTimers.get(mqttAddr));
      }

      updateTimers.set(
        mqttAddr,
        setTimeout(async () => {
          updateTimers.delete(mqttAddr);

          const newHealthStatus = payload.health_status || "OK";
          const normalizedHealthStatus = newHealthStatus.toLowerCase();
          const key = `${email}_${mqttAddr}`;
          const now = Date.now();

          // ===== NEW: Check isOn status =====
          const nodeDoc = await CanvasLayout.findOne(
            { email, "nodes.address": mqttAddr },
            { "nodes.$": 1 }
          );

          let voltage = payload.voltage || 0;
          let current = payload.current || 0;
          let power_factor = payload.power_factor || 0;
          let active_power = payload.active_power || 0;
          let reactive_power = payload.reactive_power || 0;
          let apparent_power = payload.apparent_power || 0;
          let frequency = payload.frequency || 0;

          if (nodeDoc && nodeDoc.nodes && nodeDoc.nodes[0] && nodeDoc.nodes[0].isOn === false) {
            voltage = 0;
            current = 0;
            power_factor = 0;
            active_power = 0;
            reactive_power = 0;
            apparent_power = 0;
            frequency = 0;
          }
          // ===================================

          const update = {
            $set: {
              "nodes.$[elem].voltageReading": voltage,
              "nodes.$[elem].amperageReading": current,
              "nodes.$[elem].power_factor": power_factor,
              "nodes.$[elem].active_power": active_power,
              "nodes.$[elem].reactive_power": reactive_power,
              "nodes.$[elem].apparent_power": apparent_power,
              "nodes.$[elem].frequency": frequency,
              "nodes.$[elem].health_status": newHealthStatus,
              "nodes.$[elem].lastUpdated": new Date(),
              lastSaved: new Date(),
            },
          };

          try {
            const result = await CanvasLayout.updateMany(
              { email, "nodes.address": mqttAddr },
              update,
              { arrayFilters: [{ "elem.address": mqttAddr }] }
            );

            if (result) {
              console.log(`✅ Canvas updated for node ${mqttAddr}`);
            }

            // Only log if health_status is NOT "ok" and we have not logged same error recently
            if (normalizedHealthStatus !== "ok") {
              const lastLog = lastLoggedHealthStatus.get(key);

              if (
                !lastLog ||
                lastLog.status !== normalizedHealthStatus ||
                now - lastLog.timestamp > LOG_COOLDOWN_MS
              ) {
                const switchName = await getSwitchName(email, mqttAddr);
                const logMessage =
                  payload.message || `Health status is ${newHealthStatus.toUpperCase()}`;

                const newLog = new Logs({
                  timestamp: new Date(),
                  email,
                  message: logMessage,
                  brokerUrl,
                  address: mqttAddr,
                  switchName: switchName || "Unknown Switch",
                  health_status: newHealthStatus.toUpperCase(),
                });

                await newLog.save();
                console.log(`📝 Log saved for device ${mqttAddr} with health status ${newHealthStatus}`);

                lastLoggedHealthStatus.set(key, {
                  status: normalizedHealthStatus,
                  timestamp: now,
                });
              }
            } else {
              // If health status is OK, clear cache so next error logs immediately
              lastLoggedHealthStatus.delete(key);
            }
          } catch (err) {
            console.error("❌ Error updating canvas or saving log:", err.message);
          }
        }, updateDelays)
      );
    } catch (err) {
      console.error("❌ MQTT message error:", err.message);
    }
  });

  client.on("error", (err) => {
    console.error(`❌ MQTT error (${brokerUrl}):`, err.message);
  });
}

// Helper to get switchName from CanvasLayout document given email and address
async function getSwitchName(email, address) {
  try {
    const canvasDoc = await CanvasLayout.findOne(
      { email, "nodes.address": address },
      { "nodes.$": 1 }
    );
    if (canvasDoc && canvasDoc.nodes && canvasDoc.nodes.length > 0) {
      return canvasDoc.nodes[0].switchName;
    }
  } catch (err) {
    console.error("❌ Error fetching switchName:", err.message);
  }
  return null;
}

module.exports = { subscribeToNode };
