import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user = await getCurrentUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const tagId = searchParams.get("tagId");
  const workspaceId = searchParams.get("workspaceId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "100");

  const where: any = { 
    parentTaskId: null 
  };

  if (workspaceId) {
    where.workspaceId = parseInt(workspaceId);
    // Check if user has access to this workspace
    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId: parseInt(workspaceId), userId: user.id }
    });
    if (!member) return NextResponse.json({ error: "No access to workspace" }, { status: 403 });
  } else {
    // Personal tasks
    where.userId = user.id;
    where.workspaceId = null;
  }

  if (status) where.status = status;
  if (priority) where.priority = parseInt(priority);
  if (tagId) where.tags = { some: { id: parseInt(tagId) } };

  const tasks = await prisma.task.findMany({
    where,
    include: { 
      tags: true,
      assignee: { select: { email: true } },
      subtasks: {
        include: { tags: true },
        orderBy: { createdAt: "asc" }
      }
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit
  });

  return NextResponse.json(tasks);
}

export async function POST(req: Request) {

  const body = await req.json();

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }
  const tagIds = body.tagIds || [];
  const subtaskTitles = body.subtaskTitles || [];
  const workspaceId = body.workspaceId ? parseInt(body.workspaceId) : null;
  const assigneeId = body.assigneeId ? parseInt(body.assigneeId) : null;

  if (workspaceId) {
    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: user.id }
    });
    if (!member) return NextResponse.json({ error: "No access to workspace" }, { status: 403 });
  }

  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description || null,
      priority: body.priority || 3,
      deadline: body.deadline ? new Date(body.deadline) : null,
      parentTaskId: body.parentTaskId || null,
      completed: false,
      userEmail: user.email,
      userId: user.id,
      workspaceId: workspaceId,
      assigneeId: assigneeId,
      tags: {
        connect: tagIds.map((id: number) => ({ id }))
      },
      subtasks: {
        create: subtaskTitles.map((stTitle: string) => ({
          title: stTitle,
          completed: false,
          priority: 3,
          userId: user.id,
          userEmail: user.email
        }))
      }
    },
    include: { 
      tags: true,
      assignee: { select: { email: true } },
      subtasks: {
        include: { tags: true }
      }
    }
  });

  return NextResponse.json(task);

}