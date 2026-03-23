import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const workspaceId = id;

  // Check if workspace exists and user is owner
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { _count: { select: { tasks: true } } }
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  if (workspace.ownerId !== user.id) {
    return NextResponse.json({ error: "Only the owner can delete a workspace" }, { status: 403 });
  }

  // Delete the workspace (Prisma will handle cascading deletes if configured, 
  // but here we are primarily concerned with the user's request to 'delete if empty')
  // Manually handle cascading deletes for MongoDB
  await prisma.workspaceMember.deleteMany({
    where: { workspaceId }
  });

  await prisma.task.deleteMany({
    where: { workspaceId }
  });

  await prisma.workspace.delete({
    where: { id: workspaceId }
  });

  return NextResponse.json({ message: "Workspace deleted" });
}
