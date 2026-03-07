import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

import { fcfs } from "@/lib/scheduler/fcfs";
import { priorityScheduling } from "@/lib/scheduler/priority";
import { edf } from "@/lib/scheduler/edf";
import { roundRobin } from "@/lib/scheduler/roundRobin";

export async function GET(req: Request) {

  const { searchParams } = new URL(req.url);
  const algo = searchParams.get("algo") || "fcfs";

  const tasks = await prisma.task.findMany({
    where: { completed: false }
  });

  let result;

  switch (algo) {

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

  }

  return NextResponse.json(result);

}