import Link from "next/link";
import { Task } from "@/lib/types";
import { TaskStatusBadge } from "../tasks/TaskStatusBadge";
import { CheckCircle2, Link2, Zap, Bot } from "lucide-react";
import { formatDate, stripMarkdown } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const completedAC = task.acceptance_criteria.filter(
    (ac) => ac.completed
  ).length;
  const totalAC = task.acceptance_criteria.length;

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="block bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-200"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-semibold text-blue-600">{task.id}</span>
        <div className="flex items-center gap-1.5">
          {task.autonomous && (
            <Bot className="w-3.5 h-3.5 text-violet-500" title="Autonomous mode enabled" />
          )}
          <TaskStatusBadge status={task.status} />
        </div>
      </div>
      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
        {task.title}
      </h4>
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {stripMarkdown(task.description)}
        </p>
      )}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {completedAC}/{totalAC}
            </span>
          </div>
          {task.blocks && task.blocks.length > 0 && (
            <div
              className="flex items-center gap-1 text-orange-500"
              title={`Blocks: ${task.blocks.join(", ")}`}
            >
              <Link2 className="w-4 h-4" />
              <span className="text-xs">{task.blocks.length}</span>
            </div>
          )}
          {task.effort != null && (
            <div className="flex items-center gap-1 text-violet-500" title="Effort">
              <Zap className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{task.effort}</span>
            </div>
          )}
        </div>
        {task.end_date && (
          <span className="text-xs">Due: {formatDate(task.end_date)}</span>
        )}
      </div>
    </Link>
  );
}

/**
 * Drag-and-drop wrapper around TaskCard.
 * Listeners cover the whole card; the distance/delay activation constraints
 * ensure taps still navigate and touch scroll still works.
 */
export function SortableTaskCard({ task }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`cursor-grab active:cursor-grabbing select-none ${
        isDragging ? "opacity-40" : ""
      }`}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} />
    </div>
  );
}
