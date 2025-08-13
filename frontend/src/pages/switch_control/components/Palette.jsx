import React, { useState, useRef, useEffect } from "react";
import mqtt from "mqtt";

export default function Palette({ onDragStart, placedDevices = [] , t}) {
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);

  // MQTT Connection info form fields
  const [brokerUrl, setBrokerUrl] = useState("ws://broker.emqx.io:8083/mqtt");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // MQTT client and timers refs
  const clientRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  // Connection and device states
  const [connected, setConnected] = useState(false);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Throttle last scan timestamp
  const lastScanRef = useRef(0);
  const SCAN_THROTTLE_MS = 10000; // 10 seconds throttle between scans

  // Open modal handler
  const openModal = () => {
    setError(null);
    setModalOpen(true);
  };

  // Cleanup MQTT client and timers
  const cleanupClient = () => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    if (clientRef.current) {
      clientRef.current.end(true);
      clientRef.current = null;
    }
    setConnected(false);
    setLoading(false);
  };

  // Close modal and cleanup
  const closeModal = () => {
    setModalOpen(false);
    cleanupClient();
  };

  // Handle connect and scan submit with throttling and collection window
  const handleConnect = (e) => {
    e.preventDefault();

    const now = Date.now();
    if (now - lastScanRef.current < SCAN_THROTTLE_MS) {
      setError(
        `Please wait ${Math.ceil(
          (SCAN_THROTTLE_MS - (now - lastScanRef.current)) / 1000
        )} seconds before scanning again.`
      );
      return;
    }
    lastScanRef.current = now;

    setError(null);
    setLoading(true);
    setDevices([]);

    const options = {
      clientId: "webclient_" + Math.random().toString(16).substr(2, 8),
      clean: true,
      connectTimeout: 5000,
    };
    if (username) options.username = username;
    if (password) options.password = password;

    const client = mqtt.connect(brokerUrl, options);
    clientRef.current = client;

    client.on("connect", () => {
      setConnected(true);
      client.subscribe("modbus/scan/result", (err) => {
        if (err) {
          setError("Failed to subscribe to scan result topic.");
          setLoading(false);
          client.end();
          return;
        }
        // Publish scan request once
        client.publish("modbus/scan/request", JSON.stringify({ request: "scanDevices" }));

        // Collect devices for 10 seconds, then disconnect
        scanTimeoutRef.current = setTimeout(() => {
          cleanupClient();
        }, 10000);
      });
    });

    client.on("message", (topic, message) => {
      if (topic === "modbus/scan/result") {
        try {
          const data = JSON.parse(message.toString());
          if (data.address) {
            setDevices((prev) => {
              if (prev.find((d) => d.address === data.address)) return prev;
              return [...prev, data];
            });
          }
        } catch {
          // Ignore malformed messages
        }
      }
    });

    client.on("error", (err) => {
      setError("MQTT Connection Error: " + err.message);
      setLoading(false);
      setConnected(false);
      cleanupClient();
    });

    client.on("close", () => {
      setConnected(false);
      setLoading(false);
    });
  };

  // Drag start handler
  const handleDragStart = (e, device) => {
    const deviceWithConnection = {
      ...device,
      brokerUrl,
      username,
      password,
    };
    e.dataTransfer.setData("application/reactflow", JSON.stringify(deviceWithConnection));
    e.dataTransfer.effectAllowed = "move";
    if (onDragStart) onDragStart(deviceWithConnection);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupClient();
    };
  }, []);

  // Helper to check if device is placed
  const isPlaced = (device) => {
    return placedDevices.some(
      (pd) => pd.address === device.address && pd.brokerUrl === brokerUrl
    );
  };

  // Separate devices into not placed and placed lists
  const notPlacedDevices = devices.filter((d) => !isPlaced(d));
  const placedDevicesList = devices.filter((d) => isPlaced(d));

  return (
  <>
    {/* Modal */}
    {modalOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={closeModal}
      >
        <div
          className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            {t("Connect to MQTT Broker")}
          </h2>

          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("Broker URL")}
              </label>
              <input
                type="text"
                value={brokerUrl}
                onChange={(e) => setBrokerUrl(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
                placeholder={t("e.g. ws://broker.emqx.io:8083/mqtt")}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("Username")}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("Password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>

            {error && (
              <div className="p-2 mt-2 text-sm text-red-700 bg-red-100 border border-red-300 rounded dark:bg-red-800 dark:text-red-200 dark:border-red-600">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {t("Cancel")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-green-400"
              >
                {loading ? t("Connecting...") : t("Connect & Scan")}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Palette */}
    <aside className="flex flex-col w-full h-full p-3 bg-white border border-gray-300 rounded-md shadow dark:bg-gray-900 dark:border-gray-600 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
      {/* Header with title and button */}
      <div className="flex items-center justify-between min-w-0 gap-2 mb-3">
        <h2 className="text-base font-semibold text-gray-800 truncate dark:text-white">
          {t("Devices")}
        </h2>
        <button
          onClick={openModal}
          className="flex-shrink-0 px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          {t("Add Device")}
        </button>
      </div>

      {/* Scrollable device list */}
      <div className="flex-1 space-y-6 overflow-y-auto scroll-smooth hide-scrollbar">
        {/* No devices fallback */}
        {notPlacedDevices.length === 0 && placedDevicesList.length === 0 && (
          <div className="mt-10 text-center text-gray-500 dark:text-gray-400">
            {t("No devices found.")}<br />
            {t("Click")} <span className="font-semibold text-blue-500">{t("Add Device")}</span> {t("to scan.")}
          </div>
        )}

        {/* Unplaced Devices */}
        {notPlacedDevices.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-bold text-blue-700 uppercase dark:text-blue-400">
              {t("Available Devices")}
            </h3>
            <div className="grid gap-3">
              {notPlacedDevices.map((device) => (
                <div
                  key={device.address}
                  draggable
                  onDragStart={(e) => handleDragStart(e, device)}
                  className="p-4 bg-gray-100 border border-blue-300 rounded-lg shadow-sm cursor-move hover:bg-blue-50 hover:ring hover:ring-blue-300 dark:bg-gray-800 dark:border-blue-500 dark:hover:bg-gray-700 dark:hover:ring-blue-500"
                >
                  <div className="text-sm font-semibold text-blue-800 break-all dark:text-blue-300">
                    {t("Device ID")}: {device.address}
                  </div>
                  <div className="mt-1 text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                    <div>{t("HW")}: {device.hw_version || t("N/A")}</div>
                    <div>{t("SW")}: {device.sw_version || t("N/A")}</div>
                    {device.part_number && <div>{t("Part #")}: {device.part_number}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Placed Devices */}
        {placedDevicesList.length > 0 && (
          <div>
            <h3 className="mt-4 mb-2 text-sm font-bold text-yellow-700 uppercase dark:text-yellow-400">
              {t("Already Placed")}
            </h3>
            <div className="grid gap-3 opacity-70">
              {placedDevicesList.map((device) => (
                <div
                  key={device.address + "-placed"}
                  className="p-4 bg-yellow-100 border border-yellow-400 rounded-lg shadow-sm cursor-not-allowed dark:bg-yellow-900 dark:border-yellow-600"
                >
                  <div className="text-sm font-semibold text-yellow-900 break-all dark:text-yellow-200">
                    {t("Device ID")}: {device.address}
                  </div>
                  <div className="mt-1 text-xs text-yellow-800 dark:text-yellow-300 space-y-0.5">
                    <div>{t("HW")}: {device.hw_version || t("N/A")}</div>
                    <div>{t("SW")}: {device.sw_version || t("N/A")}</div>
                    {device.part_number && <div>{t("Part #")}: {device.part_number}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  </>
);

}
