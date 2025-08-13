import React, { useState, useEffect, useRef } from "react";

export default function SettingsModal({ node, onClose, onSave, t }) {
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
    if (node) {
      setFormData({
        switchName: node.switchName || "",
        address: node.address || "",
        part_number: node.part_number || "",
        hw_version: node.hw_version || "",
        sw_version: node.sw_version || "",
        brokerUrl: node.brokerUrl || "",
        username: node.username || "",
        password: node.password || "",
      });
    }
  }, [node]);

  const handleClickOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (onSave) onSave(formData);
    onClose();
  };

  if (!node) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-labelledby="settings-modal-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-3xl p-6 bg-white shadow-xl rounded-3xl dark:bg-gray-900 dark:text-gray-200"
        style={{ maxHeight: "90vh" }}
      >
        <h2
          id="settings-modal-title"
          className="mb-4 text-2xl font-extrabold text-gray-900 dark:text-white"
        >
          {t("Switch Settings")}
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {/* Switch Name Field */}
          <section className="md:col-span-2">
            <label
              htmlFor="switchName"
              className="block mb-1 text-lg font-semibold text-gray-700 dark:text-gray-300"
            >
              {t("Switch Name")}
            </label>
            <input
              id="switchName"
              name="switchName"
              type="text"
              value={formData.switchName}
              onChange={handleChange}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:focus:ring-blue-400"
              autoComplete="off"
              onKeyDown={(e) => e.stopPropagation()}
              placeholder={t("Enter switch name")}
            />
          </section>

          {/* Device Parameters Section */}
          <section>
            <h3 className="mb-3 text-lg font-semibold text-gray-700 dark:text-gray-300">
              {t("Device Parameters")}
            </h3>

            {[
              { label: "Device ID", name: "address" },
              { label: "Part Number", name: "part_number" },
              { label: "HW Version", name: "hw_version" },
              { label: "SW Version", name: "sw_version" },
            ].map(({ label, name }) => (
              <div key={name} className="flex flex-col mb-3">
                <label
                  htmlFor={name}
                  className="mb-1 font-medium text-gray-600 dark:text-gray-400"
                >
                  {t(label)}
                </label>
                <input
                  id={name}
                  name={name}
                  type="text"
                  value={formData[name]}
                  onChange={handleChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:border-gray-700 dark:focus:ring-blue-500"
                  autoComplete="off"
                />
              </div>
            ))}
          </section>

          {/* MQTT Settings Section */}
          <section>
            <h3 className="mb-3 text-lg font-semibold text-gray-700 dark:text-gray-300">
              {t("MQTT Settings")}
            </h3>

            {[
              { label: "Broker URL", name: "brokerUrl" },
              { label: "Username", name: "username" },
              { label: "Password", name: "password", type: "password" },
            ].map(({ label, name, type = "text" }) => (
              <div key={name} className="flex flex-col mb-3">
                <label
                  htmlFor={name}
                  className="mb-1 font-medium text-gray-600 dark:text-gray-400"
                >
                  {t(label)}
                </label>
                <input
                  id={name}
                  name={name}
                  type={type}
                  value={formData[name]}
                  onChange={handleChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:border-gray-700 dark:focus:ring-blue-500"
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
              className="px-6 py-2 font-semibold text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              {t("Cancel")}
            </button>
            <button
              type="submit"
              className="px-6 py-2 font-semibold text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
            >
              {t("Save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
