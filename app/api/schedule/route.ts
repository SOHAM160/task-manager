<<<<<<< HEAD
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

=======
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

>>>>>>> 248f97b (Initial version with auth and logging)
import { fcfs } from "@/lib/scheduler/fcfs";
import { priorityScheduling } from "@/lib/scheduler/priority";
import { edf } from "@/lib/scheduler/edf";
import { roundRobin } from "@/lib/scheduler/roundRobin";

export async function GET(req: Request) {
<<<<<<< HEAD

  const { searchParams } = new URL(req.url);
  const algo = searchParams.get("algo") || "fcfs";

  const tasks = await prisma.task.findMany({
    where: { completed: false }
=======
  const { searchParams } = new URL(req.url);
  const algo = searchParams.get("algo") || "fcfs";

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const tasks = await prisma.task.findMany({
    where: {
      completed: false,
      userId: user.id,
    },
>>>>>>> 248f97b (Initial version with auth and logging)
  });

  let result;

  switch (algo) {
<<<<<<< HEAD

=======
>>>>>>> 248f97b (Initial version with auth and logging)
    case "priority":
      result = priorityScheduling(tasks);
      break;

    case "edf":
      result = edf(tasks);
      break;

    case "roundrobin":
      result = roundRobin(tasks);
      break;

    default:
      result = fcfs(tasks);
<<<<<<< HEAD

  }

  return NextResponse.json(result);

=======
  }

  return NextResponse.json(result);
>>>>>>> 248f97b (Initial version with auth and logging)
}