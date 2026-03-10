import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
<<<<<<< HEAD

export async function GET() {

  const tasks = await prisma.task.findMany({
=======
import { getCurrentUser } from "@/lib/auth";

export async function GET() {

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json([], { status: 401 });
  }

  const tasks = await prisma.task.findMany({
    where: { userId: user.id },
>>>>>>> 248f97b (Initial version with auth and logging)
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(tasks);

}

export async function POST(req: Request) {

  const body = await req.json();

<<<<<<< HEAD
=======
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

>>>>>>> 248f97b (Initial version with auth and logging)
  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description || null,
      priority: body.priority || 3,
      deadline: body.deadline ? new Date(body.deadline) : null,
<<<<<<< HEAD
      completed: false
=======
      completed: false,
      userEmail: user.email,
      userId: user.id
>>>>>>> 248f97b (Initial version with auth and logging)
    }
  });

  return NextResponse.json(task);

}