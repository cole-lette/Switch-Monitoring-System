import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DeviceCard from "./components/DeviceCard";
import DeviceFilterBar from "./components/DeviceFilterBar";
import { jwtDecode } from "jwt-decode";
import ShortcutCard from "../../components/Shortcutcard";
import { Cpu, Plug, PowerOff, RefreshCcw } from "lucide-react";
import SettingsModal from "./components/SettingsModal";
import { toast } from "react-toastify";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";


export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebarCollapsed") === "true");
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // new state
  const [searchQuery, setSearchQuery] = useState("");
  const [isOnFilter, setIsOnFilter] = useState("all");
  const [togglingIds, setTogglingIds] = useState(new Set());
  const [canvasLayouts, setCanvasLayouts] = useState([]);
  const [configureVisible, setConfigureVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const [selectedCanvasId, setSelectedCanvasId] = useState(() => {
    const storedId = localStorage.getItem("selectedCanvasId");
    return storedId ? String(storedId) : "";
  });

  const openConfigure = (device) => {
    setSelectedDevice(device);
    setConfigureVisible(true);

  };

  const closeConfigure = () => {
    setSelectedDevice(null);
    setConfigureVisible(false);
  };


  const handleSaveSettings = async (updatedDevice) => {
    try {
      const response = await fetch(`http://localhost:5000/api/canvas/nodes/${updatedDevice.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(updatedDevice),
      });

      if (!response.ok) {
        throw new Error("Failed to save device settings");
      }

      const savedDevice = await response.json();

      setDevices((prevDevices) =>
        prevDevices.map((d) => (d.id === updatedDevice.id ? { ...d, ...savedDevice } : d))
      );
      closeConfigure();


    } catch (error) {
      console.error(error);
      alert("Failed to save device settings. Please try again.");
    }
  };

  const handleRenameCanvas = async (newName) => {
    if (!selectedCanvasId || !newName.trim()) return;
    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch(`http://localhost:5000/api/canvas/rename/${selectedCanvasId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ canvasName: newName }), // usually rename payload key is canvasName
      });

      if (!res.ok) throw new Error("Rename failed");
      await res.json();
      toast.success("Canvas renamed!");
      // Refresh list
      const updatedList = await fetchCanvasList(token);
      setCanvasLayouts(updatedList);
    } catch (err) {
      console.error(err);
      toast.error("Failed to rename canvas.");
    }
  };

  const handleDeleteCanvas = async () => {
    if (!selectedCanvasId) return;
    if (!window.confirm("Are you sure you want to delete this canvas?")) return;
    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch(`http://localhost:5000/api/canvas/${selectedCanvasId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Canvas deleted!");
      // Remove from local state
      const updatedList = await fetchCanvasList(token);
      setCanvasLayouts(updatedList);
      const newDefault = updatedList[0]?.canvasId || updatedList[0]?._id || "";
      setSelectedCanvasId(String(newDefault));
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete canvas.");
    }
  };

  const fetchCanvasList = async (token) => {
    const res = await fetch("http://localhost:5000/api/canvas/list", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return res.ok ? data : [];
  };




  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", collapsed);
  }, [collapsed]);

  const getEmailFromToken = () => {
    const token = localStorage.getItem("authToken");
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      return decoded.email;
    } catch (err) {
      console.error("Invalid token");
      return null;
    }
  };

  useEffect(() => {
    const email = getEmailFromToken();
    const token = localStorage.getItem("authToken");

    if (!email || !token) {
      navigate("/login");
      return;
    }

    let interval;

    const fetchCanvasNodes = async () => {
      if (!selectedCanvasId) return;

      setLoading(true);

      try {
        let url = selectedCanvasId === "all"
          ? "http://localhost:5000/api/canvas/all-nodes-with-devices"
          : `http://localhost:5000/api/canvas/${selectedCanvasId}/nodes-with-devices`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (res.ok) {
          const flattenedDevices = data.nodes.map((node) => ({
            _id: node.id,
            id: node.id,
            switchName: node.switchName || node.label || "Unnamed",
            address: node.address || "",
            isOn: node.isOn ?? false,
            voltageReading: node.voltageReading ?? 0,
            amperageReading: node.amperageReading ?? 0,
            active_power: node.active_power ?? 0,
            apparent_power: node.apparent_power ?? 0,
            reactive_power: node.reactive_power ?? 0,
            frequency: node.frequency ?? 0,
            power_factor: node.power_factor ?? 0,
            brokerUrl: node.brokerUrl || "",
            username: node.username || "",
            password: node.password || "",
            hw_version: node.hw_version || "",
            sw_version: node.sw_version || "",
            locked: node.locked ?? true,
          }));

          let uniqueDevices = flattenedDevices;


          if (selectedCanvasId === "all") {
            const uniqueMap = new Map();
            uniqueDevices = flattenedDevices.filter((device) => {
              const key = `${device.brokerUrl}::${device.address}`;
              if (uniqueMap.has(key)) {
                return false;
              } else {
                uniqueMap.set(key, true);
                return true;
              }
            });
          }

          setDevices(uniqueDevices);

        } else {
          setDevices([]);
        }
      } catch (err) {
        console.error(err);
        setDevices([]);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };


    fetchCanvasNodes(); // initial fetch
    interval = setInterval(fetchCanvasNodes, 1000);

    return () => {
      clearInterval(interval); // important: clean up on canvas change
    };
  }, [selectedCanvasId, navigate, initialLoading]);

  // Find selected canvas layout from list
  const selectedCanvasLayout = canvasLayouts.find(
    (c) => String(c.canvasId) === String(selectedCanvasId) || String(c._id) === String(selectedCanvasId)
  );


  const totalCount = devices.length;
  const onCount = devices.filter((d) => d.isOn).length;
  const offCount = totalCount - onCount;


  // Prepare devices for the selected layout
  // Prepare devices for the selected layout
  const layoutDevices = devices.filter((device) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      device.switchName?.toLowerCase().includes(query) ||
      device.address?.toLowerCase().includes(query) ||
      device._id?.toLowerCase().includes(query);

    const matchesPower =
      isOnFilter === "all" ||
      (isOnFilter === "on" && device.isOn) ||
      (isOnFilter === "off" && !device.isOn);
    return matchesSearch && matchesPower;
  });

  // Count health statuses
  const healthStatusCounts = layoutDevices.reduce((acc, device) => {
    const status = (device.health_status || "ok").toLowerCase();
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const handleToggleSwitch = async (address, newIsOn) => {
    const token = localStorage.getItem("authToken");
    const email = getEmailFromToken();

    try {
      // Find device with matching address
      const toggledDevice = devices.find(d => d.address === address);
      if (!toggledDevice) {
        throw new Error(`Device with address ${address} not found`);
      }

      // Optimistically update UI using _id
      setDevices(prevDevices =>
        prevDevices.map(device =>
          device._id === toggledDevice._id ? { ...device, isOn: newIsOn } : device
        )
      );

      // Send update to backend using MongoDB _id
      const response = await fetch(`http://localhost:5000/api/canvas/nodes/${toggledDevice._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isOn: newIsOn }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update device ${toggledDevice._id}`);
      }

      // After successful update, log the action
      await fetch("http://localhost:5000/api/logs/switch-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          brokerUrl: toggledDevice.brokerUrl,
          address: toggledDevice.address,
          switchName: toggledDevice.switchName,
          isOn: newIsOn,
          health_status: "OK",
        }),
      });
    } catch (error) {
      console.error(error);
      alert("Failed to save toggle state. Please try again.");

      // Revert UI on error
      setDevices(prevDevices =>
        prevDevices.map(device =>
          device.address === address ? { ...device, isOn: !newIsOn } : device
        )
      );
    }
  };



  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const email = getEmailFromToken();
    if (!token || !email) {
      navigate("/login");
      return;
    }

    async function fetchCanvasList() {
      try {
        const res = await fetch("http://localhost:5000/api/canvas/list", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch canvas list");
        const data = await res.json();
        setCanvasLayouts(data);
        if (!selectedCanvasId && data.length > 0) {
          const firstCanvas = data[0];
          const defaultId = firstCanvas.canvasId || firstCanvas._id;
          setSelectedCanvasId(defaultId);
          localStorage.setItem("selectedCanvasId", defaultId); // Make sure to sync it
        }

      } catch (err) {
        console.error(err);
      }
    }
    fetchCanvasList();
  }, [navigate]);

  useEffect(() => {
    if (selectedCanvasId) {
      localStorage.setItem("selectedCanvasId", selectedCanvasId);
    } else {
      localStorage.removeItem("selectedCanvasId");
    }
  }, [selectedCanvasId]);

  useEffect(() => {
    if (selectedCanvasId && canvasLayouts.length) {
      if (selectedCanvasId === "all") {
        // allow "all" without resetting
        localStorage.setItem("selectedCanvasId", "all");
        return;
      }

      const found = canvasLayouts.some(
        (c) => String(c.canvasId) === String(selectedCanvasId) || String(c._id) === String(selectedCanvasId)
      );
      if (!found) {
        const defaultId = canvasLayouts[0]?.canvasId || canvasLayouts[0]?._id || "";
        setSelectedCanvasId(String(defaultId));
        localStorage.setItem("selectedCanvasId", String(defaultId));
      }
    }
  }, [canvasLayouts, selectedCanvasId]);





  function StatusItem({ Icon, label, count, colorClass }) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={colorClass} size={18} />
          <span className="text-base font-medium">{label}</span>
        </div>
        <span className={`text-base font-semibold ${colorClass}`}>{count}</span>
      </div>
    );
  }

  const toggleDeviceOnOff = async (device) => {
    const id = device.address;

    if (togglingIds.has(id) || device.locked) return;

    setTogglingIds((prev) => new Set(prev).add(id));

    try {
      await handleToggleSwitch(id, !device.isOn);
    } finally {
      setTogglingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleLockToggle = async (device) => {
    const token = localStorage.getItem("authToken");
    const updatedLock = !device.locked;

    if (!selectedCanvasId) {
      toast.error("Missing canvasId for device");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/canvas/${selectedCanvasId}/nodes/${device.id}/lock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ locked: updatedLock }),
      });

      if (!res.ok) throw new Error("Failed to toggle lock");

      setDevices(prev =>
        prev.map(d => (d.id === device.id ? { ...d, locked: updatedLock } : d))
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle lock status.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        activePath={location.pathname}
      />

      <main className={`flex-1 transition-[margin-left] duration-300 ease-in-out text-gray-800 dark:text-gray-200 ${collapsed ? "ml-[60px]" : "ml-[220px]"}`}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t("Dashboard")}
            </h1>
            {/* <Link
              to="/add_devices"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              {t("Add Device")}
            </Link> */}
          </div>

          {/* Cards Grid */}
          <div className="flex flex-wrap mt-4 gap-7">
            <div>
              <ShortcutCard title={t("currentDevices")}>
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

          {/* Device Filter Bar */}
          <DeviceFilterBar
            t={t}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isOnFilter={isOnFilter}
            setIsOnFilter={setIsOnFilter}
            selectedCanvasId={selectedCanvasId}
            setSelectedCanvasId={setSelectedCanvasId}
            canvasLayouts={canvasLayouts}
            onRenameCanvas={handleRenameCanvas}
            onDeleteCanvas={handleDeleteCanvas}
          />



          {/* Device Cards Grid */}
          <div className="grid grid-cols-1 gap-4 mt-2 sm:grid-cols-2 lg:grid-cols-3">
            {initialLoading ? (
              <div className="flex items-center justify-center py-10 col-span-full">
                <RefreshCcw className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : layoutDevices.length === 0 ? (
              <p>{t("No switches found.")}</p>
            ) : (
              layoutDevices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  toggleDeviceOnOff={toggleDeviceOnOff}
                  isToggling={togglingIds.has(device.id)}
                  onConfigureClick={openConfigure}
                  canvasId={selectedCanvasId}
                  handleLockToggle={handleLockToggle}
                />
              ))

            )}
          </div>
          <SettingsModal
            t= {t}
            isOpen={configureVisible}
            device={selectedDevice}
            onClose={closeConfigure}
            onSave={handleSaveSettings}
          />
        </div>
      </main>
    </div>
  );
}
