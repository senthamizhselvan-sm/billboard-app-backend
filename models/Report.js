const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  imageUrl: String, // Keep for backwards compatibility
  imageUrls: [String], // Array of image URLs for multiple photos
  latitude: Number,
  longitude: Number,
  description: String,
  category: { type: String, default: "Other" },
  violations: {
    hasViolations: { type: Boolean, default: false },
    violatedWords: [String],
    detectedText: String,
    violationType: String,
    severity: String
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Report", reportSchema);