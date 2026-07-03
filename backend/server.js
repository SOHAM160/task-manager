const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

// Try loading from root .env and then local backend/.env
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const authRoutes = require("./routes/auth.routes");
const taskRoutes = require("./routes/task.routes");
const tagRoutes = require("./routes/tag.routes");
const workspaceRoutes = require("./routes/workspace.routes");
const scheduleRoutes = require("./routes/schedule.routes");
const aiRoutes = require("./routes/ai.routes");
const notificationRoutes = require("./routes/notification.routes");
const dependencyRoutes = require("./routes/dependency.routes");

const app = express();

// Trust proxy in production (needed for secure cookies behind Render/Railway reverse proxy)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dependencies", dependencyRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server first, and connect to database asynchronously
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  console.log("Connecting to MongoDB Database...");
  mongoose
    .connect(process.env.DATABASE_URL)
    .then(() => {
      console.log("✅ Connected to MongoDB Atlas");
    })
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err.message);
      console.log("⚠️  Note: Backend server is running but database operations will fail until connection is resolved.");
    });
});

