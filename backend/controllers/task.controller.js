const Task = require("../models/Task");
const Tag = require("../models/Tag");
const WorkspaceMember = require("../models/WorkspaceMember");

// GET /api/tasks
exports.getTasks = async (req, res) => {
  try {
    const user = req.user;
    const { status, priority, tagId, workspaceId, page = 1, limit = 100 } = req.query;

    const filter = { parentTaskId: null };

    if (workspaceId && workspaceId !== "null" && workspaceId !== "undefined") {
      filter.workspaceId = workspaceId;
      // Check access
      const member = await WorkspaceMember.findOne({
        workspaceId,
        userId: user._id,
      });
      if (!member) {
        return res.status(403).json({ error: "No access to workspace" });
      }
    } else {
      filter.userId = user._id;
      filter.workspaceId = null;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = parseInt(priority);
    if (tagId) filter.tagIds = tagId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tasks = await Task.find(filter)
      .populate("assignee", "email")
      .populate("tagIds", "name color")
      .populate("dependsOn", "title completed status")
      .populate({
        path: "subtasks",
        populate: [{ path: "tagIds", select: "name color" }],
        options: { sort: { createdAt: 1 } },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean({ virtuals: true });

    // Transform to match frontend expectations (tags instead of tagIds)
    const transformed = tasks.map(transformTask);

    return res.json(transformed);
  } catch (err) {
    console.error("[GET_TASKS_ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const user = req.user;
    const {
      title,
      description,
      priority,
      deadline,
      parentTaskId,
      workspaceId,
      assigneeId,
      tagIds = [],
      subtaskTitles = [],
      estimatedTime = 1,
    } = req.body;

    if (workspaceId) {
      const member = await WorkspaceMember.findOne({
        workspaceId,
        userId: user._id,
      });
      if (!member) {
        return res.status(403).json({ error: "No access to workspace" });
      }
    }

    // Create main task
    const task = await Task.create({
      title,
      description: description || null,
      priority: priority || 3,
      deadline: deadline ? new Date(deadline) : null,
      parentTaskId: parentTaskId || null,
      completed: false,
      userEmail: user.email,
      userId: user._id,
      workspaceId: workspaceId || null,
      assigneeId: assigneeId || null,
      tagIds: tagIds,
      estimatedTime: estimatedTime ? Number(estimatedTime) : 1,
    });

    // Create subtasks
    if (subtaskTitles.length > 0) {
      const subtaskDocs = subtaskTitles.map((stTitle) => ({
        title: stTitle,
        completed: false,
        priority: 3,
        userId: user._id,
        userEmail: user.email,
        workspaceId: workspaceId || null,
        assigneeId: assigneeId || null,
        parentTaskId: task._id,
      }));
      await Task.insertMany(subtaskDocs);
    }

    // Re-fetch with populated fields
    const populated = await Task.findById(task._id)
      .populate("assignee", "email")
      .populate("tagIds", "name color")
      .populate({
        path: "subtasks",
        populate: [{ path: "tagIds", select: "name color" }],
      })
      .lean({ virtuals: true });

    return res.json(transformTask(populated));
  } catch (err) {
    console.error("[CREATE_TASK_ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const body = req.body;

    const existingTask = await Task.findById(id);
    if (!existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check parent for workspace
    let parentTask = null;
    if (existingTask.parentTaskId) {
      parentTask = await Task.findById(existingTask.parentTaskId);
    }

    const effectiveWorkspaceId =
      existingTask.workspaceId ||
      (parentTask ? parentTask.workspaceId : null);

    let workspaceMember = null;
    if (effectiveWorkspaceId) {
      workspaceMember = await WorkspaceMember.findOne({
        workspaceId: effectiveWorkspaceId,
        userId: user._id,
      });
    }

    const isCreator = existingTask.userId.toString() === user._id.toString();
    const isAssignee =
      existingTask.assigneeId &&
      existingTask.assigneeId.toString() === user._id.toString();

    if (!isCreator && !isAssignee && !workspaceMember) {
      return res
        .status(404)
        .json({ error: "Task not found or access denied" });
    }

    // Block starting/progressing tasks with incomplete dependencies
    const enteringActiveState =
      (body.status === "IN_PROGRESS" && existingTask.status !== "IN_PROGRESS") ||
      (body.status === "DONE" && existingTask.status !== "DONE") ||
      (body.completed === true && !existingTask.completed);

    if (
      enteringActiveState &&
      existingTask.dependsOn &&
      existingTask.dependsOn.length > 0
    ) {
      const deps = await Task.find({
        _id: { $in: existingTask.dependsOn },
      }).select("completed title");
      const incompleteDeps = deps.filter((d) => !d.completed);
      if (incompleteDeps.length > 0) {
        return res.status(400).json({
          error: `Blocked: ${incompleteDeps.map((d) => '"' + d.title + '"').join(", ")} must be completed first`,
          blockedBy: incompleteDeps.map((d) => ({
            id: d._id.toString(),
            title: d.title,
          })),
        });
      }
    }

    const updateData = {};
    if (body.completed !== undefined) updateData.completed = body.completed;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId;
    if (body.deadline !== undefined)
      updateData.deadline = body.deadline ? new Date(body.deadline) : null;
    if (body.deadline === null) updateData.deadline = null;
    if (body.tagIds !== undefined) updateData.tagIds = body.tagIds;
    if (body.estimatedTime !== undefined) updateData.estimatedTime = body.estimatedTime;

    // Handle auto-status logic for parent tasks
    if (body.completed !== undefined && !existingTask.parentTaskId) {
      const subtasks = await Task.find({ parentTaskId: id });

      if (body.completed) {
        if (subtasks.length > 0) {
          const allDone = subtasks.every((st) => st.completed);
          updateData.status = allDone ? "DONE" : "IN_PROGRESS";
        } else {
          updateData.status = "DONE";
        }
      } else {
        updateData.status = "TODO";
      }
    }

    const task = await Task.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .populate("assignee", "email")
      .populate("tagIds", "name color")
      .populate({
        path: "subtasks",
        populate: [{ path: "tagIds", select: "name color" }],
      });

    // If we just updated a SUBTASK, sync parent status
    if (task.parentTaskId) {
      const siblingSubtasks = await Task.find({
        parentTaskId: task.parentTaskId,
      });

      const countDone = siblingSubtasks.filter((st) => st.completed).length;
      const total = siblingSubtasks.length;

      let newStatus = "TODO";
      let parentCompleted = false;

      if (countDone === total && total > 0) {
        newStatus = "DONE";
        parentCompleted = true;
      } else if (countDone > 0) {
        newStatus = "IN_PROGRESS";
        parentCompleted = false;
      }

      await Task.findByIdAndUpdate(task.parentTaskId, {
        status: newStatus,
        completed: parentCompleted,
      });
    }

    return res.json({ success: true, task: transformTask(task.toObject()) });
  } catch (err) {
    console.error("[UPDATE_TASK_ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const existingTask = await Task.findById(id);
    if (!existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    let parentTask = null;
    if (existingTask.parentTaskId) {
      parentTask = await Task.findById(existingTask.parentTaskId);
    }

    const effectiveWorkspaceId =
      existingTask.workspaceId ||
      (parentTask ? parentTask.workspaceId : null);

    let workspaceMember = null;
    if (effectiveWorkspaceId) {
      workspaceMember = await WorkspaceMember.findOne({
        workspaceId: effectiveWorkspaceId,
        userId: user._id,
      });
    }

    const isOwner = existingTask.userId.toString() === user._id.toString();
    const isAssignee =
      existingTask.assigneeId &&
      existingTask.assigneeId.toString() === user._id.toString();

    if (!isOwner && !isAssignee && !workspaceMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Delete subtasks first
    await Task.deleteMany({ parentTaskId: id });
    await Task.findByIdAndDelete(id);

    return res.json({ success: true });
  } catch (err) {
    console.error("[DELETE_TASK_ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Transform a task document to match the frontend's expected shape.
 * Renames `tagIds` (populated) to `tags`, and normalizes `_id` to `id`.
 */
function transformTask(task) {
  if (!task) return task;

  const obj = task._doc || task;

  const result = {
    ...obj,
    id: (obj._id || obj.id || "").toString(),
  };

  // Rename populated tagIds -> tags
  if (obj.tagIds && Array.isArray(obj.tagIds)) {
    result.tags = obj.tagIds.map((t) => ({
      id: (t._id || t.id || "").toString(),
      name: t.name,
      color: t.color,
    }));
  } else {
    result.tags = [];
  }

  // Transform assignee
  if (obj.assignee) {
    result.assignee = { email: obj.assignee.email };
  }

  // Transform dependsOn
  if (obj.dependsOn && Array.isArray(obj.dependsOn)) {
    result.dependsOn = obj.dependsOn.map((d) => {
      if (typeof d === "object" && d !== null) {
        return {
          id: (d._id || d.id || "").toString(),
          title: d.title,
          completed: d.completed,
          status: d.status,
        };
      }
      return { id: d.toString() };
    });
    result.blocked = result.dependsOn.some((d) => d.completed === false);
  } else {
    result.dependsOn = [];
    result.blocked = false;
  }

  result.estimatedTime = obj.estimatedTime || 1;

  // Transform subtasks recursively
  if (obj.subtasks && Array.isArray(obj.subtasks)) {
    result.subtasks = obj.subtasks.map(transformTask);
  }

  return result;
}
