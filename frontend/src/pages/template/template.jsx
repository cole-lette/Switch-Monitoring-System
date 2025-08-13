import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import { useLocation } from "react-router-dom"; 
import { useTranslation } from "react-i18next";
import { jwtDecode } from "jwt-decode";

export default function SwitchControl() {
  const { t } = useTranslation();
  // Initialize from localStorage or default to false
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true"; // convert string to boolean
  });

  useEffect(() => {
    // Save to localStorage whenever collapsed changes
    localStorage.setItem("sidebarCollapsed", collapsed);
  }, [collapsed]);

  const location = useLocation();

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
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Switch Control
            </h1>
          </div>
        </div>
      </main>
    </div>
  );
}
