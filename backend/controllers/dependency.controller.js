const Task = require("../models/Task");
const {
  detectCycle,
  topologicalSort,
  criticalPath,
  wouldCreateCycle,
} = require("../utils/graph");

/**
 * Helper: Build adjacency list from tasks for the current user/workspace
 */
async function buildAdjList(userId, workspaceId) {
  const filter = { parentTaskId: null };
  if (workspaceId && workspaceId !== "null" && workspaceId !== "undefined") {
    filter.workspaceId = workspaceId;
  } else {
    filter.userId = userId;
    filter.workspaceId = null;
  }

  const tasks = await Task.find(filter)
    .select("title status completed dependsOn estimatedTime priority deadline")
    .lean();

  const allIds = tasks.map((t) => t._id.toString());
  const adjList = new Map();
  const taskMap = new Map();

  tasks.forEach((t) => {
    const id = t._id.toString();
    taskMap.set(id, t);
    adjList.set(
      id,
      (t.dependsOn || []).map((d) => d.toString()).filter((d) => allIds.includes(d))
    );
  });

  return { allIds, adjList, taskMap, tasks };
}

// POST /api/dependencies/add
exports.addDependency = async (req, res) => {
  try {
    const user = req.user;
    const { taskId, dependsOnId, workspaceId } = req.body;

    if (!taskId || !dependsOnId) {
      return res
        .status(400)
        .json({ error: "taskId and dependsOnId are required" });
    }

    if (taskId === dependsOnId) {
      return res
        .status(400)
        .json({ error: "A task cannot depend on itself" });
    }

    // Verify both tasks exist
    const task = await Task.findById(taskId);
    const depTask = await Task.findById(dependsOnId);

    if (!task || !depTask) {
      return res.status(404).json({ error: "One or both tasks not found" });
    }

    // Check if already a dependency
    if (
      task.dependsOn &&
      task.dependsOn.some((d) => d.toString() === dependsOnId)
    ) {
      return res.status(400).json({ error: "Dependency already exists" });
    }

    // Build current graph and check for potential cycle
    const { allIds, adjList } = await buildAdjList(
      user._id,
      workspaceId || null
    );

    if (wouldCreateCycle(adjList, taskId, dependsOnId, allIds)) {
      return res.status(400).json({
        error:
          "Adding this dependency would create a circular dependency (cycle detected)",
      });
    }

    // Add the dependency
    await Task.findByIdAndUpdate(taskId, {
      $addToSet: { dependsOn: dependsOnId },
    });

    return res.json({ success: true, message: "Dependency added" });
  } catch (err) {
    console.error("[ADD_DEPENDENCY_ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/dependencies/remove
exports.removeDependency = async (req, res) => {
  try {
    const { taskId, dependsOnId } = req.body;

    if (!taskId || !dependsOnId) {
      return res
        .status(400)
        .json({ error: "taskId and dependsOnId are required" });
    }

    await Task.findByIdAndUpdate(taskId, {
      $pull: { dependsOn: dependsOnId },
    });

    return res.json({ success: true, message: "Dependency removed" });
  } catch (err) {
    console.error("[REMOVE_DEPENDENCY_ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/dependencies/graph?workspaceId=xxx
exports.getGraph = async (req, res) => {
  try {
    const user = req.user;
    const { workspaceId } = req.query;

    const { allIds, adjList, taskMap } = await buildAdjList(
      user._id,
      workspaceId || null
    );

    // Build nodes and edges for frontend
    const nodes = allIds.map((id) => {
      const t = taskMap.get(id);
      const deps = adjList.get(id) || [];
      const allDepsCompleted = deps.every((depId) => {
        const depTask = taskMap.get(depId);
        return depTask && depTask.completed;
      });

      return {
        id,
        title: t.title,
        status: t.status,
        completed: t.completed,
        priority: t.priority,
        estimatedTime: t.estimatedTime || 1,
        deadline: t.deadline,
        dependsOn: deps,
        blocked: deps.length > 0 && !allDepsCompleted,
      };
    });

    const edges = [];
    allIds.forEach((id) => {
      const deps = adjList.get(id) || [];
      deps.forEach((depId) => {
        edges.push({ from: depId, to: id }); // depId must finish before id
      });
    });

    // Check for cycles
    const cycleResult = detectCycle(adjList, allIds);

    return res.json({
      nodes,
      edges,
      hasCycle: cycleResult.hasCycle,
      cyclePath: cycleResult.cyclePath,
    });
  } catch (err) {
    console.error("[GET_GRAPH_ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/dependencies/critical-path?workspaceId=xxx
exports.getCriticalPath = async (req, res) => {
  try {
    const user = req.user;
    const { workspaceId } = req.query;

    const { allIds, adjList, taskMap } = await buildAdjList(
      user._id,
      workspaceId || null
    );

    // Check for cycles first
    const cycleResult = detectCycle(adjList, allIds);
    if (cycleResult.hasCycle) {
      return res.status(400).json({
        error: "Cannot compute critical path: dependency graph has a cycle",
        cyclePath: cycleResult.cyclePath,
      });
    }

    // Topological sort
    const topoOrder = topologicalSort(adjList, allIds);

    // Build duration map
    const durations = new Map();
    allIds.forEach((id) => {
      const t = taskMap.get(id);
      durations.set(id, t.estimatedTime || 1);
    });

    // Compute critical path
    const cpm = criticalPath(adjList, durations, topoOrder);

    // Build response
    const schedule = topoOrder.map((id) => {
      const t = taskMap.get(id);
      const times = cpm.taskTimes.get(id);
      return {
        id,
        title: t.title,
        status: t.status,
        completed: t.completed,
        estimatedTime: t.estimatedTime || 1,
        priority: t.priority,
        isCritical: cpm.criticalPath.includes(id),
        ES: times.ES,
        EF: times.EF,
        LS: times.LS,
        LF: times.LF,
        slack: times.slack,
      };
    });

    return res.json({
      schedule,
      criticalPath: cpm.criticalPath.map((id) => ({
        id,
        title: taskMap.get(id).title,
      })),
      totalDuration: cpm.totalDuration,
      executionOrder: topoOrder.map((id) => ({
        id,
        title: taskMap.get(id).title,
      })),
    });
  } catch (err) {
    console.error("[CRITICAL_PATH_ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/dependencies/blocked/:taskId
exports.getBlockedStatus = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate("dependsOn", "title completed status")
      .lean();

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const deps = (task.dependsOn || []).map((d) => ({
      id: d._id.toString(),
      title: d.title,
      completed: d.completed,
      status: d.status,
    }));

    const blockedBy = deps.filter((d) => !d.completed);

    return res.json({
      taskId,
      isBlocked: blockedBy.length > 0,
      dependencies: deps,
      blockedBy,
    });
  } catch (err) {
    console.error("[BLOCKED_STATUS_ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
