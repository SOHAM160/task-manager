import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  await prisma.task.delete({
    where: {
      id: Number(id),
    },
  });

  return Response.json({ message: "Task deleted" });
}