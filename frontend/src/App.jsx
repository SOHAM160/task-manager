import { useEffect, useState, useCallback } from "react";
import ParticleBackground from "./components/ParticleBackground";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import DependencyGraph from "./components/DependencyGraph";
import api from "./utils/api";

export default function App() {
  const [userEmail, setUserEmail] = useState(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailOptions, setEmailOptions] = useState([]);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(3);
  const [deadline, setDeadline] = useState("");
  const [estimatedTime, setEstimatedTime] = useState(1);

  const [pendingSubtasks, setPendingSubtasks] = useState([]);
  const [newSubtaskFormTitle, setNewSubtaskFormTitle] = useState("");

  const [addingSubtaskTo, setAddingSubtaskTo] = useState(null);
  const [subtaskTitle, setSubtaskTitle] = useState("");

  const [algorithm, setAlgorithm] = useState("fcfs");

  const [tags, setTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6B7280");
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  // Assignment State
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("");

  // Filtering & Pagination State
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterTagId, setFilterTagId] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState("kanban");
  const [isLoading, setIsLoading] = useState(false);

  // Workspace State
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState(null);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [workspaceMembers, setWorkspaceMembers] = useState([]);

  // Comments State
  const [activeTaskIdForComments, setActiveTaskIdForComments] = useState(null);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [aiSchedule, setAiSchedule] = useState([]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSyncingNotifications, setIsSyncingNotifications] = useState(false);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get("/api/auth/me");
      setUserEmail(res.data.user.email);
      if (res.data.sessionId && !sessionStorage.getItem("sessionId")) {
        sessionStorage.setItem("sessionId", res.data.sessionId);
        setSessionId(res.data.sessionId);
      }
    } catch {
      setUserEmail(null);
      setTasks([]);
    }
  };

  const fetchTasks = async (resetPage = false) => {
    if (isLoading) return;
    setIsLoading(true);

    const currentPage = resetPage ? 1 : page;
    const params = {
      page: currentPage,
      limit: 20
    };

    if (filterStatus) params.status = filterStatus;
    if (filterPriority) params.priority = filterPriority;
    if (filterTagId) params.tagId = filterTagId;
    if (currentWorkspaceId) params.workspaceId = currentWorkspaceId;

    try {
      const res = await api.get("/api/tasks", { params });
      const data = res.data;
      if (resetPage) {
        setTasks(data);
        setPage(2);
      } else {
        setTasks(prev => [...prev, ...data]);
        setPage(prev => prev + 1);
      }
      setHasMore(data.length === 20);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await api.get("/api/tags");
      setTags(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    // Load email history if exists
    try {
      const saved = localStorage.getItem("emailHistory");
      if (saved) setEmailOptions(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    if (userEmail) {
      fetchTasks(true);
      fetchTags();
      fetchWorkspaces();
    }
  }, [userEmail, filterStatus, filterPriority, filterTagId, currentWorkspaceId]);

  const fetchWorkspaces = async () => {
    try {
      const res = await api.get("/api/workspaces");
      setWorkspaces(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const createWorkspace = async () => {
    if (!newWorkspaceName) return;
    try {
      await api.post("/api/workspaces", { name: newWorkspaceName });
      setNewWorkspaceName("");
      fetchWorkspaces();
    } catch (err) {
      console.error(err);
    }
  };

  const joinWorkspace = async () => {
    if (!inviteCode) return;
    try {
      await api.post("/api/workspaces/join", { inviteCode });
      setInviteCode("");
      fetchWorkspaces();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to join project");
    }
  };

  const fetchComments = async (taskId) => {
    setIsLoadingComments(true);
    try {
      const res = await api.get(`/api/tasks/${taskId}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const addComment = async () => {
    if (!newCommentText || !activeTaskIdForComments) return;
    try {
      await api.post(`/api/tasks/${activeTaskIdForComments}/comments`, { text: newCommentText });
      setNewCommentText("");
      fetchComments(activeTaskIdForComments);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuth = async () => {
    if (!authEmail || !authPassword) return;
    setAuthError(null);

    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";

    try {
      const res = await api.post(endpoint, {
        email: authEmail,
        password: authPassword,
        rememberMe,
      });

      if (res.data.sessionId) {
        sessionStorage.setItem("sessionId", res.data.sessionId);
        setSessionId(res.data.sessionId);
      }

      try {
        localStorage.setItem("lastEmail", authEmail);
        setEmailOptions(prev => {
          const without = prev.filter(e => e !== authEmail);
          const next = [authEmail, ...without].slice(0, 5);
          localStorage.setItem("emailHistory", JSON.stringify(next));
          return next;
        });
      } catch {}

      setAuthPassword("");
      await fetchCurrentUser();
    } catch (err) {
      setAuthError(err.response?.data?.error || "Authentication failed");
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (err) {
      console.error(err);
    }
    sessionStorage.removeItem("sessionId");
    setSessionId(null);
    setUserEmail(null);
    setTasks([]);
  };

  const addTask = async (parentTaskId = null, inlineTitle = "") => {
    const taskTitle = parentTaskId ? inlineTitle : title;
    if (!taskTitle || !userEmail) return;

    try {
      await api.post("/api/tasks", {
        title: taskTitle,
        description: parentTaskId ? null : description,
        priority: parentTaskId ? 3 : priority,
        deadline: parentTaskId ? null : deadline,
        tagIds: parentTaskId ? [] : selectedTagIds,
        parentTaskId: parentTaskId,
        workspaceId: currentWorkspaceId,
        assigneeId: parentTaskId ? null : (selectedAssigneeId || null),
        subtaskTitles: parentTaskId ? [] : pendingSubtasks,
        estimatedTime: parentTaskId ? 1 : Number(estimatedTime)
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
        setEstimatedTime(1);
      }

      fetchTasks(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAiBreakdown = async () => {
    if (!title || isBreakingDown) return;
    setIsBreakingDown(true);

    try {
      const res = await api.post("/api/ai/breakdown", { title });
      if (res.data.subtasks) {
        setPendingSubtasks(prev => [...prev, ...res.data.subtasks]);
        if (res.data.hint) {
          alert(res.data.hint);
        }
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to break down task");
    } finally {
      setIsBreakingDown(false);
    }
  };

  const handleGenerateAiSchedule = async () => {
    if (isGeneratingSchedule) return;
    setIsGeneratingSchedule(true);
    setAiSchedule([]);

    try {
      const params = {};
      if (currentWorkspaceId) params.workspaceId = currentWorkspaceId;
      const res = await api.get("/api/ai/schedule", { params });
      if (res.data.schedule) {
        setAiSchedule(res.data.schedule);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to generate AI schedule");
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  const handleEmailPlan = async () => {
    if (aiSchedule.length === 0 || isSendingEmail) return;
    setIsSendingEmail(true);
    try {
      const res = await api.post("/api/notifications/daily-plan", { schedule: aiSchedule });
      alert(`✅ ${res.data.message}`);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to send email");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSyncNotifications = async () => {
    if (isSyncingNotifications) return;
    setIsSyncingNotifications(true);
    try {
      const res = await api.post("/api/notifications/sync");
      alert(`🔔 ${res.data.message}`);
    } catch (err) {
      alert("Failed to sync notifications");
    } finally {
      setIsSyncingNotifications(false);
    }
  };

  const toggleTask = async (task) => {
    try {
      await api.put(`/api/tasks/${task.id}`, { completed: !task.completed });
      fetchTasks(true);
    } catch (err) {
      if (err.response?.data?.error) {
        alert(`🔒 ${err.response.data.error}`);
      } else {
        console.error(err);
      }
      fetchTasks(true);
    }
  };

  const toggleParentWithSubtasks = async (task) => {
    const newCompleted = !task.completed;
    try {
      await api.put(`/api/tasks/${task.id}`, { completed: newCompleted });
      if (task.subtasks && task.subtasks.length > 0) {
        await Promise.all(
          task.subtasks.map(sub =>
            api.put(`/api/tasks/${sub.id}`, { completed: newCompleted })
          )
        );
      }
      fetchTasks(true);
    } catch (err) {
      if (err.response?.data?.error) {
        alert(`🔒 ${err.response.data.error}`);
      } else {
        console.error(err);
      }
      fetchTasks(true);
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const taskId = draggableId;
    const newStatus = destination.droppableId;

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      await api.put(`/api/tasks/${taskId}`, { status: newStatus });
      fetchTasks(true);
    } catch (err) {
      // Revert optimistic update on dependency block error
      if (err.response?.data?.blockedBy) {
        alert(`[Validation Error] ${err.response.data.error}`);
      } else {
        console.error(err);
      }
      fetchTasks(true);
    }
  };

  const deleteTask = async (id) => {
    try {
      await api.delete(`/api/tasks/${id}`);
      fetchTasks(true);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteWorkspace = async (id) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await api.delete(`/api/workspaces/${id}`);
      if (currentWorkspaceId === id) setCurrentWorkspaceId(null);
      fetchWorkspaces();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete project");
    }
  };

  const createTag = async () => {
    if (!newTagName) return;
    try {
      const res = await api.post("/api/tags", { name: newTagName, color: newTagColor });
      setNewTagName("");
      setIsCreatingTag(false);
      setTags(prev => [...prev, res.data]);
      setSelectedTagIds(prev => [...prev, res.data.id]);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create tag");
    }
  };

  const runScheduler = async () => {
    try {
      const params = { algo: algorithm };
      if (currentWorkspaceId) params.workspaceId = currentWorkspaceId;
      const res = await api.get("/api/schedule", { params });
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const priorityColor = (p) => {
    if (p === 1) return "bg-red-50 text-red-700 border border-red-200";
    if (p === 2) return "bg-amber-50 text-amber-700 border border-amber-250";
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  };

  const priorityText = (p) => {
    if (p === 1) return "High";
    if (p === 2) return "Medium";
    return "Low";
  };

  function renderCommentsModal() {
    if (!activeTaskIdForComments) return null;
    const activeTask = tasks.find(t => t.id === activeTaskIdForComments);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-sm p-4">
        <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6 shadow-xl flex flex-col max-h-[80vh]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Task Discussion</h2>
              <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                {activeTask?.title}
                <span className="mx-1">•</span>
                <span className="text-blue-700 font-semibold">Logged in as: {userEmail}</span>
              </p>
            </div>
            <button onClick={() => { setActiveTaskIdForComments(null); setComments([]); }} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
            {isLoadingComments ? (
              <div className="text-center py-8 text-slate-400">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-slate-400 italic">No comments yet. Start the conversation!</div>
            ) : (
              comments.map(c => {
                const isMe = c.user.email.toLowerCase() === userEmail?.toLowerCase();
                return (
                  <div key={c.id} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex justify-between items-center w-full px-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isMe ? 'text-blue-600' : 'text-indigo-600'}`}>
                        {isMe ? 'You' : `From: ${c.user.email}`}
                      </span>
                      <span className="text-[9px] text-slate-400">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <div className={`p-3 rounded-xl text-sm shadow-sm max-w-[90%] ${
                      isMe
                      ? 'bg-blue-50 border border-blue-200 text-blue-800 rounded-tr-none'
                      : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-none'
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
              className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1 outline-none text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button onClick={addComment} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-bold">Post</button>
          </div>
        </div>
      </div>
    );
  }

  function renderWorkspaceModal() {
    if (!isWorkspaceModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-sm p-4">
        <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Project Workspaces</h2>
            <button onClick={() => setIsWorkspaceModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Create New Project</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Project name..."
                  className="bg-white border border-slate-350 rounded-lg px-3 py-2 text-sm flex-1 outline-none text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button onClick={createWorkspace} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-bold">Create</button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Join with Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Invite code..."
                  className="bg-white border border-slate-350 rounded-lg px-3 py-2 text-sm flex-1 outline-none text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button onClick={joinWorkspace} className="bg-indigo-650 hover:bg-indigo-750 text-white px-4 py-2 rounded-lg text-sm font-bold">Join</button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Your Projects</label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {workspaces.map(ws => (
                  <div key={ws.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-800">{ws.name}</span>
                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-650 capitalize">{ws.ownerId === userEmail || ws.owner?.id === userEmail ? 'Owner' : 'Member'}</span>
                        {ws._count?.tasks === 0 && (
                          <button
                            onClick={() => deleteWorkspace(ws.id)}
                            className="text-[10px] text-red-655 hover:text-red-750 font-bold uppercase tracking-wider"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>Invite Code: <code className="text-indigo-650 select-all font-mono">{ws.inviteCode}</code></span>
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

  function renderTaskCard(task, index) {
    return (
      <div
        key={task.id}
        className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3 group hover:shadow transition-all duration-200"
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
              <h3 className="text-md font-semibold text-slate-800" style={{ textDecoration: task.completed ? "line-through" : "none" }}>
                {index !== undefined && <span className="text-slate-400 mr-2 text-xs">#{index + 1}</span>}
                {task.title}
              </h3>
              {task.description && <p className="text-slate-500 text-xs mt-1 line-clamp-2">{task.description}</p>}
            </div>
          </div>
          <button onClick={() => deleteTask(task.id)} className="text-slate-400 hover:text-red-600 transition text-xs opacity-0 group-hover:opacity-100 shrink-0">Delete</button>
        </div>

        {/* Blocked indicator */}
        {task.blocked && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200">
            <span className="text-[11px] text-red-700 font-semibold">Blocked</span>
            <span className="text-[10px] text-red-650">
              — Waiting on: {task.dependsOn?.filter(d => !d.completed).map(d => d.title).join(", ")}
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${priorityColor(task.priority)}`}>
            {priorityText(task.priority)}
          </span>
          {task.deadline && (
            <span className="text-[10px] text-slate-500 bg-slate-100 border border-slate-205 px-2 py-0.5 rounded flex items-center gap-1">
              Due: {new Date(task.deadline).toLocaleDateString()}
            </span>
          )}
          {task.assignee && (
            <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {task.assignee.email?.split('@')[0]}
            </span>
          )}
          {task.dependsOn && task.dependsOn.length > 0 && (
            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {task.dependsOn.length} dep{task.dependsOn.length > 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={() => { setActiveTaskIdForComments(task.id); fetchComments(task.id); }}
            className="text-[10px] text-blue-600 hover:text-blue-750 font-medium transition flex items-center gap-1 ml-auto"
          >
            Discuss
          </button>
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag) => (
               <span key={tag.id} className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: tag.color + '20', color: tag.color, border: `1px solid ${tag.color}40` }}>
                 {tag.name}
               </span>
            ))}
          </div>
        )}

        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mt-1 border-t border-slate-150 pt-2 flex flex-col gap-1.5 px-1">
            {task.subtasks.map((sub) => (
              <div key={sub.id} className="flex items-center gap-2 group/sub">
                <input
                  type="checkbox"
                  checked={sub.completed}
                  onChange={() => toggleTask(sub)}
                  className="w-3 h-3 opacity-55"
                />
                <span
                  className={`text-[11px] flex-1 ${
                    sub.completed ? "line-through text-slate-400" : "text-slate-650"
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
            <input
              type="text"
              placeholder="Subtask..."
              className="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-[11px] flex-1 outline-none text-slate-800"
              value={subtaskTitle}
              onChange={(e) => setSubtaskTitle(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') addTask(task.id, subtaskTitle);
                if (e.key === 'Escape') setAddingSubtaskTo(null);
              }}
            />
          </div>
        ) : (
          <button onClick={() => { setAddingSubtaskTo(task.id); setSubtaskTitle(""); }} className="text-[10px] text-slate-505 hover:text-slate-700 font-medium transition self-start ml-1">+ Add Checklist Item</button>
        )}
      </div>
    );
  }

  return (
    <>
      <ParticleBackground />

      <main className="min-h-screen text-slate-800 bg-slate-50 p-10 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <h1 className="text-3xl font-extrabold text-blue-900 mb-2">
            Task Scheduler Dashboard
          </h1>

          <div className="flex justify-between items-center mb-8">
            <p className="text-slate-500">
              Current Scheduling Algorithm:{" "}
              <span className="text-blue-700 font-semibold mr-6">
                {algorithm.toUpperCase()}
              </span>
            </p>
          </div>

          {userEmail ? (
            <div className="flex justify-between items-center mb-8">
              <p className="text-slate-600">
                Logged in as{" "}
                <span className="text-blue-800 font-semibold">
                  {userEmail}
                </span>
              </p>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-300 bg-white px-3 py-1.5 rounded font-medium shadow-sm transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <p className="text-slate-500 mb-8">
              Please log in or register to manage your tasks.
            </p>
          )}

          {/* Auth Form */}
          {!userEmail && (
            <div className="bg-white p-6 rounded-xl mb-8 shadow-sm border border-slate-200">
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setAuthMode("login")}
                  className={`px-3 py-1.5 rounded text-sm font-semibold transition ${
                    authMode === "login"
                      ? "bg-blue-700 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setAuthMode("register")}
                  className={`px-3 py-1.5 rounded text-sm font-semibold transition ${
                    authMode === "register"
                      ? "bg-blue-700 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Register
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div className="relative">
                  <div className="flex">
                    <input
                      className="p-3 rounded bg-white border border-slate-300 flex-1 rounded-r-none text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                      className="px-3 bg-slate-100 border border-l-0 border-slate-300 rounded-r text-sm text-slate-600 hover:bg-slate-200"
                      onClick={() =>
                        setShowEmailDropdown((open) =>
                          emailOptions.length > 0 ? !open : false
                        )
                      }
                    >
                      ▼
                    </button>
                  </div>
                  {showEmailDropdown && emailOptions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded bg-white border border-slate-200 shadow-md max-h-40 overflow-y-auto">
                      {emailOptions.map((email) => (
                        <button
                          key={email}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-slate-700"
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
                  className="p-3 rounded bg-white border border-slate-300 text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Password"
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />

                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me on this device</span>
                </label>

                {authError && (
                  <p className="text-red-600 text-sm">{authError}</p>
                )}

                <button
                  onClick={handleAuth}
                  className="bg-blue-700 hover:bg-blue-800 transition p-3 rounded font-semibold text-white"
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
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-center justify-between shadow-sm">
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="bg-white border border-slate-350 px-3 py-1.5 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">All Statuses</option>
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1">Priority</label>
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="bg-white border border-slate-350 px-3 py-1.5 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">All Priorities</option>
                      <option value="1">High</option>
                      <option value="2">Medium</option>
                      <option value="3">Low</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1">Tag</label>
                    <select
                      value={filterTagId}
                      onChange={(e) => setFilterTagId(e.target.value)}
                      className="bg-white border border-slate-350 px-3 py-1.5 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">All Tags</option>
                      {tags.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1">Algorithm</label>
                    <div className="flex gap-2">
                      <select
                        value={algorithm}
                        onChange={(e) => setAlgorithm(e.target.value)}
                        className="bg-white border border-slate-350 px-3 py-1.5 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="fcfs">FCFS</option>
                        <option value="priority">Priority</option>
                        <option value="edf">EDF</option>
                        <option value="roundrobin">RR</option>
                      </select>
                      <button
                        onClick={runScheduler}
                        className="bg-blue-50 hover:bg-blue-105 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                      >
                        Run
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1">Notifications</label>
                    <button
                      onClick={handleSyncNotifications}
                      disabled={isSyncingNotifications}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                        isSyncingNotifications
                          ? 'bg-slate-205 text-slate-400 cursor-not-allowed border border-slate-200'
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                      }`}
                    >
                      {isSyncingNotifications ? 'Syncing...' : 'Sync Alerts'}
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1">Automated Schedule</label>
                    <button
                      onClick={handleGenerateAiSchedule}
                      disabled={isGeneratingSchedule}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${isGeneratingSchedule ? 'bg-slate-205 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-blue-700 hover:bg-blue-800 text-white'}`}
                    >
                      {isGeneratingSchedule ? 'Planning...' : 'Generate Daily Plan'}
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1">Workspace</label>
                    <div className="flex gap-2">
                    <select
                      value={currentWorkspaceId || ""}
                      onChange={(e) => setCurrentWorkspaceId(e.target.value ? e.target.value : null)}
                      className="bg-white border border-slate-355 px-3 py-1.5 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Personal</option>
                      {workspaces.map(ws => (
                        <option key={ws.id} value={ws.id}>{ws.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setIsWorkspaceModalOpen(true)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                    >
                      Projects
                    </button>
                    </div>
                  </div>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'list' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setViewMode("kanban")}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'kanban' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Board
                  </button>
                  <button
                    onClick={() => setViewMode("graph")}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'graph' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Graph
                  </button>
                </div>
              </div>

              {/* Automated Schedule Display */}
              {aiSchedule.length > 0 && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 leading-relaxed">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-[17px] font-bold text-slate-900 flex items-center gap-2">
                      Your Daily Plan
                    </h2>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={handleEmailPlan}
                        disabled={isSendingEmail}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          isSendingEmail
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {isSendingEmail ? 'Sending...' : 'Email Plan'}
                      </button>
                      <button
                        onClick={() => setAiSchedule([])}
                        className="text-slate-400 hover:text-slate-600 transition"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {aiSchedule.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 hover:border-slate-350 transition group"
                      >
                        <div className="w-2 h-2 rounded-full bg-blue-600 group-hover:scale-125 transition"></div>
                        <span className="text-slate-700 font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Task Form */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                  Create Task
                </h2>

                <div className="flex flex-col gap-3">
                  <input
                    className="p-3 rounded bg-white border border-slate-300 text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Task Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <textarea
                    className="p-3 rounded bg-white border border-slate-300 text-slate-850 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Task Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <div className="flex gap-4">
                    <select
                      className="p-3 rounded bg-white border border-slate-300 text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 flex-1"
                      value={priority}
                      onChange={(e) => setPriority(Number(e.target.value))}
                    >
                      <option value={1}>High Priority</option>
                      <option value={2}>Medium Priority</option>
                      <option value={3}>Low Priority</option>
                    </select>
                    <input
                      type="date"
                      className="p-3 rounded bg-white border border-slate-300 text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 flex-1"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                    <input
                      type="number"
                      min="1"
                      className="p-3 rounded bg-white border border-slate-300 text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 flex-1"
                      placeholder="Est. Hours"
                      value={estimatedTime}
                      onChange={(e) => setEstimatedTime(Math.max(1, Number(e.target.value)))}
                    />
                  </div>

                  <div className="flex flex-col gap-2 mt-2">
                    <label className="text-sm text-slate-600 font-semibold">Select Tags</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map(tag => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => setSelectedTagIds(prev => prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id])}
                          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${selectedTagIds.includes(tag.id) ? 'ring-2 ring-blue-550 scale-105 shadow-sm' : 'opacity-70 hover:opacity-100'}`}
                          style={{ backgroundColor: tag.color + '40', color: tag.color, border: `1px solid ${tag.color}` }}
                        >
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: tag.color }}></span>
                          {tag.name}
                        </button>
                      ))}
                      <button type="button" onClick={() => setIsCreatingTag(!isCreatingTag)} className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 transition">+ New Tag</button>
                    </div>

                    {isCreatingTag && (
                      <div className="flex gap-2 items-center bg-slate-50 p-3 rounded border border-slate-250">
                        <input type="text" placeholder="Tag Name" className="p-2 rounded bg-white border border-slate-300 text-sm flex-1 text-slate-800 outline-none" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} />
                        <input type="color" className="h-9 w-12 rounded cursor-pointer bg-transparent border-0" value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)} />
                        <button type="button" onClick={createTag} className="bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded text-sm font-semibold transition text-white">Save Tag</button>
                      </div>
                    )}
                  </div>

                   <div className="flex flex-col gap-2 mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm text-slate-600 font-semibold font-sans">Add Checklist Items (Subtasks)</label>
                      <button
                        type="button"
                        onClick={handleAiBreakdown}
                        disabled={isBreakingDown || !title}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition flex items-center gap-1 ${isBreakingDown ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300' : 'bg-blue-50 text-blue-700 hover:bg-blue-105 border border-blue-200'}`}
                      >
                        {isBreakingDown ? 'Generating...' : 'Suggest Subtasks'}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Email client..."
                        className="p-2.5 rounded bg-white border border-slate-300 text-sm flex-1 text-slate-800 outline-none"
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
                      <button type="button" onClick={() => { if (newSubtaskFormTitle.trim()) { setPendingSubtasks([...pendingSubtasks, newSubtaskFormTitle.trim()]); setNewSubtaskFormTitle(""); } }} className="bg-slate-100 hover:bg-slate-200 border border-slate-300 px-4 py-2 rounded text-sm font-bold transition text-slate-700">+</button>
                    </div>
                    {pendingSubtasks.map((st, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white px-3 py-1.5 rounded border border-slate-200">
                        <span className="text-sm text-slate-700">{st}</span>
                        <button type="button" onClick={() => setPendingSubtasks(pendingSubtasks.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-600 text-xs">Remove</button>
                      </div>
                    ))}
                  </div>

                  {currentWorkspaceId && (
                    <div className="flex flex-col gap-2 mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <label className="text-sm text-slate-650 font-semibold">Assign Task To</label>
                      <select
                        value={selectedAssigneeId}
                        onChange={(e) => setSelectedAssigneeId(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">No Assignee</option>
                        {workspaces.find(w => w.id === currentWorkspaceId)?.members?.map((m) => (
                          <option key={m.userId} value={m.userId}>{m.user.email}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button onClick={() => addTask(null)} className="bg-blue-700 hover:bg-blue-800 transition p-4 rounded-xl font-bold mt-2 text-white">Add Task</button>
                </div>
              </div>

              {/* View Content */}
              {viewMode === "list" ? (
                <div className="flex flex-col gap-4">
                  {tasks.map((task, index) => renderTaskCard(task, index))}
                  {hasMore && (
                    <button
                      onClick={() => fetchTasks()}
                      className="bg-slate-100 hover:bg-slate-200 border border-slate-200 p-3 rounded-xl text-slate-600 transition font-semibold"
                    >
                      {isLoading ? "Loading..." : "Load More Tasks"}
                    </button>
                  )}
                </div>
              ) : viewMode === "graph" ? (
                <DependencyGraph
                  tasks={tasks}
                  workspaceId={currentWorkspaceId}
                  onRefreshTasks={() => fetchTasks(true)}
                />
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {["TODO", "IN_PROGRESS", "DONE"].map(colId => (
                      <div key={colId} className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                          <h3 className="text-sm font-bold uppercase tracking-tighter text-slate-500 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${colId === 'TODO' ? 'bg-slate-400' : colId === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
                            {colId.replace("_", " ")}
                          </h3>
                          <span className="bg-slate-100 text-[10px] px-2 py-0.5 rounded-full font-bold text-slate-500 border border-slate-200">
                            {tasks.filter(t => t.status === colId).length}
                          </span>
                        </div>

                        <Droppable droppableId={colId}>
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="bg-slate-100/50 p-3 rounded-2xl min-h-[500px] border border-slate-200 flex flex-col gap-4"
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
      {userEmail && (
        <div className="px-10 pb-10 relative z-10">
          <AnalyticsDashboard tasks={tasks} />
        </div>
      )}
      {renderWorkspaceModal()}
      {renderCommentsModal()}
    </>
  );
}
