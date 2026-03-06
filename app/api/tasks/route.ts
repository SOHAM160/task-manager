import { prisma } from "@/lib/prisma";

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: { id: "desc" },
  });

  return Response.json(tasks);
}

export async function POST(req: Request) {
  const body = await req.json();

  const task = await prisma.task.create({
    data: {
      title: body.title,
      completed: false,
    },
  });

  return Response.json(task);
}

export async function PUT(req: Request) {
  const body = await req.json();

  const task = await prisma.task.update({
    where: {
      id: body.id,
    },
    data: {
      completed: body.completed,
    },
  });

  return Response.json(task);
}