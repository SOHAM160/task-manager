const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  inviteCode: {
    type: String,
    unique: true,
    default: () => uuidv4(),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Workspace", workspaceSchema);
