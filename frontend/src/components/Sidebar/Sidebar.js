import React, { useEffect } from "react";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../../locale/i18n";
import { jwtDecode } from "jwt-decode";

import {
  FaHome,
  FaTachometerAlt,
  FaBell,
  FaClipboardList,
  FaCog,
  FaBars,
  FaProjectDiagram ,
} from "react-icons/fa";
import "./Sidebar.css";

export default function Sidebar({ collapsed, setCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("No auth token found");
      return;
    }

    let email = "";
    try {
      const decoded = jwtDecode(token);
      email = decoded.email;
      if (!email) {
        console.error("Email not found in token");
        return;
      }
    } catch (err) {
      console.error("Invalid auth token", err);
      return;
    }

    fetch(`http://localhost:5000/api/users/settings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user settings");
        return res.json();
      })
      .then((data) => {
        if (data.language && data.language !== i18n.language) {
          i18n.changeLanguage(data.language);
        }
      })
      .catch((err) => {
        console.error("Error fetching user settings:", err);
      });
  }, []);

  const menuItems = [
    { icon: <FaHome />, labelKey: "Home", path: "/" },
    { icon: <FaTachometerAlt />, labelKey: "Dashboard", path: "/dashboard" },
    { icon: <FaProjectDiagram  />, labelKey: "Switch Control", path: "/switch-control" },
    { icon: <FaClipboardList />, labelKey: "Logs", path: "/logs" },
    { icon: <FaCog />, labelKey: "Profile & Settings", path: "/profile_settings" },
  ];

  return (
    <nav
      className={`sidebar ${collapsed ? "sidebar-collapsed" : "sidebar-expanded"}`}
      style={{ width: collapsed ? 60 : 220 }}
      aria-label={t("Sidebar navigation")}
    >
      {/* Logo and Hamburger */}
      <div className="logo-hamburger">
        {!collapsed && (
          <img
            src="/images/chintLogo.png"
            alt={t("CHINT Logo")}
            className="logo-img"
          />
        )}
        <button
          className={`hamburger-btn ${collapsed ? "mx-auto" : ""}`}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? t("Expand sidebar") : t("Collapse sidebar")}
        >
          <FaBars size={20} className="text-indigo-600 dark:text-indigo-400" />
        </button>
      </div>

      {/* Menu items */}
      <div className="menu-items">
        {menuItems.map(({ icon, labelKey, path }) => {
          const isActive = location.pathname === path;
          return (
            <div
              key={labelKey}
              tabIndex={0}
              className={`menu-item ${collapsed ? "collapsed" : "expanded"} ${isActive ? "active" : ""}`}
              onClick={() => navigate(path)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  navigate(path);
                }
              }}
              role="button"
              aria-current={isActive ? "page" : undefined}
            >
              <span className="menu-icon">{icon}</span>
              {!collapsed && <span className="menu-label">{t(labelKey)}</span>}
              {collapsed && (
                <span className="tooltip" role="tooltip">
                  {t(labelKey)}
                </span>
              )}
            </div>
          );
        })}

        {/* Theme toggle switch */}
        <div className={`theme-toggle-container ${collapsed ? "collapsed" : ""}`}>
          <ThemeToggle collapsed={collapsed} />
        </div>
      </div>
    </nav>
  );
}
