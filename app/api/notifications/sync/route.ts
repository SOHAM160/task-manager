import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId } = await req.json().catch(() => ({ workspaceId: null }));
    
    // Fetch tasks based on context
    const where: any = {
      userId: user.id,
      completed: false,
      status: { not: "DONE" },
      parentTaskId: null,
    };

    if (workspaceId) {
      where.workspaceId = workspaceId;
    } else {
      where.workspaceId = null;
    }

    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const tasks = await prisma.task.findMany({
      where,
      select: { title: true, deadline: true },
    });

    const deadlineSoon = tasks.filter(t => {
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      return d >= now && d <= twoDaysFromNow;
    }) ;

    const overdue = tasks.filter(t => {
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      return d < now;
    });

    const otherTasks = tasks.filter(t => {
      const isUrgent = deadlineSoon.some(u => u.title === t.title && u.deadline === t.deadline);
      const isOverdue = overdue.some(o => o.title === t.title && o.deadline === t.deadline);
      return !isUrgent && !isOverdue;
    });

    if (tasks.length === 0) {
      return NextResponse.json({ message: "No pending tasks found for this space." });
    }

    await sendNotificationEmail(user.email, deadlineSoon, overdue, otherTasks);

    return NextResponse.json({
      message: `Status report sent to ${user.email}`,
      totalCount: tasks.length,
      urgentCount: deadlineSoon.length + overdue.length,
      othersCount: otherTasks.length
    });
  } catch (error: any) {
    console.error("[NOTIFY_SYNC_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to sync notifications" }, { status: 500 });
  }
}
