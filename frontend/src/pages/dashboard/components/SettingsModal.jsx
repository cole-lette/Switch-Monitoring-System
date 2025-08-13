import React, { useState, useEffect, useRef } from "react";

export default function DashboardSettingsModal({ device, onClose, onSave, t }) {
  const [formData, setFormData] = useState({
    switchName: "",
    address: "",
    part_number: "",
    hw_version: "",
    sw_version: "",
    brokerUrl: "",
    username: "",
    password: "",
  });

  const modalRef = useRef(null);

  useEffect(() => {
    if (device) {
      setFormData({
        switchName: device.switchName || "",
        address: device.address || "",
        part_number: device.part_number || "",
        hw_version: device.hw_version || "",
        sw_version: device.sw_version || "",
        brokerUrl: device.brokerUrl || "",
        username: device.username || "",
        password: device.password || "",
      });
    }
  }, [device]);

  const handleClickOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (onSave) onSave({ ...device, ...formData });
    onClose();
  };

  if (!device) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="relative w-full max-w-3xl p-6 bg-white shadow-xl rounded-3xl dark:bg-gray-900 dark:text-gray-200"
        style={{ maxHeight: "90vh" }}
      >
        <h2 className="mb-4 text-2xl font-extrabold text-gray-900 dark:text-white">
          {t("Device Settings")}
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {/* Device Name */}
          <section className="md:col-span-2">
            <label
              htmlFor="name"
              className="block mb-1 text-lg font-semibold text-gray-700 dark:text-gray-300"
            >
              {t("Device Name")}
            </label>
            <input
              id="switchName"
              name="switchName"
              type="text"
              value={formData.switchName}
              onChange={handleChange}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder={t("Enter device name")}
            />
          </section>

          {/* Device Parameters */}
          <section>
            <h3 className="mb-3 text-lg font-semibold text-gray-700 dark:text-gray-300">
              {t("Device Info")}
            </h3>
            {[
              { label: t("Device ID"), name: "address" },
              { label: t("Part Number"), name: "part_number" },
              { label: t("HW Version"), name: "hw_version" },
              { label: t("SW Version"), name: "sw_version" },
            ].map(({ label, name }) => (
              <div key={name} className="flex flex-col mb-3">
                <label
                  htmlFor={name}
                  className="mb-1 font-medium text-gray-600 dark:text-gray-400"
                >
                  {label}
                </label>
                <input
                  id={name}
                  name={name}
                  type="text"
                  value={formData[name]}
                  onChange={handleChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-blue-400 dark:focus:ring-blue-500"
                />
              </div>
            ))}
          </section>

          {/* MQTT Settings */}
          <section>
            <h3 className="mb-3 text-lg font-semibold text-gray-700 dark:text-gray-300">
              {t("MQTT Settings")}
            </h3>
            {[
              { label: t("Broker URL"), name: "brokerUrl" },
              { label: t("Username"), name: "username" },
              { label: t("Password"), name: "password", type: "password" },
            ].map(({ label, name, type = "text" }) => (
              <div key={name} className="flex flex-col mb-3">
                <label
                  htmlFor={name}
                  className="mb-1 font-medium text-gray-600 dark:text-gray-400"
                >
                  {label}
                </label>
                <input
                  id={name}
                  name={name}
                  type={type}
                  value={formData[name]}
                  onChange={handleChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-blue-400 dark:focus:ring-blue-500"
                  autoComplete={type === "password" ? "new-password" : "off"}
                />
              </div>
            ))}
          </section>

          {/* Buttons */}
          <div className="flex justify-end gap-4 mt-4 md:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              {t("Cancel")}
            </button>
            <button
              type="submit"
              className="px-6 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
            >
              {t("Save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
