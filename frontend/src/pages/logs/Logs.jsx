import React, { useEffect, useState, useCallback } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import { useLocation } from "react-router-dom";
import LogList from "../../components/LogList";
import { RefreshCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { jwtDecode } from "jwt-decode";


export default function LogsPage() {
  const { t } = useTranslation();

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", collapsed);
  }, [collapsed]);

  const location = useLocation();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const [filter, setFilter] = useState({
    switchName: "",
    message: "",
    health_status: ""
  });

  const filteredLogs = logs.filter((log) => {
    const matchSwitch = log.switchName?.toLowerCase().includes(filter.switchName.toLowerCase());
    const matchMessage = log.message?.toLowerCase().includes(filter.message.toLowerCase());
    const matchStatus = filter.health_status
  ? log.health_status?.toLowerCase() === filter.health_status.toLowerCase()
  : true;

    return matchSwitch && matchMessage && matchStatus;
  });


  const fetchLogs = useCallback(() => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("authToken");

    if (!token) {
      setError("No auth token found");
      setLoading(false);
      return;
    }

    let email = "";

    try {
      const decoded = jwtDecode(token);
      email = decoded.email;
    } catch (err) {
      setError("Invalid auth token");
      setLoading(false);
      return;
    }

    return fetch(`http://localhost:5000/api/logs`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })


      .then((res) => {
        if (!res.ok) throw new Error(t("Failed to fetch logs"));
        return res.json();
      })
      .then((data) => {
        setLogs(data);
        setLastUpdated(new Date());
        setSecondsSinceUpdate(0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    fetchLogs();

    const interval = setInterval(() => {
      fetchLogs();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchLogs]);

  useEffect(() => {
    if (!lastUpdated) return;

    const interval = setInterval(() => {
      const seconds = Math.floor((new Date() - lastUpdated) / 1000);
      setSecondsSinceUpdate(seconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  const handleRefresh = () => {
    fetchLogs();
  };

  const handleDeleteLog = (id) => {
    if (!window.confirm(t("Are you sure you want to delete this log?"))) return;

    const deletedLog = logs.find((log) => log._id === id);
    setLogs((prev) => prev.filter((log) => log._id !== id));

    const token = localStorage.getItem("authToken");

    fetch(`http://localhost:5000/api/logs/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(t("Failed to delete log"));
      })
      .catch(() => {
        alert(t("Error deleting log"));
        setLogs((prev) => [...prev, deletedLog]);
      });
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t("All Logs")} ({logs.length})
            </h1>

            <div className="flex items-center space-x-6">
              {/* Refresh Button + Last Updated */}
              <div className="flex flex-col items-end">
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading}
                  title={t("Refresh logs")}
                >
                  <RefreshCcw
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  />
                  {t("Refresh")}
                </button>
                {lastUpdated && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t("lastUpdated")}: {secondsSinceUpdate} {t("second")}
                    {secondsSinceUpdate !== 1 ? t("plural") : ""} {t("ago")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input
              type="text"
              placeholder={t("Filter by Switch Name")}
              value={filter.switchName}
              onChange={(e) => setFilter({ ...filter, switchName: e.target.value })}
              className="px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-white"
            />
            <input
              type="text"
              placeholder={t("Filter by Message")}
              value={filter.message}
              onChange={(e) => setFilter({ ...filter, message: e.target.value })}
              className="px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-white"
            />
            <select
              value={filter.health_status}
              onChange={(e) => setFilter({ ...filter, health_status: e.target.value })}
              className="px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-white"
            >
              <option value="">{t("Filter by Status")}</option>
              <option value="ok">{t("OK")}</option>
              <option value="caution">{t("Caution")}</option>
              <option value="warning">{t("Warning")}</option>
            </select>
          </div>

          <button
            onClick={() => setFilter({ switchName: "", message: "", health_status: "" })}
            className="px-3 py-2 text-sm text-white bg-gray-600 rounded-md hover:bg-gray-700 md:col-span-3"
          >
            {t("Reset Filters")}
          </button>



          {/* Log list */}
          <LogList
            logs={filteredLogs}
            loading={loading}
            error={error}
            onDeleteLog={handleDeleteLog}
            title="" // No title inside LogList for this page
          />
        </div>
      </main>
    </div>
  );
}
