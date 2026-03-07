import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const body = await req.json();

  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description || null,
      priority: body.priority || 3,
      deadline: body.deadline ? new Date(body.deadline) : null
    }
  });

  return NextResponse.json(task);
}