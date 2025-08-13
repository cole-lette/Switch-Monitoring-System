import React, { useEffect, useState } from "react";
import { FaSun, FaMoon } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import "./ThemeToggle.css";
import jwtDecode from "jwt-decode";

export default function ThemeToggle({ collapsed }) {
  const { t } = useTranslation();
  const [darkMode, setDarkMode] = useState(null); // null = loading initial theme
  const [loading, setLoading] = useState(false);

  // Apply theme locally when darkMode changes (except when null)
  useEffect(() => {
    if (darkMode === null) return;
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Fetch initial theme from backend once on mount
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("No auth token found");
      // fallback localStorage
      setDarkMode(localStorage.getItem("theme") === "dark");
      return;
    }

    fetch(`http://localhost:5000/api/users/settings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch theme");
        return res.json();
      })
      .then(({ theme }) => {
        setDarkMode(theme === "dark");
      })
      .catch((err) => {
        console.error("Error fetching theme:", err);
        // fallback
        setDarkMode(localStorage.getItem("theme") === "dark");
      });
  }, []);

  // Toggle theme and update backend
  const toggleTheme = async () => {
    if (darkMode === null) return; // loading still

    const newTheme = !darkMode;
    setLoading(true);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No auth token found");
        setLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:5000/api/users/settings/theme`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ theme: newTheme ? "dark" : "light" }),
      });

      if (!response.ok) throw new Error("Failed to update theme");

      setDarkMode(newTheme);
    } catch (error) {
      console.error("Error updating theme:", error);
      alert(t("Failed to update theme preference"));
    } finally {
      setLoading(false);
    }
  };

  if (darkMode === null) {
    // You can return null or a loading spinner here if you want
    return null;
  }

  if (collapsed) {
    return (
      <button
        onClick={toggleTheme}
        aria-label={t("Toggle dark mode")}
        disabled={loading}
        className="theme-toggle-btn theme-toggle-collapsed"
      >
        {darkMode ? <FaMoon size={20} /> : <FaSun size={20} />}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={t("Toggle dark mode")}
      disabled={loading}
      className="theme-toggle-btn theme-toggle-expanded"
    >
      {darkMode ? <FaMoon /> : <FaSun />}
      <span>{darkMode ? t("Dark Mode") : t("Light Mode")}</span>
    </button>
  );
}
