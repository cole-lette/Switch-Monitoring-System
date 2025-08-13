import React from "react";
import { Cpu, Grid, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function QuickLinks() {
  const { t } = useTranslation();

  const shortcuts = [
    {
      title: t("Dashboard"),
      icon: Cpu,
      path: "/dashboard",
      color: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    {
      title: t("Switch Control Builder"),
      icon: Grid,
      path: "/switch-control",
      color: "bg-purple-600 hover:bg-purple-700 text-white",
    },
    {
      title: t("Settings"),
      icon: ShieldCheck,
      path: "/profile_settings",
      color: "bg-yellow-600 hover:bg-yellow-700 text-white",
    },
  ];

  return (
    <div className="w-full max-w-screen-lg mt-8">
      <h2 className="mb-4 text-xl font-semibold">{t("Quick Links")}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {shortcuts.map(({ title, icon: Icon, path, color }) => (
          <Link
            key={title}
            to={path}
            className={`flex items-center gap-3 p-4 rounded-lg shadow-md transition duration-200 ${color}`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-sm font-medium">{title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
