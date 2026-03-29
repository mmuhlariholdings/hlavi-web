"use client";

import { useState } from "react";
import { Task, TaskStatus } from "@/lib/types";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { AcceptanceCriteriaList } from "./AcceptanceCriteriaList";
import { formatDate } from "@/lib/utils";
import { Calendar, Clock, Edit2, X, Save, Plus, Link2, GitBranch } from "lucide-react";
import { useUpdateTask } from "@/hooks/useUpdateTask";
import { useAddAcceptanceCriteria } from "@/hooks/useAcceptanceCriteria";
import { useRepository } from "@/contexts/RepositoryContext";
import { useTasks } from "@/hooks/useTasks";
import { format } from "date-fns";

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

export function TaskDetail({ task }: TaskDetailProps) {
  const { owner, repo, branch } = useRepository();
  const updateTask = useUpdateTask();
  const addCriteria = useAddAcceptanceCriteria();
  const { data: tasksData } = useTasks(owner || "", repo || "", branch);

  const [isEditing, setIsEditing] = useState(false);
  const [newCriteriaDescription, setNewCriteriaDescription] = useState("");

  // Edit-mode state (title, description, status, dates only)
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description || "");
  const [editedStatus, setEditedStatus] = useState(task.status);
  const [editedStartDate, setEditedStartDate] = useState(
    task.start_date ? format(new Date(task.start_date), "yyyy-MM-dd") : ""
  );
  const [editedEndDate, setEditedEndDate] = useState(
    task.end_date ? format(new Date(task.end_date), "yyyy-MM-dd") : ""
  );

  const allOtherTasks = (tasksData?.tasks || [])
    .filter((t) => t.id !== task.id)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  const getTaskLabel = (id: string) => {
    const t = (tasksData?.tasks || []).find((t) => t.id === id);
    return t ? `${id}: ${t.title}` : id;
  };

  // Inline mutations
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

  const currentBlocks = task.blocks || [];
  const blockedByParent = task.parent ? [task.parent] : [];

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
              className="w-full text-2xl md:text-3xl font-bold mb-3 border-b-2 border-blue-500 focus:outline-none bg-transparent"
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
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={updateTask.isPending}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={handleSave}
                disabled={updateTask.isPending}
                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                title="Save changes"
              >
                <Save className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Edit task"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <h2 className="text-base md:text-lg font-semibold mb-2">Description</h2>
        {isEditing ? (
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base resize-y"
            placeholder="Add a description..."
          />
        ) : (
          <p className="text-sm md:text-base text-gray-700 whitespace-pre-wrap break-words">
            {task.description || <span className="text-gray-400 italic">No description</span>}
          </p>
        )}
      </div>

      {/* Metadata */}
      <div>
        <h2 className="text-base md:text-lg font-semibold mb-3">Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
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

          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
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

          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
            <Clock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 mb-0.5">Created</p>
              <p className="text-sm font-medium text-gray-900 break-words">{formatDate(task.created_at)}</p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
            <Clock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 mb-0.5">Updated</p>
              <p className="text-sm font-medium text-gray-900 break-words">{formatDate(task.updated_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Parent Task — always-on inline */}
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
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm text-gray-500 bg-white"
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

      {/* Blocks — always-on inline */}
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
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm text-gray-500 bg-white"
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
    </div>
  );
}
