const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const mqtt = require("mqtt");

const LogRoute = require("./routes/logs");
const UserRoute = require("./routes/users");
const canvasRoutes = require("./routes/canvas");
const CanvasLayout = require("./model/CanvasLayout");


dotenv.config();

// ============ Express Setup ============

const allowedOrigins = ["http://localhost:3000"];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error(`CORS denied from: ${origin}`), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use("/images", express.static(path.join(__dirname, "/images")));
app.use(express.json());

// ============ MongoDB Connection ============

mongoose.connect(process.env.MONGO_DB_URL)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    connectToDeviceMQTTs(); // Start MQTT clients after DB is ready
  })
  .catch((err) => console.error("❌ MongoDB connection error", err));

// ============ Routes ============

app.use("/api/logs", LogRoute);
app.use("/api/users", UserRoute);
app.use("/api/canvas", canvasRoutes);


app.listen("5000", () => {
  console.log("🚀 Devices backend API server is running on port 5000.");
});

// ============ MQTT Setup (Dynamic per Device) ============

const { subscribeToNode } = require("./mqttHelpers");


async function connectToDeviceMQTTs() {
  try {
    const canvasDocs = await CanvasLayout.find({ "nodes.brokerUrl": { $exists: true, $ne: null } });

    const devices = canvasDocs.flatMap(doc =>
      doc.nodes
        .filter(node => node.brokerUrl && node.address)
        .map(node => ({
          ...node.toObject(),
          canvasId: doc.canvasId,
          email: doc.email
        }))
    );

    if (!devices.length) {
      console.warn("⚠️ No MQTT devices found in canvas layouts.");
      return;
    }

    console.log(`📦 Found ${devices.length} devices with brokerUrl`);

    // Use your helper subscribeToNode here for each device
    for (const device of devices) {
      await subscribeToNode(device);
    }
  } catch (err) {
    console.error("❌ Failed to connect to MQTT brokers:", err.message);
  }
}
