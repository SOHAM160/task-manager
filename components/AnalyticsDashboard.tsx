"use client";

import { useState, useEffect, useMemo } from "react";
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

type Task = {
  id: string;
  title: string;
  completed: boolean;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function AnalyticsDashboard({ tasks }: { tasks: Task[] }) {
  const completedCount = tasks.filter((t) => t.status === "DONE" || t.completed).length;
  const pendingCount = tasks.length - completedCount;

  const doughnutData = useMemo(
    () => ({
      labels: ["Completed", "Pending"],
      datasets: [
        {
          label: "Tasks",
          data: [completedCount, pendingCount],
          backgroundColor: ["#22c55e", "#f97316"],
          borderWidth: 0,
        },
      ],
    }),
    [completedCount, pendingCount]
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
        background: "#020617",
        color: "white",
        padding: "20px",
        borderRadius: "16px",
        border: "1px solid #1e293b",
        boxShadow: "0 16px 32px rgba(15,23,42,0.8)",
        margin: "32px auto 0",
        maxWidth: "960px",
      }}
    >
      <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>
        Analytics
      </h2>
      <p style={{ color: "#64748b", marginBottom: "20px" }}>
        Overview of completed vs pending tasks.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px",
        }}
      >
        <div>
          <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>Tasks Status</h3>
          <div
            style={{
              maxWidth: "260px",
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
          <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>Completed vs Pending</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis allowDecimals={false} stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" fill="#38bdf8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

