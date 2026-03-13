import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { inviteCode } = await req.json();
  if (!inviteCode) return NextResponse.json({ error: "Invite code is required" }, { status: 400 });

  const workspace = await prisma.workspace.findUnique({
    where: { inviteCode }
  });

  if (!workspace) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  // Check if already a member
  const existingMember = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user.id
      }
    }
  });

  if (existingMember) {
    return NextResponse.json({ error: "Already a member of this workspace" }, { status: 400 });
  }

  await prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      role: "MEMBER"
    }
  });

  return NextResponse.json({ success: true, workspace });
}
