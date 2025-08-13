const express = require("express");
const router = express.Router();
const User = require("../model/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

// JWT authentication middleware
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, process.env.JWT_SECRET || "fallback_secret", (err, user) => {
    if (err) return res.status(403).json({ error: "Forbidden" });
    req.user = user;
    next();
  });
}

// GET /api/users/settings - fetch user profile & settings (protected)
router.get("/settings", authenticateJWT, async (req, res) => {
  try {
    const email = req.user.email;
    if (!email) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findOne({ email: new RegExp(`^${email}$`, "i") });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      name: user.name,
      email: user.email,
      username: user.username,
      phoneNumber: user.phoneNumber,
      theme: user.settings?.theme || "system",
      language: user.settings?.language || "en",
      notifications: {
        email: user.settings?.notifications?.email ?? true,
      },
      twoFactorEnabled: user.settings?.twoFactorEnabled || false,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/users/settings/theme - update theme (protected)
router.patch("/settings/theme", authenticateJWT, async (req, res) => {
  try {
    const email = req.user.email;
    const { theme } = req.body;

    if (!theme || !["light", "dark", "system"].includes(theme)) {
      return res.status(400).json({ error: "Invalid theme value" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.settings.theme = theme;
    await user.save();

    return res.json({ success: true, theme: user.settings.theme });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/users/profile - get full user info (protected)
router.get("/profile", authenticateJWT, async (req, res) => {
  try {
    const email = req.user.email;
    if (!email) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findOne({ email: new RegExp(`^${email}$`, "i") });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      name: user.name,
      email: user.email,
      username: user.username,
      phoneNumber: user.phoneNumber,
      settings: user.settings || {},
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/users/settings - update profile & settings (protected)
router.patch("/settings", authenticateJWT, async (req, res) => {
  try {
    const email = req.user.email;
    if (!email) return res.status(401).json({ error: "Unauthorized" });

    const {
      name,
      username,
      phoneNumber,
      theme,
      language,
      notifications,
      twoFactorEnabled,
    } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: "User not found" });

    const validThemes = ["light", "dark", "system"];
    if (theme && !validThemes.includes(theme)) {
      return res.status(400).json({ error: "Invalid theme value" });
    }

    if (language && typeof language !== "string") {
      return res.status(400).json({ error: "Invalid language value" });
    }

    if (notifications) {
      if (
        typeof notifications.email !== "undefined" &&
        typeof notifications.email !== "boolean"
      ) {
        return res.status(400).json({ error: "Invalid email notifications setting" });
      }
    }

    if (typeof twoFactorEnabled !== "undefined" && typeof twoFactorEnabled !== "boolean") {
      return res.status(400).json({ error: "Invalid two-factor setting" });
    }

    if (name) user.name = name;
    if (username) user.username = username;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    if (!user.settings) user.settings = {};

    if (theme) user.settings.theme = theme;
    if (language) user.settings.language = language;

    if (notifications?.email !== undefined) {
      if (!user.settings.notifications) user.settings.notifications = {};
      user.settings.notifications.email = notifications.email;
    }

    if (twoFactorEnabled !== undefined) {
      user.settings.twoFactorEnabled = twoFactorEnabled;
    }

    await user.save();

    return res.json({
      success: true,
      user: {
        name: user.name,
        username: user.username,
        phoneNumber: user.phoneNumber,
        email: user.email,
        settings: user.settings,
      },
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /signup (no auth)
router.post("/signup", async (req, res) => {
  const { email, name, password, username, phoneNumber } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({ error: "Email, name and password are required" });
  }

  try {
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(400).json({ error: "Email already registered" });
    }
    if (username && (await User.findOne({ username }))) {
      return res.status(400).json({ error: "Username already taken" });
    }

    const newUser = new User({
      email: email.toLowerCase(),
      name,
      password,
      username,
      phoneNumber,
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, name: newUser.name },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1d" }
    );

    res.status(201).json({
      message: "User created",
      authToken: token,
      email: newUser.email,
      name: newUser.name,
    });
  } catch (err) {
    console.error("Signup error:", err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({ error: `${field} already exists` });
    }
    res.status(500).json({ error: "Server error" });
  }
});

// POST /login (no auth)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      authToken: token,
      email: user.email,
      name: user.name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /change-password (protected)
router.patch("/change-password", authenticateJWT, async (req, res) => {
  try {
    const email = req.user.email;
    if (!email) return res.status(401).json({ error: "Unauthorized" });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });

    if (newPassword.length < 6)
      return res.status(400).json({ error: "New password must be at least 6 characters" });

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Error changing password:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// In-memory store for reset tokens (consider DB or Redis in production)
const resetTokens = new Map();

// POST /send-reset-code
router.post("/send-reset-code", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Generate 6-digit code and expiry time (15 mins)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 15 * 60 * 1000;

    resetTokens.set(email.toLowerCase(), { code, expires });

    // Configure nodemailer transport
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "live.smtp.mailtrap.io",
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,  // use STARTTLS on port 587 (false means STARTTLS, not SSL/TLS)
      auth: {
        user: process.env.MAILTRAP_USER || process.env.EMAIL_USER,  // your Mailtrap SMTP username (e.g. 'apismtp@mailtrap.io')
        pass: process.env.MAILTRAP_PASS || process.env.EMAIL_PASS,  // your Mailtrap SMTP API token
      },
      tls: {
        rejectUnauthorized: false, // accept self-signed certs - common for sandbox/testing SMTP
      },
    });



    // Send email with the code
    await transporter.sendMail({
      from: '"Switch Control Dashboard" <hello@demomailtrap.co>',  // Use a valid sender email (can be fake for Mailtrap sandbox)
      to: email,
      subject: "Your Password Reset Code",
      html: `<p>Your password reset code is: <strong>${code}</strong></p>`,
    });

    res.json({ message: "Reset code sent" });
  } catch (err) {
    console.error("Send reset code error:", err);
    res.status(500).json({ error: "Failed to send reset code" });
  }
});

// POST /verify-reset-code
router.post("/verify-reset-code", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "Email and code are required" });
  }

  const record = resetTokens.get(email.toLowerCase());
  if (!record || record.code !== code || Date.now() > record.expires) {
    return res.status(400).json({ error: "Invalid or expired reset code" });
  }

  res.json({ message: "Code verified" });
});

// POST /reset-password
router.post("/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: "Email, code and new password are required" });
  }

  const record = resetTokens.get(email.toLowerCase());
  if (!record || record.code !== code || Date.now() > record.expires) {
    return res.status(400).json({ error: "Invalid or expired reset code" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.password = newPassword;
    await user.save();

    resetTokens.delete(email.toLowerCase());
    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;
