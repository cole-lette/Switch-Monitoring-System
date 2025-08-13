const mongoose = require("mongoose");

// Schema for individual switch node
const nodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  switchName: { type: String },
  response: { type: String },
  address: { type: String },
  online: { type: Boolean, default: false },
  part_number: { type: String },
  serial_number: { type: String },
  hw_version: { type: String },
  sw_version: { type: String },
  brokerUrl: { type: String },
  username: { type: String },
  password: { type: String },
  isOn: { type: Boolean, default: false },
  locked: {type: Boolean, default: true},

  // Power-related fields:
  voltageReading: { type: Number, default: 0 },
  amperageReading: { type: Number, default: 0 },
  active_power: { type: Number, default: 0 },     // in Watts
  apparent_power: { type: Number, default: 0 },   // in VA
  frequency: { type: Number, default: 0 },        // in Hz
  power_factor: { type: Number, default: 0 },
  reactive_power: { type: Number, default: 0 },   // in VAR

}, { _id: false });



// Schema for the full canvas layout
const canvasLayoutSchema = new mongoose.Schema({
  email: { type: String, required: true },
  canvasId: { type: String, required: true },
  canvasName: { type: String, default: "" },

  nodes: { type: [nodeSchema], default: [] },

  positions: {
    type: Map,
    of: new mongoose.Schema({
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    }, { _id: false }),
    default: new Map(),
  },

  connections: {
    type: [
      {
        fromNodeId: { type: String, required: true },
        fromAnchor: { type: String, required: true },
        toNodeId: { type: String, required: true },
        toAnchor: { type: String, required: true },
        color: { type: String, default: "#000000" },
        lineStyle: { type: String, enum: ["solid", "dashed", "dotted"], default: "solid" },
        arrowHead: { type: String, enum: ["default", "circle", "none"], default: "default" },
        lineType: { type: String, enum: ["bezier", "orthogonal", "straight"], default: "bezier" },
        strokeWidth: { type: Number, default: 2 },
        label: { type: String, default: "" },
      },
    ],
    default: [],
  },

  scale: { type: Number, default: 1 },

  translate: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
  },

  lastSaved: { type: Date, default: Date.now },
}, { timestamps: true });

canvasLayoutSchema.index({ email: 1, canvasId: 1 }, { unique: true });

module.exports = mongoose.model("CanvasLayout", canvasLayoutSchema);
