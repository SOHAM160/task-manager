const Task = require("../models/Task");
const { fcfs, priorityScheduling, edf, roundRobin } = require("../utils/scheduler");

// GET /api/schedule?algo=fcfs
exports.getSchedule = async (req, res) => {
  try {
    const user = req.user;
    const algo = req.query.algo || "fcfs";

    const { workspaceId } = req.query;

    const filter = { completed: false };
    if (workspaceId && workspaceId !== "null" && workspaceId !== "undefined") {
      filter.workspaceId = workspaceId;
    } else {
      filter.userId = user._id;
      filter.workspaceId = null;
    }

    const tasks = await Task.find(filter).lean();

    // Normalize _id to id for frontend
    const normalized = tasks.map((t) => ({
      ...t,
      id: t._id.toString(),
    }));

    let result;
    switch (algo) {
      case "priority":
        result = priorityScheduling(normalized);
        break;
      case "edf":
        result = edf(normalized);
        break;
      case "roundrobin":
        result = roundRobin(normalized);
        break;
      default:
        result = fcfs(normalized);
    }

    return res.json(result);
  } catch (err) {
    console.error("[SCHEDULE_ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
