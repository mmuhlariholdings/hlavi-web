"use client";

import { useState, useEffect, useMemo } from "react";
import { useRepository } from "@/contexts/RepositoryContext";
import { useTasks } from "@/hooks/useTasks";
import { DateSelector } from "@/components/agenda/DateSelector";
import { AgendaSection } from "@/components/agenda/AgendaSection";
import { Skeleton } from "@/components/ui/Skeleton";
import { PlayCircle, CheckCircle2, AlertTriangle, Calendar, Clock } from "lucide-react";
import { format, isWithinInterval, isSameDay, startOfWeek, endOfWeek, isBefore, startOfDay } from "date-fns";
import Link from "next/link";
import { BranchInitializer } from "@/components/dashboard/BranchInitializer";

export default function AgendaPage() {
  const { owner, repo, branch } = useRepository();
  const { data, isLoading, error } = useTasks(owner || "", repo || "", branch);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Filter tasks based on selected date
  const filteredTasks = useMemo(() => {
    const tasks = data?.tasks || [];
    const now = new Date();
    const selectedDay = startOfDay(selectedDate);

    const tasksStartingToday = tasks.filter((task) => {
      if (!task.start_date) return false;
      return isSameDay(new Date(task.start_date), selectedDate);
    });

    const tasksDueToday = tasks.filter((task) => {
      if (!task.end_date) return false;
      return isSameDay(new Date(task.end_date), selectedDate);
    });

    // Tasks that are active/running during the selected date
    // This includes tasks where the selected date falls within their date range
    // but they don't start or end on this specific day
    const tasksActive = tasks.filter((task) => {
      if (!task.start_date || !task.end_date) return false;
      const start = new Date(task.start_date);
      const end = new Date(task.end_date);

      // Check if selected date is within the task's date range
      const isWithinRange = isWithinInterval(selectedDate, { start, end });

      // Exclude tasks that start or end today (they'll be in their own sections)
      const startsToday = isSameDay(start, selectedDate);
      const endsToday = isSameDay(end, selectedDate);

      return isWithinRange && !startsToday && !endsToday;
    });

    const overdueTasks = tasks.filter((task) => {
      if (!task.end_date) return false;
      const endDate = new Date(task.end_date);
      return (
        isBefore(endDate, selectedDay) &&
        task.status !== "done" &&
        task.status !== "closed"
      );
    });

    const tasksWithoutDates = tasks.filter(
      (task) => !task.start_date && !task.end_date
    );

    return {
      starting: tasksStartingToday,
      due: tasksDueToday,
      active: tasksActive,
      overdue: overdueTasks,
      noDates: tasksWithoutDates,
    };
  }, [data, selectedDate]);

  // Check if there are any tasks for this period
  const hasAnyTasks =
    filteredTasks.starting.length > 0 ||
    filteredTasks.due.length > 0 ||
    filteredTasks.active.length > 0 ||
    filteredTasks.overdue.length > 0 ||
    filteredTasks.noDates.length > 0;

  if (!owner || !repo) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <p className="text-gray-600 mb-4">
          Please select a repository from the dashboard
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Agenda</h1>
            <p className="text-sm md:text-base text-gray-600">
              View tasks scheduled for {format(selectedDate, "MMMM d, yyyy")}
            </p>
          </div>
        </div>
        <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center py-12 bg-red-50 rounded-lg border border-red-200">
        Failed to load tasks. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BranchInitializer />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Agenda</h1>
          <p className="text-sm md:text-base text-gray-600">
            View tasks scheduled for {format(selectedDate, "MMMM d, yyyy")}
          </p>
        </div>
      </div>

      <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />

      {!hasAnyTasks ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No tasks for {format(selectedDate, "MMMM d, yyyy")}
          </h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            There are no tasks scheduled for this period. Try selecting a different
            date or create new tasks in your repository.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Overdue Tasks */}
          {filteredTasks.overdue.length > 0 && (
            <AgendaSection
              title="Overdue"
              tasks={filteredTasks.overdue}
              icon={<AlertTriangle className="w-5 h-5 text-orange-600" />}
              variant="warning"
            />
          )}

          {/* Starting Today */}
          {filteredTasks.starting.length > 0 && (
            <AgendaSection
              title="Starting Today"
              tasks={filteredTasks.starting}
              icon={<PlayCircle className="w-5 h-5 text-blue-600" />}
            />
          )}

          {/* Due Today */}
          {filteredTasks.due.length > 0 && (
            <AgendaSection
              title="Due Today"
              tasks={filteredTasks.due}
              icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
              variant="success"
            />
          )}

          {/* Active/Running Tasks */}
          {filteredTasks.active.length > 0 && (
            <AgendaSection
              title="Active Tasks"
              tasks={filteredTasks.active}
              icon={<Clock className="w-5 h-5 text-blue-600" />}
            />
          )}

          {/* Tasks Without Dates */}
          {filteredTasks.noDates.length > 0 && (
            <AgendaSection
              title="Tasks Without Dates"
              tasks={filteredTasks.noDates}
              icon={<Calendar className="w-5 h-5 text-gray-600" />}
            />
          )}
        </div>
      )}
    </div>
  );
}
