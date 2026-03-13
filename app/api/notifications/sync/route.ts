import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    // Fetch tasks with upcoming deadlines (within 2 days) and overdue
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        completed: false,
        status: { not: "DONE" },
        deadline: { not: null },
        parentTaskId: null,
      },
      select: { title: true, deadline: true },
    });

    const deadlineSoon = tasks.filter(t => {
      const d = new Date(t.deadline!);
      return d >= now && d <= twoDaysFromNow;
    }) as { title: string; deadline: Date }[];

    const overdue = tasks.filter(t => {
      const d = new Date(t.deadline!);
      return d < now;
    }) as { title: string; deadline: Date }[];

    if (deadlineSoon.length === 0 && overdue.length === 0) {
      return NextResponse.json({ message: "No urgent tasks — all good!" });
    }

    await sendNotificationEmail(user.email, deadlineSoon, overdue);

    return NextResponse.json({
      message: `Notification sent to ${user.email}`,
      deadlineSoonCount: deadlineSoon.length,
      overdueCount: overdue.length,
    });
  } catch (error: any) {
    console.error("[NOTIFY_SYNC_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to sync notifications" }, { status: 500 });
  }
}
