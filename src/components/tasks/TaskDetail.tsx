import { Task } from "@/lib/types";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { AcceptanceCriteriaList } from "./AcceptanceCriteriaList";
import { formatDate } from "@/lib/utils";
import { Calendar, Clock } from "lucide-react";

interface TaskDetailProps {
  task: Task;
}

export function TaskDetail({ task }: TaskDetailProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{task.title}</h1>
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-blue-600">
              {task.id}
            </span>
            <TaskStatusBadge status={task.status} />
          </div>
        </div>
      </div>

      {task.description && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap">
            {task.description}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {task.start_date && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Start:</span>
            <span className="font-medium">
              {formatDate(task.start_date)}
            </span>
          </div>
        )}
        {task.end_date && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">End:</span>
            <span className="font-medium">
              {formatDate(task.end_date)}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-gray-600">Created:</span>
          <span className="font-medium">
            {formatDate(task.created_at)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-gray-600">Updated:</span>
          <span className="font-medium">
            {formatDate(task.updated_at)}
          </span>
        </div>
      </div>

      {task.acceptance_criteria.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Acceptance Criteria</h2>
          <AcceptanceCriteriaList criteria={task.acceptance_criteria} />
        </div>
      )}

      {task.agent_assigned && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            This task is assigned to an AI agent
          </p>
        </div>
      )}

      {task.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-medium text-red-900 mb-2">Rejection Reason</h3>
          <p className="text-sm text-red-800">{task.rejection_reason}</p>
        </div>
      )}
    </div>
  );
}
