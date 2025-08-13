import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/users/send-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reset code.");
      setSuccessMsg("Verification code sent to your email.");
      setStep(2);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/users/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, code: form.code })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid verification code.");
      setStep(3);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          code: form.code,
          newPassword: form.newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password reset failed.");
      alert("Password has been reset successfully!");
      navigate("/login");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 bg-white rounded shadow-md dark:bg-gray-800">
        <h1 className="mb-6 text-2xl font-bold text-center text-gray-900 dark:text-white">
          Reset Password
        </h1>

        {step === 1 && (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div>
              <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {successMsg && <p className="text-sm text-green-500">{successMsg}</p>}

            <button
              type="submit"
              className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Send Verification Code
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div>
              <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
                Enter Verification Code
              </label>
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Verify Code
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
