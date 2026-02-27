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

export default function AgendaPage() {
  const { owner, repo } = useRepository();
  const { data, isLoading, error } = useTasks(owner || "", repo || "");
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

    const tasksInProgress = tasks.filter((task) => {
      if (!task.start_date || !task.end_date) return false;
      const start = new Date(task.start_date);
      const end = new Date(task.end_date);
      return (
        isWithinInterval(selectedDate, { start, end }) &&
        task.status === "inprogress"
      );
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
      inProgress: tasksInProgress,
      overdue: overdueTasks,
      noDates: tasksWithoutDates,
    };
  }, [data, selectedDate]);

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
        {/* Overdue Tasks */}
        {filteredTasks.overdue.length > 0 && (
          <AgendaSection
            title="Overdue"
            tasks={filteredTasks.overdue}
            icon={<AlertTriangle className="w-5 h-5 text-orange-600" />}
            variant="warning"
            emptyMessage="No overdue tasks"
          />
        )}

        {/* Starting Today */}
        <AgendaSection
          title="Starting Today"
          tasks={filteredTasks.starting}
          icon={<PlayCircle className="w-5 h-5 text-blue-600" />}
          emptyMessage="No tasks starting today"
        />

        {/* Due Today */}
        <AgendaSection
          title="Due Today"
          tasks={filteredTasks.due}
          icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
          variant="success"
          emptyMessage="No tasks due today"
        />

        {/* In Progress */}
        <AgendaSection
          title="In Progress"
          tasks={filteredTasks.inProgress}
          icon={<Clock className="w-5 h-5 text-yellow-600" />}
          emptyMessage="No tasks in progress"
        />

        {/* Tasks Without Dates */}
        {filteredTasks.noDates.length > 0 && (
          <AgendaSection
            title="Tasks Without Dates"
            tasks={filteredTasks.noDates}
            icon={<Calendar className="w-5 h-5 text-gray-600" />}
            emptyMessage="All tasks have dates"
          />
        )}
      </div>
    </div>
  );
}
