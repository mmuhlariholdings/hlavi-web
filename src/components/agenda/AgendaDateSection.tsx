"use client";

import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { Calendar } from "lucide-react";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  acceptance_criteria: Array<{
    id: number;
    description: string;
    completed: boolean;
  }>;
}

interface AgendaDateSectionProps {
  date: Date;
  tasks: Task[];
}

export function AgendaDateSection({ date, tasks }: AgendaDateSectionProps) {
  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEEE, MMMM d, yyyy");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
      case "open":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "inprogress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "review":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "pending":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "done":
      case "closed":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "new":
      case "open":
        return "To Do";
      case "inprogress":
        return "In Progress";
      case "review":
        return "In Review";
      case "pending":
        return "Blocked";
      case "done":
        return "Done";
      case "closed":
        return "Closed";
      default:
        return status;
    }
  };

  return (
    <div className="mb-8">
      {/* Sticky Date Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 py-4 mb-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{getDateLabel(date)}</h2>
            <p className="text-sm text-gray-500">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      {/* Tasks for this date */}
      <div className="space-y-3 px-1">
        {tasks.map((task) => {
          const completedCriteria = task.acceptance_criteria.filter((ac) => ac.completed).length;
          const totalCriteria = task.acceptance_criteria.length;

          return (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              {/* Task Header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {task.id}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded border ${getStatusColor(
                      task.status
                    )}`}
                  >
                    {getStatusLabel(task.status)}
                  </span>
                </div>
              </div>

              {/* Task Title */}
              <h3 className="text-base font-medium text-gray-900 mb-1 line-clamp-2">
                {task.title}
              </h3>

              {/* Task Description */}
              {task.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
              )}

              {/* Task Footer */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  {/* Acceptance Criteria Progress */}
                  {totalCriteria > 0 && (
                    <span>
                      ✓ {completedCriteria}/{totalCriteria}
                    </span>
                  )}

                  {/* Date Range */}
                  {task.start_date && task.end_date && (
                    <span className="text-xs">
                      {format(new Date(task.start_date), "MMM d")} -{" "}
                      {format(new Date(task.end_date), "MMM d")}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
