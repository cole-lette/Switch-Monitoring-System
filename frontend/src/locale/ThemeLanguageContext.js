import React, { createContext, useState, useEffect } from "react";
import i18n from "./i18n";

export const ThemeLanguageContext = createContext();

export function ThemeLanguageProvider({ children }) {
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const [language, setLanguage] = useState(i18n.language);

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    if (language !== i18n.language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  return (
    <ThemeLanguageContext.Provider value={{ darkMode, setDarkMode, language, setLanguage }}>
      {children}
    </ThemeLanguageContext.Provider>
  );
}
