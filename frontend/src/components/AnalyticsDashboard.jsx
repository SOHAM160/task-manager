import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, ArcElement, ChartTooltip, Legend);

export default function AnalyticsDashboard({ tasks = [] }) {
  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.length - completedCount;

  // Count by status for a more detailed breakdown
  const todoCount = tasks.filter((t) => t.status === "TODO").length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const doneCount = tasks.filter((t) => t.status === "DONE").length;

  const doughnutData = useMemo(
    () => ({
      labels: ["To Do", "In Progress", "Done"],
      datasets: [
        {
          label: "Tasks",
          data: [todoCount, inProgressCount, doneCount],
          backgroundColor: ["#f97316", "#3b82f6", "#10b981"],
          borderWidth: 0,
        },
      ],
    }),
    [todoCount, inProgressCount, doneCount]
  );

  const barData = useMemo(
    () =>
      [
        { name: "Completed", value: completedCount },
        { name: "Pending", value: pendingCount },
      ].filter((d) => d.value > 0),
    [completedCount, pendingCount]
  );

  return (
    <div
      style={{
        background: "#ffffff",
        color: "#0f172a",
        padding: "24px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
        margin: "32px auto 0",
        maxWidth: "960px",
      }}
    >
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "6px", color: "#1e3a8a" }}>
        Analytics Overview
      </h2>
      <p style={{ color: "#64748b", marginBottom: "24px", fontSize: "14px" }}>
        Overview of completed vs pending tasks in the current workspace.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "24px",
        }}
      >
        <div>
          <h3 style={{ marginBottom: "16px", fontSize: "15px", fontWeight: 600, color: "#1e3a8a" }}>Tasks Status</h3>
          <div
            style={{
              maxWidth: "240px",
              margin: "0 auto",
            }}
          >
            <Doughnut
              data={doughnutData}
              options={{
                plugins: { legend: { position: "bottom" } },
                maintainAspectRatio: true,
              }}
            />
          </div>
        </div>

        <div>
          <h3 style={{ marginBottom: "16px", fontSize: "15px", fontWeight: 600, color: "#1e3a8a" }}>Completed vs Pending</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  color: "#0f172a",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
