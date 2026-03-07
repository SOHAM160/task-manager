"use client";

import { useEffect, useState } from "react";
import ParticleBackground from "@/components/ParticleBackground";

export default function Home() {

  const [tasks, setTasks] = useState<any[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(3);
  const [deadline, setDeadline] = useState("");

  const [algorithm, setAlgorithm] = useState("fcfs");

  // Fetch tasks
  const fetchTasks = async () => {

    const res = await fetch("/api/tasks");
    const data = await res.json();

    setTasks(data);

  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Add task
  const addTask = async () => {

    if (!title) return;

    await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        priority,
        deadline,
      }),
    });

    setTitle("");
    setDescription("");
    setPriority(3);
    setDeadline("");

    fetchTasks();

  };

  // Toggle completion
  const toggleTask = async (task: any) => {

    await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        completed: !task.completed,
      }),
    });

    fetchTasks();

  };

  // Delete task
  const deleteTask = async (id: number) => {

    await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
    });

    fetchTasks();

  };

  // Run scheduler
  const runScheduler = async () => {

    try {

      const res = await fetch(`/api/schedule?algo=${algorithm}`);

      if (!res.ok) {
        throw new Error("Scheduler failed");
      }

      const data = await res.json();

      console.log("Scheduler result:", data);

      // update UI with scheduled order
      setTasks([...data]);

    } catch (err) {

      console.error(err);

    }

  };

  const priorityColor = (p: number) => {

    if (p === 1) return "bg-red-500";
    if (p === 2) return "bg-yellow-500";
    return "bg-green-500";

  };

  const priorityText = (p: number) => {

    if (p === 1) return "High";
    if (p === 2) return "Medium";
    return "Low";

  };

  return (

    <>
      <ParticleBackground />

      <main className="min-h-screen text-white p-10">

        <div className="max-w-4xl mx-auto">

          {/* Header */}

          <h1 className="text-4xl font-bold mb-2">
            Task Scheduler Dashboard
          </h1>

          <p className="text-gray-400 mb-8">
            Current Algorithm:{" "}
            <span className="text-purple-400 font-semibold">
              {algorithm.toUpperCase()}
            </span>
          </p>

          {/* Scheduler Controls */}

          <div className="bg-gray-900/80 backdrop-blur p-4 rounded-xl mb-6 flex gap-4 items-center">

            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="p-2 bg-gray-800 rounded"
            >

              <option value="fcfs">FCFS</option>
              <option value="priority">Priority Scheduling</option>
              <option value="edf">Earliest Deadline First</option>
              <option value="roundrobin">Round Robin</option>

            </select>

            <button
              onClick={runScheduler}
              className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-700"
            >
              Run Scheduler
            </button>

          </div>

          {/* Add Task */}

          <div className="bg-gray-900/80 backdrop-blur p-6 rounded-xl mb-8 shadow-lg">

            <h2 className="text-xl font-semibold mb-4">
              Create Task
            </h2>

            <div className="flex flex-col gap-3">

              <input
                className="p-3 rounded bg-gray-800 border border-gray-700"
                placeholder="Task Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <textarea
                className="p-3 rounded bg-gray-800 border border-gray-700"
                placeholder="Task Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <div className="flex gap-4">

                <select
                  className="p-3 rounded bg-gray-800 border border-gray-700"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                >

                  <option value={1}>High Priority</option>
                  <option value={2}>Medium Priority</option>
                  <option value={3}>Low Priority</option>

                </select>

                <input
                  type="date"
                  className="p-3 rounded bg-gray-800 border border-gray-700"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />

              </div>

              <button
                onClick={addTask}
                className="bg-blue-600 hover:bg-blue-700 transition p-3 rounded font-semibold"
              >
                Add Task
              </button>

            </div>

          </div>

          {/* Task List */}

          <div className="flex flex-col gap-4">

            {tasks.map((task: any, index: number) => (

              <div
                key={task.id}
                className="bg-gray-900/80 backdrop-blur p-5 rounded-xl shadow flex justify-between items-start hover:bg-gray-800 transition"
              >

                <div className="flex gap-4 items-start">

                  {/* Execution Order */}

                  <span className="text-purple-400 font-bold text-lg">
                    #{index + 1}
                  </span>

                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task)}
                    className="mt-1"
                  />

                  <div>

                    <h3
                      className="text-lg font-semibold"
                      style={{
                        textDecoration: task.completed ? "line-through" : "none",
                      }}
                    >
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="text-gray-400 text-sm mt-1">
                        {task.description}
                      </p>
                    )}

                    <div className="flex gap-4 mt-3 text-sm">

                      <span
                        className={`px-2 py-1 rounded text-black ${priorityColor(task.priority)}`}
                      >
                        {priorityText(task.priority)}
                      </span>

                      {task.deadline && (
                        <span className="text-gray-400">
                          Deadline: {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      )}

                    </div>

                  </div>

                </div>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-red-400 hover:text-red-500"
                >
                  Delete
                </button>

              </div>

            ))}

          </div>

        </div>

      </main>

    </>
  );

}