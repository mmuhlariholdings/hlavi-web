import Link from "next/link";
import { Task } from "@/lib/types";
import { TaskStatusBadge } from "../tasks/TaskStatusBadge";
import { CheckCircle2, Link2, GripVertical } from "lucide-react";
import { formatDate } from "@/lib/utils";
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
        <TaskStatusBadge status={task.status} />
      </div>
      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
        {task.title}
      </h4>
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {task.description}
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
 * The grip handle on the left triggers drag; the card itself remains clickable.
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
      className={`flex items-stretch gap-1 rounded-lg ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      {/* Drag handle — only this area initiates drag, keeping the card link clickable */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center px-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <TaskCard task={task} />
      </div>
    </div>
  );
}
