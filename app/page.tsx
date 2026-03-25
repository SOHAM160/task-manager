"use client";

import { useEffect, useState, useCallback } from "react";
import ParticleBackground from "@/components/ParticleBackground";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

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

  const [addingSubtaskTo, setAddingSubtaskTo] = useState<string | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState("");

  const [algorithm, setAlgorithm] = useState("fcfs");

  const [tags, setTags] = useState<any[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6B7280");
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Assignment State
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | "">("");

  // Filtering & Pagination State
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<number | "">("");
  const [filterTagId, setFilterTagId] = useState<string | "">("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");
  const [isLoading, setIsLoading] = useState(false);

  // Workspace State
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);

  // Comments State
  const [activeTaskIdForComments, setActiveTaskIdForComments] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [aiSchedule, setAiSchedule] = useState<string[]>([]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSyncingNotifications, setIsSyncingNotifications] = useState(false);

  const callApi = useCallback(async (url: string, options: RequestInit = {}) => {
    const sid = typeof window !== 'undefined' ? window.sessionStorage.getItem("sessionId") : null;
    const headers: any = {
      ...options.headers,
    };
    if (sid) headers["Session-ID"] = sid;
    
    const res = await fetch(url, { 
      ...options, 
      headers,
      credentials: "include" 
    });

    if (res.status === 401 && !url.includes("/api/auth/me") && !url.includes("/api/auth/login") && !url.includes("/api/auth/register")) {
      setUserEmail(null);
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem("sessionId");
      }
    }

    return res;
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
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const sid = params.get("sessionId");

    if (error) {
      if (error === "gmail_only") setAuthError("Only official @gmail.com accounts are allowed.");
      else if (error === "auth_failed") setAuthError("Google authentication failed. Please try again.");
      else if (error === "server_error") setAuthError("A server error occurred during login.");
      else setAuthError("An unexpected error occurred.");
    }

    if (sid) {
       window.sessionStorage.setItem("sessionId", sid);
       setSessionId(sid);
       fetchCurrentUser(); // Re-fetch now that we have the session
    }

    if (error || sid) {
      // Clear query params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
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

  const fetchComments = async (taskId: string) => {
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
  const addTask = async (parentTaskId: string | null = null, inlineTitle: string = "") => {
    
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

  const handleAiBreakdown = async () => {
    if (!title || isBreakingDown) return;
    setIsBreakingDown(true);

    try {
      const res = await callApi("/api/ai/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      const data = await res.json();
      if (res.ok && data.subtasks) {
        setPendingSubtasks(prev => [...prev, ...data.subtasks]);
        if (data.hint) {
          alert(data.hint);
        }
      } else {
        alert(data.error || "Failed to break down task");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setIsBreakingDown(false);
    }
  };

  const handleGenerateAiSchedule = async () => {
    if (isGeneratingSchedule) return;
    setIsGeneratingSchedule(true);
    setAiSchedule([]);

    try {
      const res = await callApi("/api/ai/schedule");
      const data = await res.json();
      
      if (res.ok && data.schedule) {
        setAiSchedule(data.schedule);
      } else {
        alert(data.error || "Failed to generate AI schedule");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong generating the schedule");
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  const handleEmailPlan = async () => {
    if (aiSchedule.length === 0 || isSendingEmail) return;
    setIsSendingEmail(true);
    try {
      const res = await callApi("/api/notifications/daily-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule: aiSchedule }),
      });
      const data = await res.json();
      if (res.ok) alert(`✅ ${data.message}`);
      else alert(`❌ ${data.error}`);
    } catch {
      alert("Failed to send email");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSyncNotifications = async () => {
    if (isSyncingNotifications) return;
    setIsSyncingNotifications(true);
    try {
      const res = await callApi("/api/notifications/sync", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: currentWorkspaceId })
      });
      const data = await res.json();
      if (res.ok) alert(`🔔 ${data.message}`);
      else alert(`❌ ${data.error}`);
    } catch {
      alert("Failed to sync notifications");
    } finally {
      setIsSyncingNotifications(false);
    }
  };

  // Toggle completion for a single task
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

  // Toggle parent and all subtasks together
  const toggleParentWithSubtasks = async (task: any) => {
    const newCompleted = !task.completed;
    await callApi(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: newCompleted }),
    });
    fetchTasks(true);
  };

  // Drag and drop handler
  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const taskId = draggableId;
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
  const deleteTask = async (id: string) => {

    await callApi(`/api/tasks/${id}`, {
      method: "DELETE",
    });

    fetchTasks(true);

  };

  const deleteWorkspace = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    
    const res = await callApi(`/api/workspaces/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      if (currentWorkspaceId === id) setCurrentWorkspaceId(null);
      fetchWorkspaces();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete project");
    }
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

      <main className="min-h-screen text-white flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900/60 backdrop-blur-xl border-r border-gray-800 flex flex-col pt-8 shrink-0">
          <div className="px-6 mb-8">
            <h1 className="text-xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              TM DASHBOARD
            </h1>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            <button 
              onClick={() => setCurrentWorkspaceId(null)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${!currentWorkspaceId ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
            >
              <span className="text-lg">👤</span> Personal
            </button>

            <div className="pt-6 pb-2 px-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-[11px]">Projects</span>
                <button onClick={() => setIsWorkspaceModalOpen(true)} className="text-blue-500 hover:text-blue-400 text-xs font-bold">+</button>
              </div>
            </div>

            {workspaces.map(ws => (
              <button 
                key={ws.id}
                onClick={() => setCurrentWorkspaceId(ws.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${currentWorkspaceId === ws.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span className="truncate max-w-[120px]">{ws.name}</span>
                </div>
                {ws._count?.tasks > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${currentWorkspaceId === ws.id ? 'bg-white/20 text-white' : 'bg-gray-800 text-gray-500'}`}>
                    {ws._count?.tasks}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 mt-auto border-t border-gray-800/50">
             {userEmail && (
               <div className="flex items-center gap-3 px-2 mb-4">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-xs">
                   {userEmail[0].toUpperCase()}
                 </div>
                 <div className="flex-1 truncate">
                   <p className="text-xs font-bold text-gray-200 truncate">{userEmail}</p>
                   <p className="text-[9px] text-gray-500">Free Tier</p>
                 </div>
               </div>
             )}
             <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition font-bold"
              >
                Logout Account
              </button>
          </div>
        </aside>

        <div className="flex-1 h-screen overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto p-10">

          {/* Header */}

          <div className="mb-10">
            <h1 className="text-3xl font-black text-white tracking-tight">
              {currentWorkspaceId ? workspaces.find(w => w.id === currentWorkspaceId)?.name : "Personal Space"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage your tasks and collaborate with your team.
            </p>
          </div>

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
                      className="p-3 rounded bg-gray-800 border border-gray-700 flex-1 rounded-r-none outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Gmail Address"
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      onFocus={() => {
                        if (emailOptions.length > 0) setShowEmailDropdown(true);
                      }}
                    />
                    <button
                      type="button"
                      className="px-3 bg-gray-800 border border-l-0 border-gray-700 rounded-r text-sm hover:bg-gray-700 transition"
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
                    <div className="absolute z-10 mt-1 w-full rounded bg-gray-900 border border-gray-700 max-h-40 overflow-y-auto shadow-2xl">
                      {emailOptions.map((email) => (
                        <button
                          key={email}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800 transition"
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
                  className="p-3 rounded bg-gray-800 border border-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Password"
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Remember me</span>
                  </label>
                  {authMode === "register" && (
                    <span className="text-[10px] text-amber-500 font-bold uppercase tracking-tight">Requires @gmail.com</span>
                  )}
                </div>

                {authError && (
                  <p className="text-red-400 text-xs font-medium bg-red-400/10 p-2 rounded border border-red-500/20">{authError}</p>
                )}

                <button
                  onClick={handleAuth}
                  className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition p-3 rounded-lg font-bold text-sm"
                >
                  {authMode === "login" ? "Login with Password" : "Create Gmail Account"}
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-800"></span></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-gray-950 px-2 text-gray-500 font-bold">Or Official Gmail Login</span></div>
                </div>

                <a
                  href="/api/auth/google"
                  className="bg-white hover:bg-gray-100 text-black flex items-center justify-center gap-3 p-3 rounded-lg font-bold text-sm transition shadow-xl"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"/>
                  </svg>
                  Sign in with Google
                </a>
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
                      onChange={(e) => setFilterTagId(e.target.value)}
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
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Notifications</label>
                    <button 
                      onClick={handleSyncNotifications}
                      disabled={isSyncingNotifications}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-lg ${
                        isSyncingNotifications 
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white'
                      }`}
                    >
                      {isSyncingNotifications ? '⏳' : '🔔 Sync'}
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">AI Daily Plan</label>
                    <button 
                      onClick={handleGenerateAiSchedule}
                      disabled={isGeneratingSchedule}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-lg ${isGeneratingSchedule ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'}`}
                    >
                      {isGeneratingSchedule ? '✨' : '📅 Plan'}
                    </button>
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

              {/* AI Schedule Display */}
              {aiSchedule.length > 0 && (
                <div className="bg-gray-900/90 backdrop-blur-xl p-6 rounded-2xl border-2 border-purple-500/30 shadow-[0_0_30px_-10px_rgba(168,85,247,0.4)] animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
                      <span className="text-2xl">✨</span> Your AI Daily Plan
                    </h2>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={handleEmailPlan}
                        disabled={isSendingEmail}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          isSendingEmail 
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                            : 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {isSendingEmail ? '📨 Sending...' : '📧 Email Me'}
                      </button>
                      <button 
                        onClick={() => setAiSchedule([])}
                        className="text-gray-500 hover:text-white transition"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {aiSchedule.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-4 bg-gray-800/40 p-3 rounded-xl border border-gray-700/50 hover:border-purple-500/30 transition group"
                      >
                        <div className="w-2 h-2 rounded-full bg-purple-500 group-hover:scale-125 transition"></div>
                        <span className="text-gray-200 font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm text-gray-400 font-semibold">Add Checklist Items (Subtasks)</label>
                      <button 
                        type="button" 
                        onClick={handleAiBreakdown}
                        disabled={isBreakingDown || !title}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition flex items-center gap-1 ${isBreakingDown ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 border border-blue-500/30'}`}
                      >
                        {isBreakingDown ? '✨ Thinking...' : '✨ Breakdown with AI'}
                      </button>
                    </div>
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
                        onChange={(e) => setSelectedAssigneeId(e.target.value)}
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
                              {tasks.filter(t => t.status === colId).length === 0 && (
                                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-800/50 rounded-xl py-12 px-6">
                                  <p className="text-[11px] text-gray-600 font-medium text-center uppercase tracking-widest">No tasks in {colId.replace("_", " ")}</p>
                                </div>
                              )}
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
        </div>
      </main>
      {userEmail && (
        <div className="px-10 pb-10">
          <AnalyticsDashboard tasks={tasks} />
        </div>
      )}
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
              onChange={() => toggleParentWithSubtasks(task)}
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
                <input
                  type="checkbox"
                  checked={sub.completed}
                  onChange={() => toggleTask(sub)}
                  className="w-3 h-3 opacity-50"
                />
                <span
                  className={`text-[11px] flex-1 ${
                    sub.completed ? "line-through text-gray-600" : "text-gray-400"
                  }`}
                >
                  {sub.title}
                </span>
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
                      <div 
                        className="flex-1 cursor-pointer group/ws" 
                        onClick={() => { setCurrentWorkspaceId(ws.id); setIsWorkspaceModalOpen(false); }}
                      >
                        <span className={`font-semibold transition ${currentWorkspaceId === ws.id ? 'text-blue-400' : 'text-gray-200 group-hover/ws:text-white'}`}>
                          {ws.name}
                        </span>
                        {currentWorkspaceId === ws.id && <span className="ml-2 text-[10px] text-blue-500 font-bold uppercase tracking-widest">(Active)</span>}
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] bg-gray-700 px-2 py-0.5 rounded text-gray-400 capitalize">{ws.owner?.email === userEmail ? 'Owner' : 'Member'}</span>
                        <button 
                          onClick={() => { setCurrentWorkspaceId(ws.id); setIsWorkspaceModalOpen(false); }}
                          className={`text-[10px] px-2 py-1 rounded transition font-bold uppercase tracking-wider ${currentWorkspaceId === ws.id ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'}`}
                        >
                          {currentWorkspaceId === ws.id ? 'Selected' : 'Select'}
                        </button>
                        {ws.owner?.email === userEmail && (ws._count?.tasks || 0) === 0 && (
                          <button 
                            onClick={() => deleteWorkspace(ws.id)}
                            className="text-[10px] px-2 py-1 bg-red-600/20 text-red-400 hover:bg-red-600/40 border border-red-500/30 rounded font-bold uppercase tracking-wider h-7 transition-all"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1 flex items-center justify-between">
                      <span>Invite Code: <code className="text-purple-400 select-all">{ws.inviteCode}</code></span>
                      <span>{ws._count?.tasks || 0} Tasks • {ws.members.length} Members</span>
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