const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  email: { type: String, required: true },               
  message: { type: String, required: true },             
  brokerUrl: { type: String, required: true },             
  address: { type: String, required: true },            
  switchName: { type: String, required: true },          
  health_status: { type: String, enum: ["OK", "CAUTION", "WARNING"], default: "OK" },
});

module.exports = mongoose.model("Logs", logSchema);
