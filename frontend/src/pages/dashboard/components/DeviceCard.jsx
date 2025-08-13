import React, { useState } from "react";
import { Plug, PowerOff, Zap, Activity, Flashlight, Info, Lock, Unlock } from "lucide-react";
import { useTranslation } from "react-i18next";
import DeviceInfoModal from "./DeviceInfoModal"; // Adjust path if needed

export default function DeviceCard({ device, toggleDeviceOnOff, isToggling, onConfigureClick, canvasId, handleLockToggle }) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div
      className={`relative flex flex-col justify-between p-5 rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.01] transition-transform duration-300
        ${device.isOn ? "bg-green-50 dark:bg-gray-800/50 border border-green-400/30" : "bg-gray-100 dark:bg-gray-800 border border-red-400/30"}`}
    >
      {/* Info + Lock/Unlock icons */}
      <div className="absolute flex gap-2 top-3 right-3">
        {/* Info Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-1 transition rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label={t("Device info")}
        >
          <Info size={20} className="text-gray-600 dark:text-gray-300" />
        </button>

        {/* Lock/Unlock Button */}
        <button
          onClick={() => handleLockToggle(device)}
          className="p-1 transition rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label={device.locked ? t("Unlock") : t("Lock")}
        >
          {device.locked ? (
            <Lock size={20} className="text-gray-600 dark:text-gray-300" />
          ) : (
            <Unlock size={20} className="text-gray-600 dark:text-gray-300" />
          )}
        </button>

      </div>


      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{device.switchName}</h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{t("Address")}: {device.address || "N/A"}</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mt-4 text-sm text-gray-700 dark:text-gray-300">
        {/* Voltage */}
        <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm dark:bg-gray-700">
          <div className="flex items-center gap-1 text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-300">
            <Zap size={14} className="text-green-500" />
            {t("Voltage")}
          </div>
          <div className="text-base font-bold text-green-600 dark:text-green-400">
            {device.voltageReading} V
          </div>
        </div>

        {/* Current */}
        <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm dark:bg-gray-700">
          <div className="flex items-center gap-1 text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-300">
            <Activity size={14} className="text-yellow-500" />
            {t("Current")}
          </div>
          <div className="text-base font-bold text-yellow-600 dark:text-yellow-400">
            {device.amperageReading} A
          </div>
        </div>

        {/* Power */}
        <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm dark:bg-gray-700">
          <div className="flex items-center gap-1 text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-300">
            <Flashlight size={14} className="text-red-500" />
            {t("Power")}
          </div>
          <div className="text-base font-bold text-red-600 dark:text-red-400">
            {(device.apparent_power).toFixed(2)} W
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-3 pt-5 mt-auto">
        <button
          onClick={() => toggleDeviceOnOff(device)}
          disabled={isToggling || Boolean(device.locked)}
          
          className={`w-1/2 flex items-center justify-center gap-2 px-3 py-2 rounded text-white font-semibold text-sm transition-colors
    ${device.isOn ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
    disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {device.isOn ? <><Plug size={18} />{t("ON")}</> : <><PowerOff size={18} />{t("OFF")}</>}
        </button>


        <button
          onClick={() => onConfigureClick(device)}
          className="w-1/2 px-3 py-2 text-sm font-semibold text-center text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          {t("Configure")}
        </button>
      </div>

      {/* Device Info Modal */}
      {isModalOpen && (
        <DeviceInfoModal
          device={device}        // pass entire device object here
          onClose={() => setIsModalOpen(false)}
          t={t}
        />
      )}

    </div>
  );
}

