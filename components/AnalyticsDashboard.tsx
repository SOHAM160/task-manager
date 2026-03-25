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
  deadline?: string;
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

  const deadlineData = useMemo(() => {
    const pendingWithDeadline = tasks.filter(t => !t.completed && t.status !== 'DONE' && t.deadline);
    const groups: Record<string, number> = {};
    
    pendingWithDeadline.forEach(t => {
      if (t.deadline) {
        // Format as MMM DD (e.g., Mar 25)
        const dateObj = new Date(t.deadline);
        const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        groups[label] = (groups[label] || 0) + 1;
      }
    });

    return Object.entries(groups)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [tasks]);

  return (
    <div
      style={{
        background: "#020617",
        color: "white",
        padding: "24px",
        borderRadius: "16px",
        border: "1px solid #1e293b",
        boxShadow: "0 16px 32px rgba(15,23,42,0.8)",
        margin: "32px auto 0",
        maxWidth: "1100px",
      }}
    >
      <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>
        Analytics
      </h2>
      <p style={{ color: "#64748b", marginBottom: "24px" }}>
        Insights into your productivity and upcoming deadlines.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
        }}
      >
        <div style={{ background: '#0f172a/50', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <h3 style={{ marginBottom: "16px", fontSize: "14px", fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tasks Status</h3>
          <div
            style={{
              maxWidth: "200px",
              margin: "0 auto",
            }}
          >
            <Doughnut
              data={doughnutData}
              options={{
                plugins: { legend: { position: "bottom", labels: { color: '#94a3b8', font: { size: 10 } } } },
                maintainAspectRatio: true,
              }}
            />
          </div>
        </div>

        <div style={{ background: '#0f172a/50', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <h3 style={{ marginBottom: "16px", fontSize: "14px", fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Workload Balance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: '#1e293b' }}
                contentStyle={{
                  backgroundColor: "#020617",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" fill="#38bdf8" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#0f172a/50', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <h3 style={{ marginBottom: "16px", fontSize: "14px", fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Upcoming Deadlines</h3>
          {deadlineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deadlineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{
                    backgroundColor: "#020617",
                    border: "1px solid #1e293b",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '13px', fontStyle: 'italic' }}>
              No pending deadlines
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

