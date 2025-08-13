const mqtt = require('mqtt');

const brokerUrl = 'mqtt://broker.emqx.io:1883';
const client = mqtt.connect(brokerUrl);

// List of mock device IDs in hex (e.g., 0x63 to 0x67 = "63" to "67")
const deviceIds = ['63', '64', '65', '66', '67'];

client.on('connect', () => {
  console.log('✅ Simulator connected to MQTT broker');

  // Subscribe to scan, readparams, and deviceinfo requests
  client.subscribe('modbus/scan/request', (err) => {
    if (err) {
      console.error('❌ Failed to subscribe to scan request topic:', err);
    } else {
      console.log('📡 Subscribed to modbus/scan/request');
    }
  });

  client.subscribe('modbus/readparams/request', (err) => {
    if (err) {
      console.error('❌ Failed to subscribe to readparams request topic:', err);
    } else {
      console.log('📡 Subscribed to modbus/readparams/request');
    }
  });

  client.subscribe('modbus/deviceinfo/request', (err) => {
    if (err) {
      console.error('❌ Failed to subscribe to deviceinfo request topic:', err);
    } else {
      console.log('📡 Subscribed to modbus/deviceinfo/request');
    }
  });

  // Periodically publish read parameter data for all devices
  setInterval(() => {
    deviceIds.forEach((id) => simulateReadParamsResult(id));
  }, 1000);
});

client.on('message', (topic, message) => {
  if (topic === 'modbus/scan/request') {
    console.log('📥 Received scan request');
    simulateScanResult();
  }

  if (topic === 'modbus/readparams/request') {
    try {
      const payload = JSON.parse(message.toString());
      let deviceId = payload.device_id || '';
      deviceId = deviceId.replace(/^0x/i, ''); // remove '0x' if present
      console.log(`📥 Received readparams request for device ${deviceId}`);
      simulateReadParamsResult(deviceId);
    } catch (err) {
      console.error('❌ Invalid readparams request message:', err);
    }
  }

  if (topic === 'modbus/deviceinfo/request') {
    try {
      const payload = JSON.parse(message.toString());
      let deviceId = payload.device_id || '';
      deviceId = deviceId.replace(/^0x/i, ''); // remove '0x' if present
      console.log(`📥 Received deviceinfo request for device ${deviceId}`);
      simulateDeviceInfoResult(deviceId);
    } catch (err) {
      console.error('❌ Invalid deviceinfo request message:', err);
    }
  }
});

function simulateScanResult() {
  deviceIds.forEach((id) => {
    const payload = {
      response: 'ScanOnlineDevice',
      address: id,
      online: true,
      hw_version: 'HW_v1.0',
      sw_version: 'SW_v1.2',
    };
    client.publish('modbus/scan/result', JSON.stringify(payload));
    console.log(`📤 Published Scan Result for device ${id}`);
  });
}

function simulateDeviceInfoResult(deviceId) {
  const payload = {
    response: 'DeviceInfo',
    address: deviceId,
    part_number: 'PN12345',
    hw_version: 'HW_v1.0',
    sw_version: 'SW_v1.2',
    serial_number: 'SN987654321',
  };
  client.publish('modbus/deviceinfo/result', JSON.stringify(payload));
  console.log(`📤 Published Device Info Result for device ${deviceId}`);
}

function simulateReadParamsResult(deviceId) {
  // Weighted random for health_status
  const random = Math.random();
  let health_status = "ok";
  let message = "Voltage and current within normal range";

  if (random < 0.0004) {
    health_status = "warning";
    message = "High current and/or voltage fluctuation detected";
  } else if (random < 0.0002) {
    health_status = "caution";
    message = "Minor deviation in voltage or current";
  }

  const voltage = Number((230.5 + Math.random()).toFixed(2));
  const current = Number((5 + Math.random()).toFixed(2));
  const power_factor = Number((0.95 + Math.random() * 0.02).toFixed(2));
  const active_power = Number((1000 + Math.random() * 100).toFixed(2));
  const reactive_power = Number((100 + Math.random() * 20).toFixed(2));
  const apparent_power = Number((1100 + Math.random() * 50).toFixed(2));
  const frequency = 50.0;

  const payload = {
    response: 'ReadParameters',
    address: deviceId,
    voltage,
    current,
    power_factor,
    active_power,
    reactive_power,
    apparent_power,
    frequency,
    health_status,
    message
  };

  client.publish('modbus/readparams/result', JSON.stringify(payload));
  console.log(`📤 Published Read Params Result for device ${deviceId} → ${health_status.toUpperCase()}: ${message}`);
}

 