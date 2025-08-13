const express = require("express");
const router = express.Router();
const Log = require("../model/Logs");
const authenticateJWT = require("../middleware/authenticateJWT");

const requireAuth = authenticateJWT;

// GET /api/logs?limit=5
router.get("/", requireAuth, async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 0;

  try {
    // Instead of accepting email from query, use email from authenticated user
    const userEmail = req.user.email;

    let logsQuery = Log.find({ email: userEmail }).sort({ timestamp: -1 });

    if (limit > 0) {
      logsQuery = logsQuery.limit(limit);
    }

    const logs = await logsQuery;

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch logs" });
  }
});

// DELETE /api/logs/:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    // Optional: You can add a check here to ensure the log belongs to the user
    const log = await Log.findById(req.params.id);

    if (!log) {
      return res.status(404).json({ message: "Log not found" });
    }

    // Check ownership before deleting (important for security)
    if (log.email !== req.user.email) {
      return res.status(403).json({ message: "Unauthorized to delete this log" });
    }

    await Log.findByIdAndDelete(req.params.id);

    res.json({ message: "Log deleted" });
  } catch (err) {
    console.error("Error deleting log:", err);
    res.status(500).json({ message: "Failed to delete log" });
  }
});

// POST /api/logs/switch-action
router.post("/switch-action", requireAuth, async (req, res) => {
  const {
    brokerUrl,
    address,
    switchName,
    isOn,
    health_status,
  } = req.body;

  const email = req.user.email;

  console.log("Received switch-action POST:", { email, brokerUrl, address, switchName, isOn, health_status });

  // Basic validation for required fields
  if (!email || !brokerUrl || !address || !switchName || typeof isOn !== "boolean") {
    console.warn("Missing required fields in switch-action POST");
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const message = `Switch "${switchName}" turned ${isOn ? "ON" : "OFF"}`;

    const newLog = new Log({
      email,
      message,
      brokerUrl,
      address,
      switchName,
      health_status: ["OK", "CAUTION", "WARNING"].includes(health_status) ? health_status : "OK",
      timestamp: new Date(),
    });

    await newLog.save();

    res.status(201).json({ message: "Log created", log: newLog });
  } catch (err) {
    console.error("Error creating switch log:", err);
    res.status(500).json({ message: "Failed to create switch log" });
  }
});


module.exports = router;
