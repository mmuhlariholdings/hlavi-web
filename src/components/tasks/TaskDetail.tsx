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
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-3 break-words">
          {task.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-base md:text-lg font-semibold text-blue-600">
            {task.id}
          </span>
          <TaskStatusBadge status={task.status} />
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <div>
          <h2 className="text-base md:text-lg font-semibold mb-2">Description</h2>
          <p className="text-sm md:text-base text-gray-700 whitespace-pre-wrap break-words">
            {task.description}
          </p>
        </div>
      )}

      {/* Metadata - Stacked on mobile, 2 columns on tablet+ */}
      <div>
        <h2 className="text-base md:text-lg font-semibold mb-3">Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {task.start_date && (
            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 mb-0.5">Start Date</p>
                <p className="text-sm font-medium text-gray-900 break-words">
                  {formatDate(task.start_date)}
                </p>
              </div>
            </div>
          )}
          {task.end_date && (
            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 mb-0.5">End Date</p>
                <p className="text-sm font-medium text-gray-900 break-words">
                  {formatDate(task.end_date)}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
            <Clock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 mb-0.5">Created</p>
              <p className="text-sm font-medium text-gray-900 break-words">
                {formatDate(task.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
            <Clock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 mb-0.5">Updated</p>
              <p className="text-sm font-medium text-gray-900 break-words">
                {formatDate(task.updated_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Acceptance Criteria */}
      {task.acceptance_criteria.length > 0 && (
        <div>
          <h2 className="text-base md:text-lg font-semibold mb-3">
            Acceptance Criteria ({task.acceptance_criteria.filter(ac => ac.completed).length}/{task.acceptance_criteria.length})
          </h2>
          <AcceptanceCriteriaList criteria={task.acceptance_criteria} />
        </div>
      )}

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
          <p className="text-xs md:text-sm text-red-800 break-words">
            {task.rejection_reason}
          </p>
        </div>
      )}
    </div>
  );
}
