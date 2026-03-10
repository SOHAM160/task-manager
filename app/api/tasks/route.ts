import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json([], { status: 401 });
  }

  const tasks = await prisma.task.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
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
  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description || null,
      priority: body.priority || 3,
      deadline: body.deadline ? new Date(body.deadline) : null,
      completed: false,
      userEmail: user.email,
      userId: user.id
    }
  });

  return NextResponse.json(task);

}