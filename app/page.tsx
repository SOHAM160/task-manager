"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [tasks, setTasks] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(3);
  const [deadline, setDeadline] = useState("");

  const fetchTasks = async () => {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(data);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const addTask = async () => {
    if (!title) return;

    await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        description,
        priority,
        deadline
      })
    });

    setTitle("");
    setDescription("");
    setPriority(3);
    setDeadline("");

    fetchTasks();
  };

  const toggleTask = async (task: any) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        completed: !task.completed
      })
    });

    fetchTasks();
  };

  const deleteTask = async (id: number) => {
    await fetch(`/api/tasks/${id}`, {
      method: "DELETE"
    });

    fetchTasks();
  };

  return (
    <main className="p-10 max-w-3xl mx-auto text-white">

      <h1 className="text-3xl font-bold mb-6">Task Manager</h1>

      {/* Add Task Form */}

      <div className="flex flex-col gap-3 mb-6">

        <input
          className="p-2 bg-gray-800 rounded"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="p-2 bg-gray-800 rounded"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <select
          className="p-2 bg-gray-800 rounded"
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value))}
        >
          <option value={1}>High Priority</option>
          <option value={2}>Medium Priority</option>
          <option value={3}>Low Priority</option>
        </select>

        <input
          className="p-2 bg-gray-800 rounded"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />

        <button
          className="bg-green-500 px-4 py-2 rounded"
          onClick={addTask}
        >
          Add Task
        </button>

      </div>

      {/* Task List */}

      <div className="flex flex-col gap-4">

        {tasks.map((task: any) => (

          <div
            key={task.id}
            className="bg-gray-800 p-4 rounded flex justify-between items-center"
          >

            <div className="flex gap-3 items-start">

              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task)}
              />

              <div>

                <p
                  style={{
                    textDecoration: task.completed ? "line-through" : "none"
                  }}
                >
                  {task.title}
                </p>

                {task.description && (
                  <p className="text-sm text-gray-400">
                    {task.description}
                  </p>
                )}

                <div className="text-sm text-gray-400 flex gap-4">

                  <span>
                    Priority: {task.priority === 1 ? "High" :
                               task.priority === 2 ? "Medium" : "Low"}
                  </span>

                  {task.deadline && (
                    <span>
                      Deadline: {new Date(task.deadline).toLocaleDateString()}
                    </span>
                  )}

                </div>

              </div>

            </div>

            <button
              className="bg-red-500 px-3 py-1 rounded"
              onClick={() => deleteTask(task.id)}
            >
              Delete
            </button>

          </div>

        ))}

      </div>

    </main>
  );
}