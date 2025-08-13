import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import jwtDecode from "jwt-decode";
import { toast } from "react-toastify";

const themes = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

const languages = [
  { label: "English", value: "en" },
  { label: "中文", value: "zh" },
];

const TextInput = ({ label, name, value, onChange, type = "text", ...props }) => {
  const { t } = useTranslation();
  return (
    <div>
      <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300" htmlFor={name}>
        {t(label)}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        {...props}
      />
    </div>
  );
};

const SelectInput = ({ label, name, value, onChange, options }) => {
  const { t } = useTranslation();
  return (
    <div>
      <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300" htmlFor={name}>
        {t(label)}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      >
        {options.map(({ label, value }) => (
          <option key={value} value={value}>
            {t(label)}
          </option>
        ))}
      </select>
    </div>
  );
};

const CheckboxInput = ({ label, name, checked, onChange }) => {
  const { t } = useTranslation();
  return (
    <label className="inline-flex items-center mr-6">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="form-checkbox"
      />
      <span className="ml-2 text-gray-700 dark:text-gray-300">{t(label)}</span>
    </label>
  );
};

function PopupMessage({ message, type, onClose }) {
  if (!message) return null;
  return (
    <div
      className={`fixed top-6 right-6 z-50 px-4 py-3 rounded shadow-lg text-white ${
        type === "error" ? "bg-red-600" : "bg-green-600"
      }`}
      role="alert"
      onClick={onClose}
      style={{ cursor: "pointer" }}
    >
      {message}
      <span className="ml-2 font-bold">×</span>
    </div>
  );
}

export default function ProfileSettings() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebarCollapsed") === "true");

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", collapsed);
  }, [collapsed]);

  // Profile and settings states
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    username: "",
    phoneNumber: "",
  });

  const [settings, setSettings] = useState({
    theme: "system",
    language: "en",
    notifications: { email: true },
    twoFactorEnabled: false,
  });

  // Password change states
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (["name", "email", "username", "phoneNumber"].includes(name)) {
      setProfile((prev) => ({ ...prev, [name]: value }));
    } else if (["theme", "language"].includes(name)) {
      setSettings((prev) => {
        const updated = { ...prev, [name]: value };
        if (name === "language") i18n.changeLanguage(value);
        return updated;
      });
    } else if (name === "emailNotifications") {
      setSettings((prev) => ({
        ...prev,
        notifications: { ...prev.notifications, email: checked },
      }));
    } else if (name === "twoFactorEnabled") {
      setSettings((prev) => ({ ...prev, twoFactorEnabled: checked }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  // Validate password form
  const validatePasswordChange = () => {
    const { currentPassword, newPassword, confirmNewPassword } = passwords;
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error(t("Please fill in all password fields."));
      return false;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error(t("New passwords do not match."));
      return false;
    }
    if (newPassword.length < 6) {
      toast.error(t("New password should be at least 6 characters."));
      return false;
    }
    return true;
  };

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/users/settings", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("authToken");
          navigate("/login");
          return;
        }

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch user data");

        setProfile({
          name: data.name || "",
          email: data.email || "",
          username: data.username || "",
          phoneNumber: data.phoneNumber || "",
        });

        setSettings({
          theme: data.theme || "system",
          language: data.language || "en",
          notifications: { email: data.notifications?.email ?? true },
          twoFactorEnabled: data.twoFactorEnabled ?? false,
        });

        if (data.language) i18n.changeLanguage(data.language);
      } catch (err) {
        console.error("Error fetching user data:", err);
        toast.error(t("Failed to load user data."));

      }
    };

    fetchUserData();
  }, [i18n, navigate]);

  // Submit profile/settings form
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/users/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name,
          username: profile.username,
          phoneNumber: profile.phoneNumber,
          theme: settings.theme,
          language: settings.language,
          notifications: settings.notifications,
          twoFactorEnabled: settings.twoFactorEnabled,
        }),
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("authToken");
        navigate("/login");
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings.");

      toast.success(t("Profile and settings saved!"));
    } catch (err) {
      console.error("Settings update error:", err);
      toast.error(t("An error occurred while saving settings."));
    }
  };

  // Submit password form
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswordChange()) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/users/change-password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("authToken");
        navigate("/login");
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("Password change failed."));
        return;
      }

      toast.success(data.message || t("Password changed successfully."));

      setPasswords({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (err) {
      console.error("Password change error:", err);
      toast.error(t("An error occurred while changing password."));

    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} activePath={location.pathname} />


      <main
        className={`flex-1 transition-all duration-300 text-gray-800 dark:text-gray-200 ${
          collapsed ? "ml-[60px]" : "ml-[220px]"
        }`}
      >
        <div className="max-w-4xl p-6 mx-auto">
          <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">{t("Profile & Settings")}</h1>

          {/* Profile & Settings Form */}
          <form
            onSubmit={handleProfileSubmit}
            className="p-6 mb-12 space-y-8 bg-white rounded-lg shadow-md dark:bg-gray-800"
          >
            <section>
              <h2 className="mb-4 text-xl font-semibold dark:text-white">{t("Profile")}</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <TextInput label="Name" name="name" value={profile.name} onChange={handleChange} required />
                <TextInput label="Email" name="email" value={profile.email} onChange={handleChange} type="email" disabled />
                <TextInput label="Username" name="username" value={profile.username} onChange={handleChange} required />
                <TextInput label="Phone Number" name="phoneNumber" value={profile.phoneNumber} onChange={handleChange} type="tel" />
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold dark:text-white">{t("Settings")}</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <SelectInput label="Theme" name="theme" value={settings.theme} onChange={handleChange} options={themes} />
                <SelectInput label="Language" name="language" value={settings.language} onChange={handleChange} options={languages} />
                <div className="md:col-span-2">
                  <span className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{t("Notifications")}</span>
                  <CheckboxInput
                    label="Email"
                    name="emailNotifications"
                    checked={settings.notifications.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="md:col-span-2">
                  <CheckboxInput
                    label="Enable Two-Factor Authentication"
                    name="twoFactorEnabled"
                    checked={settings.twoFactorEnabled}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </section>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleLogout}
                className="px-6 py-2 text-white transition-colors bg-red-600 rounded-md hover:bg-red-700"
              >
                {t("Log Out")}
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {t("Save Changes")}
              </button>
            </div>
          </form>

          {/* Password Change Form */}
          <form
            onSubmit={handlePasswordSubmit}
            className="p-6 space-y-8 bg-white rounded-lg shadow-md dark:bg-gray-800"
          >
            <h2 className="mb-4 text-xl font-semibold dark:text-white">{t("Change Password")}</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <TextInput
                label="Current Password"
                name="currentPassword"
                type="password"
                value={passwords.currentPassword}
                onChange={handlePasswordChange}
                required
              />
              <TextInput
                label="New Password"
                name="newPassword"
                type="password"
                value={passwords.newPassword}
                onChange={handlePasswordChange}
                required
              />
              <TextInput
                label="Confirm New Password"
                name="confirmNewPassword"
                type="password"
                value={passwords.confirmNewPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {t("Change Password")}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}