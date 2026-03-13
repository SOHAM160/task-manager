import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get workspaces where user is an owner or a member
  const workspaces = await prisma.workspace.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { members: { some: { userId: user.id } } }
      ]
    },
    include: {
      owner: { select: { email: true } },
      members: { include: { user: { select: { email: true } } } },
      _count: { select: { tasks: true } }
    }
  });

  return NextResponse.json(workspaces);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const workspace = await prisma.workspace.create({
    data: {
      name,
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: "ADMIN"
        }
      }
    }
  });

  return NextResponse.json(workspace);
}
