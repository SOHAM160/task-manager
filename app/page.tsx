"use client";

import { useEffect, useState } from "react";
import ParticleBackground from "@/components/ParticleBackground";

export default function Home() {

<<<<<<< HEAD
=======
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailOptions, setEmailOptions] = useState<string[]>([]);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);

>>>>>>> 248f97b (Initial version with auth and logging)
  const [tasks, setTasks] = useState<any[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(3);
  const [deadline, setDeadline] = useState("");

  const [algorithm, setAlgorithm] = useState("fcfs");

<<<<<<< HEAD
  // Fetch tasks
  const fetchTasks = async () => {

    const res = await fetch("/api/tasks");
=======
  const fetchCurrentUser = async () => {

    try {

      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (!res.ok) {

        setUserEmail(null);
        setTasks([]);
        return;

      }

      const data = await res.json();
      setUserEmail(data.user.email);

    } catch {

      setUserEmail(null);
      setTasks([]);

    }

  };

  // Fetch tasks
  const fetchTasks = async () => {

    const res = await fetch("/api/tasks", {
      credentials: "include",
    });
>>>>>>> 248f97b (Initial version with auth and logging)
    const data = await res.json();

    setTasks(data);

  };

  useEffect(() => {
<<<<<<< HEAD
    fetchTasks();
  }, []);

  // Add task
  const addTask = async () => {

    if (!title) return;
=======
    fetchCurrentUser();

    // Prefill email input from previous login on this browser
    try {
      const storedEmail = window.localStorage.getItem("lastEmail");
      const storedList = window.localStorage.getItem("emailHistory");

      if (storedList) {
        const parsed = JSON.parse(storedList) as string[];
        setEmailOptions(parsed);
        if (!storedEmail && parsed.length > 0) {
          setAuthEmail(parsed[0]);
        }
      } else if (storedEmail) {
        setEmailOptions([storedEmail]);
        setAuthEmail(storedEmail);
      } else if (storedEmail) {
        setAuthEmail(storedEmail);
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    if (userEmail) {
      fetchTasks();
    } else {
      setTasks([]);
    }
  }, [userEmail]);

  const handleAuth = async () => {

    if (!authEmail || !authPassword) return;

    setAuthError(null);

    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email: authEmail,
        password: authPassword,
        rememberMe,
      }),
    });

    if (!res.ok) {

      const data = await res.json().catch(() => null);
      setAuthError(data?.error || "Authentication failed");
      return;

    }

    try {
      window.localStorage.setItem("lastEmail", authEmail);
      setEmailOptions((prev) => {
        const without = prev.filter((e) => e !== authEmail);
        const next = [authEmail, ...without].slice(0, 5);
        window.localStorage.setItem("emailHistory", JSON.stringify(next));
        return next;
      });
    } catch {
      // ignore localStorage errors
    }

    setAuthPassword("");
    await fetchCurrentUser();
    await fetchTasks();

  };

  const handleLogout = async () => {

    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    setUserEmail(null);
    setTasks([]);

  };

  // Add task
  const addTask = async () => {

    if (!title || !userEmail) return;
>>>>>>> 248f97b (Initial version with auth and logging)

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

<<<<<<< HEAD
      const res = await fetch(`/api/schedule?algo=${algorithm}`);
=======
      const res = await fetch(`/api/schedule?algo=${algorithm}`, {
        credentials: "include",
      });
>>>>>>> 248f97b (Initial version with auth and logging)

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

<<<<<<< HEAD
          <p className="text-gray-400 mb-8">
            Current Algorithm:{" "}
            <span className="text-purple-400 font-semibold">
              {algorithm.toUpperCase()}
            </span>
          </p>
=======
          {userEmail ? (
            <div className="flex justify-between items-center mb-8">
              <p className="text-gray-400">
                Logged in as{" "}
                <span className="text-purple-400 font-semibold">
                  {userEmail}
                </span>
              </p>
              <button
                onClick={handleLogout}
                className="text-sm text-red-400 hover:text-red-500 border border-red-500 px-3 py-1 rounded"
              >
                Logout
              </button>
            </div>
          ) : (
            <p className="text-gray-400 mb-8">
              Please log in or register to manage your tasks.
            </p>
          )}

          {/* Auth Form */}

          {!userEmail && (
            <div className="bg-gray-900/80 backdrop-blur p-6 rounded-xl mb-8 shadow-lg">
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setAuthMode("login")}
                  className={`px-3 py-1 rounded ${
                    authMode === "login"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-300"
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setAuthMode("register")}
                  className={`px-3 py-1 rounded ${
                    authMode === "register"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-300"
                  }`}
                >
                  Register
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div className="relative">
                  <div className="flex">
                    <input
                      className="p-3 rounded bg-gray-800 border border-gray-700 flex-1 rounded-r-none"
                      placeholder="Email"
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      onFocus={() => {
                        if (emailOptions.length > 0) setShowEmailDropdown(true);
                      }}
                    />
                    <button
                      type="button"
                      className="px-3 bg-gray-800 border border-l-0 border-gray-700 rounded-r text-sm"
                      onClick={() =>
                        setShowEmailDropdown((open) =>
                          emailOptions.length > 0 ? !open : false,
                        )
                      }
                    >
                      ▼
                    </button>
                  </div>
                  {showEmailDropdown && emailOptions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded bg-gray-900 border border-gray-700 max-h-40 overflow-y-auto">
                      {emailOptions.map((email) => (
                        <button
                          key={email}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800"
                          onClick={() => {
                            setAuthEmail(email);
                            setShowEmailDropdown(false);
                          }}
                        >
                          {email}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  className="p-3 rounded bg-gray-800 border border-gray-700"
                  placeholder="Password"
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />

                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me on this device</span>
                </label>

                {authError && (
                  <p className="text-red-400 text-sm">{authError}</p>
                )}

                <button
                  onClick={handleAuth}
                  className="bg-blue-600 hover:bg-blue-700 transition p-3 rounded font-semibold"
                >
                  {authMode === "login" ? "Login" : "Register"}
                </button>
              </div>
            </div>
          )}
>>>>>>> 248f97b (Initial version with auth and logging)

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