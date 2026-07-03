const Workspace = require("../models/Workspace");
const WorkspaceMember = require("../models/WorkspaceMember");
const Task = require("../models/Task");

// GET /api/workspaces
exports.getWorkspaces = async (req, res) => {
  try {
    const user = req.user;

    // Get all workspaces where user is owner or member
    const memberships = await WorkspaceMember.find({ userId: user._id });
    const memberWorkspaceIds = memberships.map((m) => m.workspaceId);

    const workspaces = await Workspace.find({
      $or: [{ ownerId: user._id }, { _id: { $in: memberWorkspaceIds } }],
    }).populate("ownerId", "email");

    // Build response with member info and task counts
    const result = await Promise.all(
      workspaces.map(async (ws) => {
        const members = await WorkspaceMember.find({
          workspaceId: ws._id,
        }).populate("userId", "email");

        const taskCount = await Task.countDocuments({ workspaceId: ws._id });

        return {
          id: ws._id.toString(),
          name: ws.name,
          ownerId: ws.ownerId._id.toString(),
          owner: { id: ws.ownerId._id.toString(), email: ws.ownerId.email },
          inviteCode: ws.inviteCode,
          createdAt: ws.createdAt,
          members: members.map((m) => ({
            userId: m.userId._id.toString(),
            user: { email: m.userId.email },
            role: m.role,
          })),
          _count: { tasks: taskCount },
        };
      })
    );

    return res.json(result);
  } catch (err) {
    console.error("[GET_WORKSPACES_ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/workspaces
exports.createWorkspace = async (req, res) => {
  try {
    const user = req.user;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const workspace = await Workspace.create({
      name,
      ownerId: user._id,
    });

    // Add creator as ADMIN member
    await WorkspaceMember.create({
      workspaceId: workspace._id,
      userId: user._id,
      role: "ADMIN",
    });

    return res.json({
      id: workspace._id.toString(),
      name: workspace.name,
      ownerId: workspace.ownerId.toString(),
      inviteCode: workspace.inviteCode,
    });
  } catch (err) {
    console.error("[CREATE_WORKSPACE_ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// DELETE /api/workspaces/:id
exports.deleteWorkspace = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    if (workspace.ownerId.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Only the owner can delete a workspace" });
    }

    // Clean up members
    await WorkspaceMember.deleteMany({ workspaceId: id });
    await Workspace.findByIdAndDelete(id);

    return res.json({ message: "Workspace deleted" });
  } catch (err) {
    console.error("[DELETE_WORKSPACE_ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/workspaces/join
exports.joinWorkspace = async (req, res) => {
  try {
    const user = req.user;
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ error: "Invite code is required" });
    }

    const workspace = await Workspace.findOne({ inviteCode });
    if (!workspace) {
      return res.status(404).json({ error: "Invalid invite code" });
    }

    // Check if already a member
    const existingMember = await WorkspaceMember.findOne({
      workspaceId: workspace._id,
      userId: user._id,
    });

    if (existingMember) {
      return res
        .status(400)
        .json({ error: "Already a member of this workspace" });
    }

    await WorkspaceMember.create({
      workspaceId: workspace._id,
      userId: user._id,
      role: "MEMBER",
    });

    return res.json({
      success: true,
      workspace: {
        id: workspace._id.toString(),
        name: workspace.name,
      },
    });
  } catch (err) {
    console.error("[JOIN_WORKSPACE_ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
