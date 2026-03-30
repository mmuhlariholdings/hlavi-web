"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Task, TaskStatus } from "@/lib/types";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { AcceptanceCriteriaList } from "./AcceptanceCriteriaList";
import { formatDate } from "@/lib/utils";
import { Calendar, Clock, Edit2, X, Save, Plus, Link2, GitBranch, Zap, Bot, MessageSquare, User, Send, Cpu } from "lucide-react";
import { useUpdateTask } from "@/hooks/useUpdateTask";
import { useAddAcceptanceCriteria } from "@/hooks/useAcceptanceCriteria";
import { useAddComment } from "@/hooks/useAddComment";
import { useRepository } from "@/contexts/RepositoryContext";
import { useTasks } from "@/hooks/useTasks";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface TaskDetailProps {
  task: Task;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "open", label: "Open" },
  { value: "inprogress", label: "In Progress" },
  { value: "pending", label: "Pending" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
  { value: "closed", label: "Closed" },
];

const MODEL_OPTIONS = [
  { value: "", label: "Board default" },
  { value: "claude-opus-4-6", label: "Claude Opus 4.6" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o mini" },
  { value: "o3", label: "o3" },
  { value: "o4-mini", label: "o4-mini" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
];

export function TaskDetail({ task }: TaskDetailProps) {
  const { owner, repo, branch } = useRepository();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const updateTask = useUpdateTask();
  const addCriteria = useAddAcceptanceCriteria();
  const addComment = useAddComment();
  const { data: tasksData } = useTasks(owner || "", repo || "", branch);

  const [isEditing, setIsEditing] = useState(false);
  const [newCriteriaDescription, setNewCriteriaDescription] = useState("");
  const [newCommentBody, setNewCommentBody] = useState("");
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description || "");
  const [editedStatus, setEditedStatus] = useState(task.status);
  const [editedStartDate, setEditedStartDate] = useState(
    task.start_date ? format(new Date(task.start_date), "yyyy-MM-dd") : ""
  );
  const [editedEndDate, setEditedEndDate] = useState(
    task.end_date ? format(new Date(task.end_date), "yyyy-MM-dd") : ""
  );
  const [editedEffort, setEditedEffort] = useState(
    task.effort != null ? String(task.effort) : ""
  );
  const [editedAutonomous, setEditedAutonomous] = useState(task.autonomous ?? false);
  const [editedModel, setEditedModel] = useState(task.model ?? "");

  useEffect(() => {
    const el = descriptionRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [editedDescription, isEditing]);

  const allOtherTasks = (tasksData?.tasks || [])
    .filter((t) => t.id !== task.id)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  const getTaskLabel = (id: string) => {
    const t = (tasksData?.tasks || []).find((t) => t.id === id);
    return t ? `${id}: ${t.title}` : id;
  };

  // Fetch the latest task state and return it. Also updates the query cache so
  // the board reflects the real status without a full reload.
  const fetchFreshTask = async (): Promise<Task | null> => {
    if (!owner || !repo) return null;
    try {
      const params = new URLSearchParams({ owner, repo, taskId: task.id, ...(branch && { branch }) });
      const res = await fetch(`/api/github/tasks?${params}`);
      if (!res.ok) return null;
      const data: { task: Task } = await res.json();
      queryClient.setQueryData(["task", owner, repo, task.id, branch], data);
      queryClient.setQueryData(["tasks", owner, repo, branch], (old: { tasks: Task[] } | undefined) => {
        if (!old?.tasks) return old;
        return { tasks: old.tasks.map((t) => t.id === task.id ? data.task : t) };
      });
      return data.task;
    } catch {
      return null;
    }
  };

  const handleEditClick = async () => {
    const fresh = await fetchFreshTask();
    if (fresh?.agent_assigned && fresh?.autonomous) {
      toast.error("The agent is currently working on this task. Leave a comment to guide it instead.");
      return;
    }
    setIsEditing(true);
  };

  const saveParent = (parentId: string | null) => {
    if (!owner || !repo) return;
    updateTask.mutate({ owner, repo, branch, taskId: task.id, updates: { parent: parentId } });
  };

  const addBlock = (blockedId: string) => {
    if (!owner || !repo) return;
    updateTask.mutate({
      owner, repo, branch, taskId: task.id,
      updates: { blocks: [...(task.blocks || []), blockedId] },
    });
  };

  const removeBlock = (blockedId: string) => {
    if (!owner || !repo) return;
    updateTask.mutate({
      owner, repo, branch, taskId: task.id,
      updates: { blocks: (task.blocks || []).filter((id) => id !== blockedId) },
    });
  };

  const handleSave = async () => {
    if (!owner || !repo) return;

    // Re-check agent status in case it picked up the task while user was editing
    const fresh = await fetchFreshTask();
    if (fresh?.agent_assigned && fresh?.autonomous) {
      toast.error("The agent picked up this task while you were editing. Changes not saved.");
      setIsEditing(false);
      return;
    }

    const effortNum = editedEffort.trim() !== "" ? parseInt(editedEffort, 10) : null;
    try {
      await updateTask.mutateAsync({
        owner,
        repo,
        branch,
        taskId: task.id,
        updates: {
          title: editedTitle,
          description: editedDescription || null,
          status: editedStatus,
          start_date: editedStartDate ? new Date(editedStartDate).toISOString() : null,
          end_date: editedEndDate ? new Date(editedEndDate).toISOString() : null,
          effort: effortNum ?? undefined,
          autonomous: editedAutonomous,
          model: editedModel || null,
        },
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleCancel = () => {
    setEditedTitle(task.title);
    setEditedDescription(task.description || "");
    setEditedStatus(task.status);
    setEditedStartDate(task.start_date ? format(new Date(task.start_date), "yyyy-MM-dd") : "");
    setEditedEndDate(task.end_date ? format(new Date(task.end_date), "yyyy-MM-dd") : "");
    setEditedEffort(task.effort != null ? String(task.effort) : "");
    setEditedAutonomous(task.autonomous ?? false);
    setEditedModel(task.model ?? "");
    setIsEditing(false);
  };

  const handleAddCriteria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!owner || !repo || !newCriteriaDescription.trim()) return;
    try {
      await addCriteria.mutateAsync({
        owner,
        repo,
        branch,
        taskId: task.id,
        description: newCriteriaDescription.trim(),
      });
      setNewCriteriaDescription("");
    } catch (error) {
      console.error("Failed to add acceptance criteria:", error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!owner || !repo || !newCommentBody.trim()) return;
    try {
      await addComment.mutateAsync({
        owner,
        repo,
        branch,
        taskId: task.id,
        body: newCommentBody.trim(),
      });
      setNewCommentBody("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const currentBlocks = task.blocks || [];
  const blockedByParent = task.parent ? [task.parent] : [];
  const comments = task.comments ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full text-xl font-semibold mb-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          ) : (
            <h1 className="text-2xl md:text-3xl font-bold mb-3 break-words">{task.title}</h1>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-base md:text-lg font-semibold text-blue-600">{task.id}</span>
            {isEditing ? (
              <select
                value={editedStatus}
                onChange={(e) => setEditedStatus(e.target.value as TaskStatus)}
                className="select-styled font-medium"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <TaskStatusBadge status={task.status} />
            )}
          </div>
        </div>

        {!isEditing && (
          <button
            onClick={handleEditClick}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit task"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Description */}
      <div>
        <h2 className="text-base md:text-lg font-semibold mb-2">Description</h2>
        {isEditing ? (
          <textarea
            ref={descriptionRef}
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base resize-none overflow-hidden"
            placeholder="Add a description... (Markdown supported)"
          />
        ) : task.description ? (
          <div className="prose-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {task.description}
            </ReactMarkdown>
          </div>
        ) : (
          <span className="text-sm text-gray-400 italic">No description</span>
        )}
      </div>

      {/* Metadata */}
      <div>
        <h2 className="text-base md:text-lg font-semibold mb-3">Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-6 h-6 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 mb-0.5">Start Date</p>
              {isEditing ? (
                <input
                  type="date"
                  value={editedStartDate}
                  onChange={(e) => setEditedStartDate(e.target.value)}
                  className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900 break-words">
                  {task.start_date ? formatDate(task.start_date) : <span className="text-gray-400">Not set</span>}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-6 h-6 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 mb-0.5">End Date</p>
              {isEditing ? (
                <input
                  type="date"
                  value={editedEndDate}
                  onChange={(e) => setEditedEndDate(e.target.value)}
                  className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900 break-words">
                  {task.end_date ? formatDate(task.end_date) : <span className="text-gray-400">Not set</span>}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Zap className="w-6 h-6 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 mb-0.5">Effort</p>
              {isEditing ? (
                <input
                  type="number"
                  min="1"
                  value={editedEffort}
                  onChange={(e) => setEditedEffort(e.target.value)}
                  placeholder="e.g. 3"
                  className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 w-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900">
                  {task.effort != null ? task.effort : <span className="text-gray-400">Not estimated</span>}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Bot className="w-6 h-6 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 mb-0.5">Autonomous Mode</p>
              {isEditing ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editedAutonomous}
                    onChange={(e) => setEditedAutonomous(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Allow an agent to pick up this task when it reaches Open
                  </span>
                </label>
              ) : (
                <p className="text-sm font-medium text-gray-900">
                  {task.autonomous ? (
                    <span className="inline-flex items-center gap-1.5 text-violet-700">
                      <Bot className="w-5 h-5" />
                      Enabled
                    </span>
                  ) : (
                    <span className="text-gray-400">Disabled</span>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
            <Cpu className="w-6 h-6 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 mb-0.5">Agent Model</p>
              {isEditing ? (
                <select
                  value={editedModel}
                  onChange={(e) => setEditedModel(e.target.value)}
                  className="select-styled text-sm"
                >
                  {MODEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-medium text-gray-900">
                  {task.model ? (
                    <span className="inline-flex items-center gap-1.5 text-violet-700">
                      <Cpu className="w-4 h-4" />
                      {task.model}
                    </span>
                  ) : (
                    <span className="text-gray-400">Board default</span>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Clock className="w-6 h-6 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 mb-0.5">Created</p>
              <p className="text-sm font-medium text-gray-900 break-words">{formatDate(task.created_at)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Clock className="w-6 h-6 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 mb-0.5">Updated</p>
              <p className="text-sm font-medium text-gray-900 break-words">{formatDate(task.updated_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Parent Task */}
      <div>
        <h2 className="text-base md:text-lg font-semibold mb-3 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-purple-500" />
          Parent Task
        </h2>
        <div className="space-y-2">
          {task.parent && (
            <div className="flex items-center gap-2 group w-fit">
              <a
                href={`/tasks/${task.parent}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-100 transition-colors"
              >
                <GitBranch className="w-3.5 h-3.5" />
                {getTaskLabel(task.parent)}
              </a>
              <button
                onClick={() => saveParent(null)}
                disabled={updateTask.isPending}
                className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                title="Remove parent"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {!task.parent && (
            <select
              value=""
              onChange={(e) => { if (e.target.value) saveParent(e.target.value); }}
              disabled={updateTask.isPending}
              className="select-styled w-full py-2 focus:ring-purple-400 focus:border-purple-400"
            >
              <option value="">Set parent task...</option>
              {allOtherTasks
                .filter((t) => !currentBlocks.includes(t.id))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id}: {t.title}
                  </option>
                ))}
            </select>
          )}
        </div>
      </div>

      {/* Blocks */}
      <div>
        <h2 className="text-base md:text-lg font-semibold mb-3 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-orange-500" />
          Blocks
          {currentBlocks.length > 0 && (
            <span className="text-sm font-normal text-gray-500">({currentBlocks.length})</span>
          )}
        </h2>
        <div className="space-y-2">
          {currentBlocks.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {currentBlocks.map((blockedId) => (
                <div key={blockedId} className="flex items-center gap-1 group">
                  <a
                    href={`/tasks/${blockedId}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    {getTaskLabel(blockedId)}
                  </a>
                  <button
                    onClick={() => removeBlock(blockedId)}
                    disabled={updateTask.isPending}
                    className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    title={`Remove ${blockedId}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <select
            value=""
            onChange={(e) => { if (e.target.value) addBlock(e.target.value); }}
            disabled={updateTask.isPending}
            className="select-styled w-full py-2 focus:ring-orange-400 focus:border-orange-400"
          >
            <option value="">Add blocked task...</option>
            {allOtherTasks
              .filter((t) => !currentBlocks.includes(t.id) && t.id !== task.parent && !blockedByParent.includes(t.id))
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id}: {t.title}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Acceptance Criteria */}
      <div>
        <h2 className="text-base md:text-lg font-semibold mb-3">
          Acceptance Criteria ({task.acceptance_criteria.filter((ac) => ac.completed).length}/{task.acceptance_criteria.length})
        </h2>
        <AcceptanceCriteriaList taskId={task.id} criteria={task.acceptance_criteria} />
        <form onSubmit={handleAddCriteria} className="mt-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newCriteriaDescription}
              onChange={(e) => setNewCriteriaDescription(e.target.value)}
              placeholder="Add new acceptance criteria..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={addCriteria.isPending}
            />
            <button
              type="submit"
              disabled={addCriteria.isPending || !newCriteriaDescription.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </form>
      </div>

      {/* Agent Assignment Notice */}
      {task.agent_assigned && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
          <p className="text-xs md:text-sm text-blue-800">
            <span className="font-medium">AI Agent Assigned:</span> This task is being handled by an automated agent.
          </p>
        </div>
      )}

      {/* Rejection Reason */}
      {task.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
          <h3 className="text-sm md:text-base font-medium text-red-900 mb-2">Rejection Reason</h3>
          <p className="text-xs md:text-sm text-red-800 break-words">{task.rejection_reason}</p>
        </div>
      )}

      {/* Comments */}
      <div>
        <h2 className="text-base md:text-lg font-semibold mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-gray-500" />
          Comments
          {comments.length > 0 && (
            <span className="text-sm font-normal text-gray-500">({comments.length})</span>
          )}
        </h2>

        {comments.length > 0 ? (
          <div className="space-y-4 mb-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {comment.author_type === "agent" ? (
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-violet-600" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 bg-gray-50 rounded-lg p-3">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-gray-900">@{comment.author}</span>
                    {comment.author_type === "agent" && comment.model && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-violet-50 border border-violet-200 rounded text-xs text-violet-700">
                        <Cpu className="w-3 h-3" />
                        {comment.model}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
                  </div>
                  <div className="prose-content text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.body}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic mb-4">No comments yet.</p>
        )}

        {session && (
          <form onSubmit={handleAddComment}>
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <textarea
                  value={newCommentBody}
                  onChange={(e) => setNewCommentBody(e.target.value)}
                  placeholder="Leave a comment... (Markdown supported)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                  disabled={addComment.isPending}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={addComment.isPending || !newCommentBody.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <Send className="w-4 h-4" />
                    {addComment.isPending ? "Posting..." : "Comment"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Form actions — only shown in edit mode */}
      {isEditing && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleCancel}
            disabled={updateTask.isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateTask.isPending || !editedTitle.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {updateTask.isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      )}
    </div>
  );
}
