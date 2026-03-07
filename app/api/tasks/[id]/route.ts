import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json();

  const task = await prisma.task.update({
    where: { id: Number(id) },
    data: {
      completed: body.completed,
    },
  });

  return NextResponse.json(task);
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  await prisma.task.delete({
    where: { id: Number(id) },
  });

  return NextResponse.json({ message: "Task deleted" });
}