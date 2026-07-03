const Task = require("../models/Task");
const { sendDailyPlanEmail, sendNotificationEmail } = require("../utils/email");

// POST /api/notifications/daily-plan
exports.sendDailyPlan = async (req, res) => {
  try {
    const user = req.user;
    const { schedule } = req.body;

    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      return res.status(400).json({ error: "No schedule to send" });
    }

    await sendDailyPlanEmail(user.email, schedule);

    return res.json({ message: `Daily plan sent to ${user.email}` });
  } catch (error) {
    console.error("[NOTIFY_DAILY_PLAN_ERROR]", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to send email" });
  }
};

// POST /api/notifications/sync
exports.syncNotifications = async (req, res) => {
  try {
    const user = req.user;

    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    // Fetch ALL incomplete tasks with deadlines (not just within 2 days)
    const tasks = await Task.find({
      userId: user._id,
      completed: false,
      status: { $ne: "DONE" },
      deadline: { $ne: null },
      parentTaskId: null,
    }).select("title deadline");

    if (tasks.length === 0) {
      return res.json({ message: "No pending tasks with deadlines — all good!" });
    }

    const overdue = tasks.filter((t) => {
      const d = new Date(t.deadline);
      return d < now;
    });

    const deadlineSoon = tasks.filter((t) => {
      const d = new Date(t.deadline);
      return d >= now && d <= twoDaysFromNow;
    });

    const upcoming = tasks.filter((t) => {
      const d = new Date(t.deadline);
      return d > twoDaysFromNow;
    });

    await sendNotificationEmail(user.email, deadlineSoon, overdue, upcoming);

    return res.json({
      message: `Notification sent to ${user.email}`,
      overdueCount: overdue.length,
      deadlineSoonCount: deadlineSoon.length,
      upcomingCount: upcoming.length,
      totalTasks: tasks.length,
    });
  } catch (error) {
    console.error("[NOTIFY_SYNC_ERROR]", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to sync notifications" });
  }
};

