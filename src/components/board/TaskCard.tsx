import Link from "next/link";
import { Task } from "@/lib/types";
import { TaskStatusBadge } from "../tasks/TaskStatusBadge";
import { CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

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
        <div className="flex items-center gap-1">
          <CheckCircle2 className="w-4 h-4" />
          <span>
            {completedAC}/{totalAC}
          </span>
        </div>
        {task.end_date && (
          <span className="text-xs">
            Due: {formatDate(task.end_date)}
          </span>
        )}
      </div>
    </Link>
  );
}
