import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logDebug } from "@/lib/debug";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const taskId = id;

  // Check access to task
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { workspace: { include: { members: true } } }
  });

  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const hasAccess = task.userId === user.id || 
                    task.workspace?.members.some(m => m.userId === user.id);

  if (!hasAccess) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const comments = await prisma.comment.findMany({
    where: { taskId },
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json(comments);
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text } = await req.json();
  if (!text) return NextResponse.json({ error: "Comment text is required" }, { status: 400 });

  const taskId = id;

  // Check access to task
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { workspace: { include: { members: true } } }
  });

  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const hasAccess = task.userId === user.id || 
                    task.workspace?.members.some(m => m.userId === user.id);

  if (!hasAccess) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  logDebug(`[COMMENT_POST] Request by User: ${user.email} (ID: ${user.id}) for Task: ${taskId}`);

  const comment = await prisma.comment.create({
    data: {
      text,
      taskId,
      userId: user.id
    },
    include: { user: { select: { email: true } } }
  });

  logDebug(`[COMMENT_CREATED] ID: ${comment.id}, Saved Author: ${comment.user.email}`);

  return NextResponse.json(comment);
}
