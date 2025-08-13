import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import ShortcutCard from "../../components/Shortcutcard";
import { useLocation, useNavigate } from "react-router-dom";
import QuickLinks from "./components/QuickLinks";
import LogList from "../../components/LogList";
import { useTranslation } from 'react-i18next';
import { jwtDecode } from "jwt-decode";
import { Cpu, Plug, PowerOff, RefreshCcw, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [userEmail, setUserEmail] = useState("");
  const [logs, setLogs] = useState([]);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebarCollapsed") === "true");

  const [error, setError] = useState("");
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState("");

  const [lastUpdated, setLastUpdated] = useState(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const intervalRef = useRef(null);

  const [userName, setUserName] = useState("");

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("http://localhost:5000/api/users/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch user profile");
      const data = await res.json();
      setUserName(data.name || "User"); // fallback
    } catch (err) {
      console.error("Profile fetch error:", err);
      setUserName("User"); // fallback in case of error
    }
  };




  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token || token.split(".").length !== 3) {
      navigate("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      if (!decoded.email) throw new Error("Invalid token");
      setUserEmail(decoded.email);
      fetchUserProfile();

    } catch (err) {
      console.error("Token decode error:", err);
      navigate("/login");
    }
  }, [navigate]);

  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDevices = async () => {
    setIsLoading(true);
    setError("");  // Clear previous error before fetching
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setDevices([]);
        setIsLoading(false);
        return;
      }

      // 1. Fetch all canvases
      const canvasRes = await fetch("http://localhost:5000/api/canvas/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!canvasRes.ok) throw new Error("Failed to fetch canvas list");
      const canvasList = await canvasRes.json();

      // 2. Fetch nodes-with-devices for all canvases in parallel
      const allDevicesArrays = await Promise.all(
        canvasList.map(async (canvas) => {
          const canvasId = canvas.canvasId || canvas._id;
          const res = await fetch(`http://localhost:5000/api/canvas/${canvasId}/nodes-with-devices`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) return [];
          const data = await res.json();
          return data.nodes.map(node => ({
            _id: node.id,
            isOn: node.isOn ?? false,
            apparent_power: node.apparent_power ?? 0,
            brokerUrl: node.brokerUrl || "",
            address: node.address || "",
            health_status: node.health_status || "ok",
          }));
        })
      );

      // 3. Flatten array of arrays
      const allDevices = allDevicesArrays.flat();

      // 4. Deduplicate devices by brokerUrl + address
      const uniqueDevicesMap = new Map();
      allDevices.forEach(device => {
        const key = `${device.brokerUrl}-${device.address}`;
        if (!uniqueDevicesMap.has(key)) {
          uniqueDevicesMap.set(key, device);
        }
      });

      const uniqueDevices = Array.from(uniqueDevicesMap.values());

      // 5. Update state with unique devices
      setDevices(uniqueDevices);

      setLastUpdated(new Date());
      setSecondsAgo(0);
    } catch (err) {
      console.error(err);
      setDevices([]);
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!lastUpdated) return;

    intervalRef.current = setInterval(() => {
      setSecondsAgo(prev => prev + 1);
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [lastUpdated]);


  useEffect(() => {
    if (!userEmail) return;
    fetchDevices();
    const interval = setInterval(fetchDevices, 60000);
    return () => clearInterval(interval);
  }, [userEmail]);


  const totalCount = devices.length;
  const onCount = devices.filter(d => d.isOn).length;
  const offCount = totalCount - onCount;

  const healthStatusCounts = devices.reduce((acc, device) => {
    const status = (device.health_status || "ok").toLowerCase();
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      setLogsError("");
      const token = localStorage.getItem("authToken");

      const res = await fetch(`http://localhost:5000/api/logs?limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch recent logs");

      const data = await res.json();
      setLogs(data);
    } catch (err) {
      setLogsError(err.message || "Something went wrong.");
    } finally {
      setLogsLoading(false);
    }
  };

  const handleDeleteLog = async (id) => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`http://localhost:5000/api/logs/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`Failed to delete log`);
      setLogs((prevLogs) => prevLogs.filter((log) => log._id !== id));
    } catch (err) {
      alert(err.message || "Delete failed");
      console.error(err);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    setLogsLoading(true);
    await Promise.all([fetchDevices(), fetchLogs(false)]);
    setIsLoading(false);
    setLogsLoading(false);
  };

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", collapsed);
  }, [collapsed]);

  useEffect(() => {
    if (!userEmail) return;

    const fetchAll = async () => {
      try {
        await Promise.all([fetchDevices(), fetchLogs()]);
      } catch (err) {
        console.error(err);
      }
    };

    fetchAll();
    const interval = setInterval(fetchAll, 60000);

    return () => {
      clearInterval(interval);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userEmail]);
  function StatusItem({ Icon, label, count, colorClass }) {
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Icon className={colorClass} size={18} />
          <span className="text-base font-medium">{label}</span>
        </div>
        {/* Ensure gap between number and unit */}
        <div className="flex items-center gap-1 text-base font-semibold">
          {typeof count === "string" ? (
            <span className={colorClass}>{count}</span>
          ) : (
            count
          )}
        </div>
      </div>
    );
  }


  return (
    <div className="flex min-h-screen transition-colors duration-300 bg-gray-100 dark:bg-gray-900">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        activePath={location.pathname}
      />

      <main
        className={`flex-1 transition-[margin-left] duration-300 ease-in-out text-gray-800 dark:text-gray-200 ${collapsed ? "ml-[60px]" : "ml-[220px]"
          }`}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t("welcome")}, {userName}!
            </h1>


            <div className="flex flex-col items-end">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
                disabled={isLoading}
                title={t("refreshDeviceCounts")}
              >
                <RefreshCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                {t("Refresh")}
              </button>
              {lastUpdated && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t("lastUpdated")} :{" "}
                  {secondsAgo}{" "}
                  {t("second")}
                  {secondsAgo !== 1 ? t("plural") : ""}{" "}
                  {t("ago")}
                </p>

              )}
            </div>
          </div>

          {error && (
            <div className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</div>
          )}

          <div className="space-y-6 opacity-90">
            {/* Cards Grid */}
            <div className="flex flex-wrap gap-7">
              <div>
                <ShortcutCard title={t("totalDevices")}>
                  <StatusItem
                    Icon={Cpu}
                    label={t("devices")}
                    count={totalCount}
                    colorClass="text-base font-semibold text-blue-600 dark:text-blue-400"
                  />
                </ShortcutCard>
              </div>

              <div>
                <ShortcutCard title={t("powerStatus")}>
                  <StatusItem
                    Icon={Plug}
                    label={t("ON")}
                    count={onCount}
                    colorClass="text-green-600 dark:text-green-400"
                  />
                  <StatusItem
                    Icon={PowerOff}
                    label={t("OFF")}
                    count={offCount}
                    colorClass="text-red-600 dark:text-red-400"
                  />
                </ShortcutCard>

              </div>

              <div>
                <ShortcutCard title={t("healthStatus")}>
                  <StatusItem
                    Icon={CheckCircle}
                    label={t("OK")}
                    count={healthStatusCounts.ok || 0}
                    colorClass="text-green-600 dark:text-green-400"
                  />
                  <StatusItem
                    Icon={AlertTriangle}
                    label={t("Warning")}
                    count={healthStatusCounts.warning || 0}
                    colorClass="text-yellow-600 dark:text-yellow-400"
                  />
                  <StatusItem
                    Icon={XCircle}
                    label={t("Caution")}
                    count={healthStatusCounts.caution || 0}
                    colorClass="text-red-600 dark:text-red-400"
                  />
                </ShortcutCard>
              </div>

            </div>

            {/* Quick Links */}
            <div className="mt-4">
              <QuickLinks />
            </div>

            {/* Recent Logs Section */}
            <div className="mt-4">
              <LogList
                logs={logs}
                loading={logsLoading}
                error={logsError}
                onDeleteLog={handleDeleteLog}
                limit={5}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
