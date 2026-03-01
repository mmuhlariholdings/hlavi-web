"use client";

import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { Task } from "@/lib/types";

interface AgendaDateSectionProps {
  date: Date;
  tasks: Task[];
}

export function AgendaDateSection({ date, tasks }: AgendaDateSectionProps) {
  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  const getDayOfWeek = (date: Date) => {
    return format(date, "EEEE");
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
    <div className="mb-6">
      {/* Sticky Date Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200 py-4 px-6 mb-6 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 rounded-lg p-2.5">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{getDateLabel(date)}</h2>
              <p className="text-sm text-blue-700 font-medium">
                {getDayOfWeek(date)}
              </p>
            </div>
          </div>
          <div className="bg-blue-600 text-white px-5 py-2 rounded-full font-bold text-sm shadow-sm">
            {tasks.length}
          </div>
        </div>
      </div>

      {/* Tasks for this date */}
      <div className="space-y-2">
        {tasks.map((task) => {
          const completedCriteria = task.acceptance_criteria.filter((ac) => ac.completed).length;
          const totalCriteria = task.acceptance_criteria.length;

          return (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="flex gap-4 bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all group"
            >
              {/* Left: Time Column */}
              <div className="flex-shrink-0 w-20 text-center border-r border-gray-200 pr-4">
                {task.start_date && (
                  <>
                    <div className="text-2xl font-bold text-gray-900">
                      {format(new Date(task.start_date), "d")}
                    </div>
                    <div className="text-xs font-medium text-gray-500 uppercase">
                      {format(new Date(task.start_date), "MMM")}
                    </div>
                    {task.end_date && (
                      <div className="mt-2 text-xs text-gray-400">
                        → {format(new Date(task.end_date), "MMM d")}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Right: Task Content */}
              <div className="flex-1 min-w-0">
                {/* Task Header */}
                <div className="flex items-center gap-2 mb-2">
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

                {/* Task Title */}
                <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {task.title}
                </h3>

                {/* Task Description */}
                {task.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-1">{task.description}</p>
                )}

                {/* Task Footer */}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {/* Acceptance Criteria Progress */}
                  {totalCriteria > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">✓</span>
                      <span>
                        {completedCriteria}/{totalCriteria}
                      </span>
                    </div>
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
