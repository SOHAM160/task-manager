"use client";

import { useEffect, useState, useCallback } from "react";
import ParticleBackground from "@/components/ParticleBackground";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function Home() {


  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailOptions, setEmailOptions] = useState<string[]>([]);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);


  const [tasks, setTasks] = useState<any[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(3);
  const [deadline, setDeadline] = useState("");

  const [pendingSubtasks, setPendingSubtasks] = useState<string[]>([]);
  const [newSubtaskFormTitle, setNewSubtaskFormTitle] = useState("");

  const [addingSubtaskTo, setAddingSubtaskTo] = useState<number | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState("");

  const [algorithm, setAlgorithm] = useState("fcfs");

  const [tags, setTags] = useState<any[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6B7280");
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Assignment State
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<number | "">("");

  // Filtering & Pagination State
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<number | "">("");
  const [filterTagId, setFilterTagId] = useState<number | "">("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");
  const [isLoading, setIsLoading] = useState(false);

  // Workspace State
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<number | null>(null);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);

  // Comments State
  const [activeTaskIdForComments, setActiveTaskIdForComments] = useState<number | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const callApi = useCallback(async (url: string, options: RequestInit = {}) => {
    const sid = typeof window !== 'undefined' ? window.sessionStorage.getItem("sessionId") : null;
    const headers: any = {
      ...options.headers,
    };
    if (sid) headers["Session-ID"] = sid;
    
    return fetch(url, { 
      ...options, 
      headers,
      credentials: "include" 
    });
  }, []);

  const fetchCurrentUser = async () => {

    try {

      const res = await callApi("/api/auth/me");

      if (!res.ok) {

        setUserEmail(null);
        setTasks([]);
        return;

      }

      const data = await res.json();
      setUserEmail(data.user.email);
      
      // Promote cookie session to tab-specific session storage if needed
      if (data.sessionId && typeof window !== 'undefined' && !window.sessionStorage.getItem("sessionId")) {
        window.sessionStorage.setItem("sessionId", data.sessionId);
        setSessionId(data.sessionId);
      }
    } catch {

      setUserEmail(null);
      setTasks([]);

    }

  };

  // Fetch tasks
  const fetchTasks = async (resetPage = false) => {
    if (isLoading) return;
    setIsLoading(true);

    const currentPage = resetPage ? 1 : page;
    const query = new URLSearchParams({
      page: currentPage.toString(),
      limit: "20"
    });

    if (filterStatus) query.append("status", filterStatus);
    if (filterPriority) query.append("priority", filterPriority.toString());
    if (filterTagId) query.append("tagId", filterTagId.toString());
    if (currentWorkspaceId) query.append("workspaceId", currentWorkspaceId.toString());

    const res = await callApi(`/api/tasks?${query.toString()}`);

    const data = await res.json();
    
    if (resetPage) {
      setTasks(data);
      setPage(2);
    } else {
      setTasks(prev => [...prev, ...data]);
      setPage(prev => prev + 1);
    }
    
    setHasMore(data.length === 20);
    setIsLoading(false);
  };

  const fetchTags = async () => {
    const res = await callApi("/api/tags");
    if (res.ok) {
      const data = await res.json();
      setTags(data);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (userEmail) {
      fetchTasks(true);
      fetchTags();
      fetchWorkspaces();
    }
  }, [userEmail, filterStatus, filterPriority, filterTagId, currentWorkspaceId]);

  const fetchWorkspaces = async () => {
    const res = await callApi("/api/workspaces");
    if (res.ok) {
      const data = await res.json();
      setWorkspaces(data);
    }
  };

  const createWorkspace = async () => {
    if (!newWorkspaceName) return;
    const res = await callApi("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newWorkspaceName }),
    });
    if (res.ok) {
      setNewWorkspaceName("");
      fetchWorkspaces();
    }
  };

  const joinWorkspace = async () => {
    if (!inviteCode) return;
    const res = await callApi("/api/workspaces/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode }),
    });
    if (res.ok) {
      setInviteCode("");
      fetchWorkspaces();
    }
  };

  const fetchComments = async (taskId: number) => {
    setIsLoadingComments(true);
    const res = await callApi(`/api/tasks/${taskId}/comments`);
    if (res.ok) {
      const data = await res.json();
      setComments(data);
    }
    setIsLoadingComments(false);
  };

  const addComment = async () => {
    if (!newCommentText || !activeTaskIdForComments) return;
    const res = await callApi(`/api/tasks/${activeTaskIdForComments}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newCommentText }),
    });
    if (res.ok) {
      setNewCommentText("");
      fetchComments(activeTaskIdForComments);
    }
  };

  const handleAuth = async () => {

    if (!authEmail || !authPassword) return;

    setAuthError(null);

    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";

    const res = await callApi(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: authEmail,
        password: authPassword,
        rememberMe,
      }),
    });

    const data = await res.json().catch(() => null);

    if (res.ok && data?.sessionId) {
      window.sessionStorage.setItem("sessionId", data.sessionId);
      setSessionId(data.sessionId);
    }

    if (!res.ok) {
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
    await fetchTags();

  };

  const handleLogout = async () => {

    await callApi("/api/auth/logout", {
      method: "POST",
    });

    window.sessionStorage.removeItem("sessionId");
    setSessionId(null);

    setUserEmail(null);
    setTasks([]);

  };

  // Add task or subtask
  const addTask = async (parentTaskId: number | null = null, inlineTitle: string = "") => {
    
    const taskTitle = parentTaskId ? inlineTitle : title;
    
    if (!taskTitle || !userEmail) return;

    await callApi("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: taskTitle,
        description: parentTaskId ? null : description,
        priority: parentTaskId ? 3 : priority,
        deadline: parentTaskId ? null : deadline,
        tagIds: parentTaskId ? [] : selectedTagIds,
        parentTaskId: parentTaskId,
        workspaceId: currentWorkspaceId,
        assigneeId: parentTaskId ? null : (selectedAssigneeId || null),
        subtaskTitles: parentTaskId ? [] : pendingSubtasks
      }),
    });

    if (parentTaskId) {
      setSubtaskTitle("");
      setAddingSubtaskTo(null);
    } else {
      setTitle("");
      setDescription("");
      setPriority(3);
      setDeadline("");
      setSelectedTagIds([]);
      setPendingSubtasks([]);
      setSelectedAssigneeId("");
    }

    fetchTasks(true);

  };

  // Toggle completion
  const toggleTask = async (task: any) => {

    await callApi(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        completed: !task.completed,
      }),
    });

    fetchTasks(true);

  };

  // Drag and drop handler
  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const taskId = parseInt(draggableId);
    const newStatus = destination.droppableId;

    // Optimistic UI update
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    setTasks(updatedTasks);

    await callApi(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  };

  // Delete task
  const deleteTask = async (id: number) => {

    await callApi(`/api/tasks/${id}`, {
      method: "DELETE",
    });

    fetchTasks(true);

  };

  // Create a new tag
  const createTag = async () => {
    if (!newTagName) return;

    const res = await callApi("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTagName, color: newTagColor }),
    });

    if (res.ok) {
      const data = await res.json();
      setNewTagName("");
      setIsCreatingTag(false);
      setTags(prev => [...prev, data]);
      setSelectedTagIds(prev => [...prev, data.id]);
    } else {
       const data = await res.json();
       alert(data.error || "Failed to create tag");
    }
  };

  // Run scheduler
  const runScheduler = async () => {

    try {

      const res = await callApi(`/api/schedule?algo=${algorithm}`);

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

          <div className="flex justify-between items-center mb-8">
            <p className="text-gray-400">
              Current Algorithm:{" "}
              <span className="text-purple-400 font-semibold mr-6">
                {algorithm.toUpperCase()}
              </span>
            </p>
          </div>

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

          {/* Task Management UI */}
          {userEmail && (
            <div className="flex flex-col gap-6">
              
              {/* Filtering and View Controls */}
              <div className="bg-gray-900/50 backdrop-blur p-4 rounded-xl border border-gray-800 flex flex-wrap gap-4 items-center justify-between shadow-inner">
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Status</label>
                    <select 
                      value={filterStatus} 
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="">All Statuses</option>
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Priority</label>
                    <select 
                      value={filterPriority} 
                      onChange={(e) => setFilterPriority(e.target.value === "" ? "" : Number(e.target.value))}
                      className="bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="">All Priorities</option>
                      <option value="1">High</option>
                      <option value="2">Medium</option>
                      <option value="3">Low</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Tag</label>
                    <select 
                      value={filterTagId} 
                      onChange={(e) => setFilterTagId(e.target.value === "" ? "" : Number(e.target.value))}
                      className="bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="">All Tags</option>
                      {tags.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Algorithm</label>
                    <div className="flex gap-2">
                      <select 
                        value={algorithm} 
                        onChange={(e) => setAlgorithm(e.target.value)}
                        className="bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        <option value="fcfs">FCFS</option>
                        <option value="priority">Priority</option>
                        <option value="edf">EDF</option>
                        <option value="roundrobin">RR</option>
                      </select>
                      <button 
                        onClick={runScheduler}
                        className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                      >
                        Run
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Workspace</label>
                    <div className="flex gap-2">
                    <select 
                      value={currentWorkspaceId || ""} 
                      onChange={(e) => setCurrentWorkspaceId(e.target.value ? Number(e.target.value) : null)}
                      className="bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="">Personal</option>
                      {workspaces.map(ws => (
                        <option key={ws.id} value={ws.id}>{ws.name}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => setIsWorkspaceModalOpen(true)}
                      className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                    >
                      Projects
                    </button>
                    </div>
                  </div>
                </div>

                <div className="flex bg-gray-800 p-1 rounded-lg">
                  <button 
                    onClick={() => setViewMode("list")}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'list' ? 'bg-purple-600 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                  >
                    List
                  </button>
                  <button 
                    onClick={() => setViewMode("kanban")}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'kanban' ? 'bg-purple-600 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                  >
                    Board
                  </button>
                </div>
              </div>

              {/* Add Task Form */}
              <div className="bg-gray-900/80 backdrop-blur p-6 rounded-xl shadow-lg border border-gray-800/50">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
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

                  <div className="flex flex-col gap-2 mt-2">
                    <label className="text-sm text-gray-400 font-semibold">Select Tags</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => setSelectedTagIds(prev => prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id])}
                          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${selectedTagIds.includes(tag.id) ? 'ring-2 ring-white scale-105' : 'opacity-70 hover:opacity-100'}`}
                          style={{ backgroundColor: tag.color + '40', color: tag.color, border: `1px solid ${tag.color}` }}
                        >
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: tag.color }}></span>
                          {tag.name}
                        </button>
                      ))}
                      <button onClick={() => setIsCreatingTag(!isCreatingTag)} className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700 transition">+ New Tag</button>
                    </div>

                    {isCreatingTag && (
                      <div className="flex gap-2 items-center bg-gray-900/50 p-3 rounded border border-gray-700/50">
                        <input type="text" placeholder="Tag Name" className="p-2 rounded bg-gray-800 border border-gray-700 text-sm flex-1" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} />
                        <input type="color" className="h-9 w-12 rounded cursor-pointer bg-transparent border-0" value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)} />
                        <button onClick={createTag} className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm font-semibold transition">Save Tag</button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 mt-4 bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
                    <label className="text-sm text-gray-400 font-semibold">Add Checklist Items (Subtasks)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Email client..."
                        className="p-2.5 rounded bg-gray-900/50 border border-gray-700 text-sm flex-1"
                        value={newSubtaskFormTitle}
                        onChange={(e) => setNewSubtaskFormTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newSubtaskFormTitle.trim()) {
                            e.preventDefault();
                            setPendingSubtasks([...pendingSubtasks, newSubtaskFormTitle.trim()]);
                            setNewSubtaskFormTitle("");
                          }
                        }}
                      />
                      <button type="button" onClick={() => { if (newSubtaskFormTitle.trim()) { setPendingSubtasks([...pendingSubtasks, newSubtaskFormTitle.trim()]); setNewSubtaskFormTitle(""); } }} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm font-bold transition">+</button>
                    </div>
                    {pendingSubtasks.map((st, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-900/40 px-3 py-1.5 rounded border border-gray-800">
                        <span className="text-sm text-gray-300">{st}</span>
                        <button type="button" onClick={() => setPendingSubtasks(pendingSubtasks.filter((_, i) => i !== idx))} className="text-gray-500 hover:text-red-400 text-xs">Remove</button>
                      </div>
                    ))}
                  </div>

                  {currentWorkspaceId && (
                    <div className="flex flex-col gap-2 mt-4 bg-purple-900/10 p-4 rounded-lg border border-purple-500/20">
                      <label className="text-sm text-gray-400 font-semibold">Assign Task To</label>
                      <select 
                        value={selectedAssigneeId} 
                        onChange={(e) => setSelectedAssigneeId(e.target.value ? Number(e.target.value) : "")}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">No Assignee</option>
                        {workspaces.find(w => w.id === currentWorkspaceId)?.members.map((m: any) => (
                          <option key={m.userId} value={m.userId}>{m.user.email}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button onClick={() => addTask(null)} className="bg-blue-600 hover:bg-blue-700 transition p-4 rounded-xl font-bold mt-2">Add Task</button>
                </div>
              </div>

              {/* View Content */}
              {viewMode === "list" ? (
                <div className="flex flex-col gap-4">
                  {tasks.map((task, index) => renderTaskCard(task, index))}
                  {hasMore && (
                    <button 
                      onClick={() => fetchTasks()} 
                      className="bg-gray-800 hover:bg-gray-700 p-3 rounded-xl text-gray-400 transition font-semibold"
                    >
                      {isLoading ? "Loading..." : "Load More Tasks"}
                    </button>
                  )}
                </div>
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {["TODO", "IN_PROGRESS", "DONE"].map(colId => (
                      <div key={colId} className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                          <h3 className="text-sm font-bold uppercase tracking-tighter text-gray-500 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${colId === 'TODO' ? 'bg-gray-400' : colId === 'IN_PROGRESS' ? 'bg-blue-400' : 'bg-green-400'}`}></span>
                            {colId.replace("_", " ")}
                          </h3>
                          <span className="bg-gray-800 text-[10px] px-2 py-0.5 rounded-full font-bold text-gray-400">
                            {tasks.filter(t => t.status === colId).length}
                          </span>
                        </div>
                        
                        <Droppable droppableId={colId}>
                          {(provided) => (
                            <div 
                              {...provided.droppableProps} 
                              ref={provided.innerRef}
                              className="bg-gray-900/40 p-3 rounded-2xl min-h-[500px] border border-gray-800/50 flex flex-col gap-4"
                            >
                              {tasks.filter(t => t.status === colId).map((task, index) => (
                                <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                                  {(provided) => (
                                    <div 
                                      ref={provided.innerRef} 
                                      {...provided.draggableProps} 
                                      {...provided.dragHandleProps}
                                    >
                                      {renderTaskCard(task)}
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    ))}
                  </div>
                </DragDropContext>
              )}
            </div>
          )}
        </div>
      </main>
      {renderWorkspaceModal()}
      {renderCommentsModal()}
    </>
  );

  function renderCommentsModal() {
    if (!activeTaskIdForComments) return null;
    const activeTask = tasks.find(t => t.id === activeTaskIdForComments);
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-[80vh]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Task Discussion</h2>
              <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                {activeTask?.title} 
                <span className="mx-1">•</span> 
                <span className="text-blue-400 font-semibold">Logged in as: {userEmail}</span>
              </p>
            </div>
            <button onClick={() => { setActiveTaskIdForComments(null); setComments([]); }} className="text-gray-500 hover:text-white">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
            {isLoadingComments ? (
              <div className="text-center py-8 text-gray-500">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 italic">No comments yet. Start the conversation!</div>
            ) : (
              comments.map(c => {
                const isMe = c.user.email.toLowerCase() === userEmail?.toLowerCase();
                return (
                  <div key={c.id} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex justify-between items-center w-full px-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isMe ? 'text-blue-400' : 'text-purple-400'}`}>
                        {isMe ? 'You' : `From: ${c.user.email}`}
                      </span>
                      <span className="text-[9px] text-gray-600">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <div className={`p-3 rounded-2xl text-sm shadow-sm max-w-[90%] ${
                      isMe 
                      ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-tr-none' 
                      : 'bg-gray-800/80 border border-gray-700/50 text-gray-300 rounded-tl-none'
                    }`}>
                      {c.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex gap-2">
            <input 
              type="text" 
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addComment()}
              placeholder="Write a comment..."
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm flex-1 outline-none"
            />
            <button onClick={addComment} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold">Post</button>
          </div>
        </div>
      </div>
    );
  }

  function renderTaskCard(task: any, index?: number) {
    return (
      <div
        key={task.id}
        className="bg-gray-900/80 backdrop-blur p-4 rounded-xl shadow border border-gray-800/50 flex flex-col gap-3 group hover:bg-gray-800/90 transition-all duration-300"
      >
        <div className="flex justify-between items-start gap-3">
          <div className="flex gap-3 items-start flex-1">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task)}
              className="mt-1"
            />
            <div className="flex-1">
              <h3 className="text-md font-semibold text-gray-100" style={{ textDecoration: task.completed ? "line-through" : "none" }}>
                {index !== undefined && <span className="text-gray-600 mr-2 text-xs">#{index + 1}</span>}
                {task.title}
              </h3>
              {task.description && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{task.description}</p>}
            </div>
          </div>
          <button onClick={() => deleteTask(task.id)} className="text-gray-600 hover:text-red-400 transition text-xs opacity-0 group-hover:opacity-100 shrink-0">Delete</button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className={`text-[10px] px-2 py-0.5 rounded font-bold text-gray-900 ${priorityColor(task.priority)}`}>
            {priorityText(task.priority)}
          </span>
          {task.deadline && (
            <span className="text-[10px] text-gray-500 flex items-center gap-1">
              📅 {new Date(task.deadline).toLocaleDateString()}
            </span>
          )}
          {task.assignee && (
            <span className="text-[10px] text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded border border-purple-500/20">
              👤 {task.assignee.email.split('@')[0]}
            </span>
          )}
          <button 
            onClick={() => { setActiveTaskIdForComments(task.id); fetchComments(task.id); }}
            className="text-[10px] text-blue-400 hover:text-blue-300 transition flex items-center gap-1 ml-auto"
          >
            💬 Discuss
          </button>
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag: any) => (
               <span key={tag.id} className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: tag.color + '20', color: tag.color, border: `1px solid ${tag.color}40` }}>
                 {tag.name}
               </span>
            ))}
          </div>
        )}

        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mt-1 border-t border-gray-800 pt-2 flex flex-col gap-1.5 px-1">
            {task.subtasks.map((sub: any) => (
              <div key={sub.id} className="flex items-center gap-2 group/sub">
                <input type="checkbox" checked={sub.completed} onChange={() => toggleTask(sub)} className="w-3 h-3 opacity-50" />
                <span className={`text-[11px] flex-1 ${sub.completed ? 'line-through text-gray-600' : 'text-gray-400'}`}>{sub.title}</span>
              </div>
            ))}
          </div>
        )}
        
        {addingSubtaskTo === task.id ? (
          <div className="flex gap-1.5 px-1">
            <input type="text" placeholder="Subtask..." className="bg-gray-800 border-none px-2 py-1 rounded text-[11px] flex-1 outline-none" value={subtaskTitle} onChange={(e) => setSubtaskTitle(e.target.value)} autoFocus onKeyDown={(e) => { if(e.key === 'Enter') addTask(task.id, subtaskTitle); if(e.key === 'Escape') setAddingSubtaskTo(null); }} />
          </div>
        ) : (
          <button onClick={() => { setAddingSubtaskTo(task.id); setSubtaskTitle(""); }} className="text-[10px] text-gray-600 hover:text-gray-400 transition self-start ml-1">+ Add Checklist Item</button>
        )}
      </div>
    );
  }

  function renderWorkspaceModal() {
    if (!isWorkspaceModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Project Workspaces</h2>
            <button onClick={() => setIsWorkspaceModalOpen(false)} className="text-gray-500 hover:text-white">✕</button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Create New Project</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Project name..."
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm flex-1 outline-none"
                />
                <button onClick={createWorkspace} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold">Create</button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Join with Code</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Invite code..."
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm flex-1 outline-none"
                />
                <button onClick={joinWorkspace} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold">Join</button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Your Projects</label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {workspaces.map(ws => (
                  <div key={ws.id} className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-200">{ws.name}</span>
                      <span className="text-[10px] bg-gray-700 px-2 py-0.5 rounded text-gray-400 capitalize">{ws.ownerId === workspaces.find(w => w.ownerId === ws.ownerId)?.ownerId ? 'Owner' : 'Member'}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1 flex items-center justify-between">
                      <span>Invite Code: <code className="text-purple-400 select-all">{ws.inviteCode}</code></span>
                      <span>{ws.members.length} Members</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}