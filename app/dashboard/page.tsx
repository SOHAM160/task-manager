import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/");
  }

  const rawTasks = await prisma.task.findMany({
    where: { userId: user.id }
  });

  const tasks = rawTasks.map(t => ({
    id: t.id,
    title: t.title,
    completed: t.completed,
    status: t.status,
    deadline: t.deadline?.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString()
  }));

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "white",
        padding: "32px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <AnalyticsDashboard tasks={tasks} />
    </div>
  );
}