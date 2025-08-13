import React from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";

export default function DeviceInfoModal({ device, onClose, t }) {
  if (!device) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return ReactDOM.createPortal(
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl p-8 mx-4 overflow-y-auto bg-white rounded-2xl shadow-xl dark:bg-gray-900 max-h-[90vh]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label={t("Close")}
          className="absolute p-2 transition rounded-full top-5 right-5 hover:bg-red-100 dark:hover:bg-red-700"
        >
          <X size={26} className="text-gray-600 dark:text-gray-300" />
        </button>

        <h2 className="mb-8 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          {t("Device Details")}
        </h2>

        {/* Power Status Section */}
        <section className="mb-10">
          <h3 className="pb-2 mb-4 text-2xl font-semibold text-gray-800 border-b border-gray-300 dark:text-gray-200 dark:border-gray-700">
            {t("Power Status")}
          </h3>
          <div className="grid grid-cols-2 gap-6 text-sm text-gray-700 dark:text-gray-300 sm:grid-cols-3">
            <div className="flex flex-col p-4 space-y-1 border border-green-200 rounded-lg bg-green-50 dark:bg-green-900/30 dark:border-green-700">
              <span className="font-semibold">{t("Voltage")}</span>
              <span className="text-lg font-bold">{device.voltageReading ?? t("N/A")} V</span>
            </div>
            <div className="flex flex-col p-4 space-y-1 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 dark:border-yellow-700">
              <span className="font-semibold">{t("Current")}</span>
              <span className="text-lg font-bold">{device.amperageReading ?? t("N/A")} A</span>
            </div>
            <div className="flex flex-col p-4 space-y-1 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/30 dark:border-red-700">
              <span className="font-semibold">{t("Active Power")}</span>
              <span className="text-lg font-bold">{device.active_power ?? t("N/A")} W</span>
            </div>
            <div className="flex flex-col p-4 space-y-1 border border-indigo-200 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-700">
              <span className="font-semibold">{t("Apparent Power")}</span>
              <span className="text-lg font-bold">{device.apparent_power ?? t("N/A")} VA</span>
            </div>
            <div className="flex flex-col p-4 space-y-1 border border-purple-200 rounded-lg bg-purple-50 dark:bg-purple-900/30 dark:border-purple-700">
              <span className="font-semibold">{t("Reactive Power")}</span>
              <span className="text-lg font-bold">{device.reactive_power ?? t("N/A")} VAR</span>
            </div>
            <div className="flex flex-col p-4 space-y-1 border rounded-lg bg-cyan-50 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-700">
              <span className="font-semibold">{t("Frequency")}</span>
              <span className="text-lg font-bold">{device.frequency ?? t("N/A")} Hz</span>
            </div>
            <div className="flex flex-col col-span-2 p-4 space-y-1 border border-pink-200 rounded-lg bg-pink-50 dark:bg-pink-900/30 dark:border-pink-700 sm:col-span-1">
              <span className="font-semibold">{t("Power Factor")}</span>
              <span className="text-lg font-bold">{device.power_factor ?? t("N/A")}</span>
            </div>
          </div>
        </section>

        {/* Device Info Section */}
        <section>
          <h3 className="pb-2 mb-4 text-2xl font-semibold text-gray-800 border-b border-gray-300 dark:text-gray-200 dark:border-gray-700">
            {t("Device Info")}
          </h3>
          <div className="grid grid-cols-1 gap-4 text-sm text-gray-700 dark:text-gray-300 sm:grid-cols-2">
            <div className="flex justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
              <span className="font-semibold">{t("Name")}:</span>
              <span>{device.switchName ?? t("N/A")}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
              <span className="font-semibold">{t("Device ID")}:</span>
              <span>{device.id ?? t("N/A")}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
              <span className="font-semibold">{t("Address")}:</span>
              <span>{device.address ?? t("N/A")}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
              <span className="font-semibold">{t("Online")}:</span>
              <span>{device.online ? t("Yes") : t("No")}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
              <span className="font-semibold">{t("Part Number")}:</span>
              <span>{device.part_number ?? t("N/A")}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
              <span className="font-semibold">{t("Serial Number")}:</span>
              <span>{device.serial_number ?? t("N/A")}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
              <span className="font-semibold">{t("HW Version")}:</span>
              <span>{device.hw_version ?? t("N/A")}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
              <span className="font-semibold">{t("SW Version")}:</span>
              <span>{device.sw_version ?? t("N/A")}</span>
            </div>
          </div>
        </section>
      </div>
    </div>,
    document.body
  );
}
