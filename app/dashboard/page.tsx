<<<<<<< HEAD
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

export default function Dashboard() {
=======
"use client";

import { useState, useEffect } from "react";

type Task = {
  id: number;
  title: string;
  completed: boolean;
};

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState("all");

  async function fetchTasks() {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(data);
  }

  async function addTask() {
    if (!title.trim()) return;

    await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    setTitle("");
    fetchTasks();
  }

async function deleteTask(id: number) {
  await fetch(`/api/tasks/${id}`, {
    method: "DELETE",
  });

  fetchTasks();
}

async function toggleComplete(task: Task) {
  await fetch("/api/tasks", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: task.id,
      completed: !task.completed,
    }),
  });

  fetchTasks();
}

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter((task) => {
    if (filter === "completed") return task.completed;
    if (filter === "pending") return !task.completed;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.length - completedCount;

>>>>>>> 733e1d5d8aaa1d561483c9dc3bea52ff502641b3
  return (
    <div
      style={{
        minHeight: "100vh",
<<<<<<< HEAD
        background: "#020617",
        color: "white",
        padding: "32px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <AnalyticsDashboard />
=======
        background: "#0f172a",
        color: "white",
        padding: "40px",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: "36px", marginBottom: "10px" }}>
        Task Manager
      </h1>

      <p style={{ color: "#94a3b8", marginBottom: "30px" }}>
        Total: {tasks.length} | Completed: {completedCount} | Pending: {pendingCount}
      </p>

      {/* Add Task */}
      <div style={{ marginBottom: "25px" }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter new task..."
          style={{
            padding: "10px",
            width: "250px",
            marginRight: "10px",
            borderRadius: "6px",
            border: "none",
          }}
        />

        <button
          onClick={addTask}
          style={{
            padding: "10px 20px",
            background: "#22c55e",
            border: "none",
            borderRadius: "6px",
            color: "white",
            cursor: "pointer",
          }}
        >
          Add Task
        </button>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setFilter("all")}
          style={{ marginRight: "10px" }}
        >
          All
        </button>

        <button
          onClick={() => setFilter("completed")}
          style={{ marginRight: "10px" }}
        >
          Completed
        </button>

        <button onClick={() => setFilter("pending")}>
          Pending
        </button>
      </div>

      {/* Task List */}
      <div style={{ maxWidth: "500px" }}>
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#1e293b",
              padding: "12px",
              marginBottom: "12px",
              borderRadius: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleComplete(task)}
                style={{ marginRight: "10px" }}
              />

              <span
                style={{
                  textDecoration: task.completed ? "line-through" : "none",
                  color: task.completed ? "#94a3b8" : "white",
                }}
              >
                {task.title}
              </span>
            </div>

            <button
              onClick={() => deleteTask(task.id)}
              style={{
                background: "#ef4444",
                border: "none",
                padding: "6px 14px",
                borderRadius: "6px",
                color: "white",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
>>>>>>> 733e1d5d8aaa1d561483c9dc3bea52ff502641b3
    </div>
  );
}