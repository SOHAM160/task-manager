const mongoose = require("mongoose");

const tagSchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, default: "#6B7280" },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index: one tag name per user
tagSchema.index({ name: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Tag", tagSchema);
