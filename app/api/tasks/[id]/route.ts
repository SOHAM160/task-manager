import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";


export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json();

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  // Get existing task to check permissions
  const existingTask = await prisma.task.findUnique({
    where: { id: Number(id) },
    include: { parentTask: true }
  });

  if (!existingTask) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Check access: 
  // 1. User is the creator
  // 2. User is the assignee
  // 3. User is a member of the workspace (or the parent task's workspace)
  const effectiveWorkspaceId = existingTask.workspaceId || existingTask.parentTask?.workspaceId;

  const workspaceMember = effectiveWorkspaceId 
    ? await prisma.workspaceMember.findFirst({
        where: { workspaceId: effectiveWorkspaceId, userId: user.id }
      })
    : null;

  const isCreator = existingTask.userId === user.id;
  const isAssignee = existingTask.assigneeId === user.id;

  if (!isCreator && !isAssignee && !workspaceMember) {
    return NextResponse.json(
      { error: "Task not found or access denied" },
      { status: 404 }
    );
  }

  const updateData: any = {};
  if (body.completed !== undefined) updateData.completed = body.completed;
  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.priority !== undefined) updateData.priority = body.priority;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId;
  if (body.deadline !== undefined) updateData.deadline = body.deadline ? new Date(body.deadline) : null;
  if (body.deadline === null) updateData.deadline = null;

  if (body.tagIds !== undefined) {
    updateData.tags = {
      set: body.tagIds.map((tagId: number) => ({ id: tagId }))
    };
  }

  // Handle auto-status logic
  if (body.completed !== undefined && !existingTask.parentTaskId) {
    // Toggling the MAIN task checkbox
    const subtasks = await prisma.task.findMany({
      where: { parentTaskId: Number(id) }
    });
    
    if (body.completed) {
      if (subtasks.length > 0) {
        const allDone = subtasks.every(st => st.completed);
        updateData.status = allDone ? "DONE" : "IN_PROGRESS";
        // If some subtasks are pending, we keep parent as completed in state but column is IN_PROGRESS
      } else {
        updateData.status = "DONE";
      }
    } else {
      updateData.status = "TODO";
    }
  }

  const task = await prisma.task.update({
    where: {
      id: Number(id),
    },
    data: updateData,
    include: { tags: true }
  });

  // If we just updated a SUBTASK, sync parent status
  if (task.parentTaskId) {
    const siblingSubtasks = await prisma.task.findMany({
      where: { parentTaskId: task.parentTaskId }
    });
    
    const countDone = siblingSubtasks.filter(st => st.completed).length;
    const total = siblingSubtasks.length;
    
    let newStatus = "TODO";
    let parentCompleted = false;

    if (countDone === total && total > 0) {
      newStatus = "DONE";
      parentCompleted = true;
    } else if (countDone > 0) {
      newStatus = "IN_PROGRESS";
      parentCompleted = false;
    } else {
      newStatus = "TODO";
      parentCompleted = false;
    }

    await prisma.task.update({
      where: { id: task.parentTaskId },
      data: { status: newStatus, completed: parentCompleted }
    });
  }

  return NextResponse.json({ success: true, task });
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const existingTask = await prisma.task.findUnique({
<<<<<<< HEAD
    where: { id: Number(id) },
    include: { parentTask: true }
=======
    where: { id: Number(id) }
>>>>>>> 733e1d5d8aaa1d561483c9dc3bea52ff502641b3
  });

  if (!existingTask) return NextResponse.json({ error: "Task not found" }, { status: 404 });

<<<<<<< HEAD
  const effectiveWorkspaceId = existingTask.workspaceId || existingTask.parentTask?.workspaceId;

  const workspaceMember = effectiveWorkspaceId
    ? await prisma.workspaceMember.findFirst({
        where: { workspaceId: effectiveWorkspaceId, userId: user.id },
      })
    : null;

  const isOwner = existingTask.userId === user.id;
  const isAssignee = existingTask.assigneeId === user.id;

  if (!isOwner && !isAssignee && !workspaceMember) {
=======
  const isOwner = existingTask.userId === user.id;
  const workspaceAdmin = existingTask.workspaceId 
    ? await prisma.workspaceMember.findFirst({
        where: { workspaceId: existingTask.workspaceId, userId: user.id, role: "ADMIN" }
      })
    : null;

  if (!isOwner && !workspaceAdmin) {
>>>>>>> 733e1d5d8aaa1d561483c9dc3bea52ff502641b3
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  await prisma.task.delete({
    where: { id: Number(id) }
  });

  return NextResponse.json({ success: true });
}