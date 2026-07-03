const Comment = require("../models/Comment");
const Task = require("../models/Task");
const WorkspaceMember = require("../models/WorkspaceMember");

// GET /api/tasks/:id/comments
exports.getComments = async (req, res) => {
  try {
    const user = req.user;
    const { id: taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check access
    let hasAccess = task.userId.toString() === user._id.toString();
    if (!hasAccess && task.workspaceId) {
      const member = await WorkspaceMember.findOne({
        workspaceId: task.workspaceId,
        userId: user._id,
      });
      hasAccess = !!member;
    }

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    const comments = await Comment.find({ taskId })
      .populate("userId", "email")
      .sort({ createdAt: 1 });

    // Transform to match frontend
    const transformed = comments.map((c) => ({
      id: c._id.toString(),
      text: c.text,
      taskId: c.taskId.toString(),
      createdAt: c.createdAt,
      user: { email: c.userId.email },
    }));

    return res.json(transformed);
  } catch (err) {
    console.error("[GET_COMMENTS_ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/tasks/:id/comments
exports.createComment = async (req, res) => {
  try {
    const user = req.user;
    const { id: taskId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check access
    let hasAccess = task.userId.toString() === user._id.toString();
    if (!hasAccess && task.workspaceId) {
      const member = await WorkspaceMember.findOne({
        workspaceId: task.workspaceId,
        userId: user._id,
      });
      hasAccess = !!member;
    }

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    const comment = await Comment.create({
      text,
      taskId,
      userId: user._id,
    });

    // Populate user email
    await comment.populate("userId", "email");

    return res.json({
      id: comment._id.toString(),
      text: comment.text,
      taskId: comment.taskId.toString(),
      createdAt: comment.createdAt,
      user: { email: comment.userId.email },
    });
  } catch (err) {
    console.error("[CREATE_COMMENT_ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
