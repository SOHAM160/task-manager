<<<<<<< HEAD
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

=======
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

>>>>>>> 248f97b (Initial version with auth and logging)
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
<<<<<<< HEAD

  const { id } = await context.params;
  const body = await req.json();

  const task = await prisma.task.update({
    where: { id: Number(id) },
    data: {
      completed: body.completed
    }
  });

  return NextResponse.json(task);

=======
  const { id } = await context.params;
  const body = await req.json();

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const task = await prisma.task.updateMany({
    where: {
      id: Number(id),
      userId: user.id,
    },
    data: {
      completed: body.completed,
    },
  });

  if (task.count === 0) {
    return NextResponse.json(
      { error: "Task not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
>>>>>>> 248f97b (Initial version with auth and logging)
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
<<<<<<< HEAD

  const { id } = await context.params;

  await prisma.task.delete({
    where: { id: Number(id) }
  });

  return NextResponse.json({ message: "Task deleted" });

=======
  const { id } = await context.params;

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const deleted = await prisma.task.deleteMany({
    where: {
      id: Number(id),
      userId: user.id,
    },
  });

  if (deleted.count === 0) {
    return NextResponse.json(
      { error: "Task not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
>>>>>>> 248f97b (Initial version with auth and logging)
}