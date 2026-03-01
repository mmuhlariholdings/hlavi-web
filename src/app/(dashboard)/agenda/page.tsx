"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRepository } from "@/contexts/RepositoryContext";
import { useTasks } from "@/hooks/useTasks";
import { DateSelector } from "@/components/agenda/DateSelector";
import { AgendaDateSection } from "@/components/agenda/AgendaDateSection";
import { Skeleton } from "@/components/ui/Skeleton";
import { Calendar, ArrowUp, CalendarCheck } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, isWithinInterval, eachDayOfInterval, max, min, isSameDay } from "date-fns";
import Link from "next/link";
import { BranchInitializer } from "@/components/dashboard/BranchInitializer";

export default function AgendaPage() {
  const { owner, repo, branch } = useRepository();
  const { data, isLoading, error } = useTasks(owner || "", repo || "", branch);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewPeriod, setViewPeriod] = useState<"day" | "week" | "month" | "year">("day");
  const dateRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Group tasks by date chronologically (tasks appear on every day they span)
  const tasksByDate = useMemo(() => {
    const tasks = data?.tasks || [];

    // Determine the viewing period based on viewPeriod state
    let periodStart: Date;
    let periodEnd: Date;

    switch (viewPeriod) {
      case "week":
        periodStart = startOfWeek(selectedDate);
        periodEnd = endOfWeek(selectedDate);
        break;
      case "month":
        periodStart = startOfMonth(selectedDate);
        periodEnd = endOfMonth(selectedDate);
        break;
      case "year":
        periodStart = startOfYear(selectedDate);
        periodEnd = endOfYear(selectedDate);
        break;
      case "day":
      default:
        periodStart = startOfDay(selectedDate);
        periodEnd = endOfDay(selectedDate);
        break;
    }

    // Filter tasks that fall within the viewing period and have dates
    const relevantTasks = tasks.filter((task) => {
      if (!task.start_date) return false; // Only show tasks with start dates

      const taskStart = new Date(task.start_date);
      const taskEnd = task.end_date ? new Date(task.end_date) : taskStart;

      // Check if task overlaps with viewing period
      return taskStart <= periodEnd && taskEnd >= periodStart;
    });

    // Group tasks by date - each task appears on every day it spans
    const grouped = new Map<string, typeof tasks>();

    relevantTasks.forEach((task) => {
      const taskStart = new Date(task.start_date!);
      const taskEnd = task.end_date ? new Date(task.end_date) : taskStart;

      // Calculate the intersection of task range and viewing period
      const rangeStart = max([taskStart, periodStart]);
      const rangeEnd = min([taskEnd, periodEnd]);

      // Generate all dates this task spans within the viewing period
      const datesSpanned = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

      datesSpanned.forEach((date) => {
        const dateKey = format(date, "yyyy-MM-dd");

        if (!grouped.has(dateKey)) {
          grouped.set(dateKey, []);
        }
        grouped.get(dateKey)!.push(task);
      });
    });

    // Convert to sorted array of [date, tasks] entries
    const sortedEntries = Array.from(grouped.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([dateStr, tasks]) => ({
        date: parseISO(dateStr),
        tasks,
      }));

    return sortedEntries;
  }, [data, selectedDate, viewPeriod]);

  // Check if there are any tasks for this period
  const hasAnyTasks = tasksByDate.length > 0;

  // Scroll to today's date (or selected date) when data loads
  useEffect(() => {
    if (tasksByDate.length === 0) return;

    // Find today's date in the list
    const today = startOfDay(new Date());
    const todayKey = format(today, "yyyy-MM-dd");

    // Try to scroll to today, or the first date if today isn't in the list
    const targetRef = dateRefs.current.get(todayKey) || dateRefs.current.values().next().value;

    if (targetRef) {
      setTimeout(() => {
        targetRef.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [tasksByDate]);

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
        <DateSelector
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onPeriodChange={setViewPeriod}
      />
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

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToToday = useCallback(() => {
    const today = startOfDay(new Date());
    const todayKey = format(today, "yyyy-MM-dd");
    const todayRef = dateRefs.current.get(todayKey);

    if (todayRef) {
      todayRef.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  return (
    <div className="space-y-6">
      <BranchInitializer />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Agenda</h1>
          <p className="text-sm md:text-base text-gray-600">
            {viewPeriod === "day" && `View tasks scheduled for ${format(selectedDate, "MMMM d, yyyy")}`}
            {viewPeriod === "week" && `View tasks scheduled for the week of ${format(selectedDate, "MMMM d, yyyy")}`}
            {viewPeriod === "month" && `View tasks scheduled for ${format(selectedDate, "MMMM yyyy")}`}
            {viewPeriod === "year" && `View tasks scheduled for ${format(selectedDate, "yyyy")}`}
          </p>
        </div>
      </div>

      <DateSelector
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onPeriodChange={setViewPeriod}
      />

      {!hasAnyTasks ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No tasks for{" "}
            {viewPeriod === "day" && format(selectedDate, "MMMM d, yyyy")}
            {viewPeriod === "week" && `the week of ${format(selectedDate, "MMMM d, yyyy")}`}
            {viewPeriod === "month" && format(selectedDate, "MMMM yyyy")}
            {viewPeriod === "year" && format(selectedDate, "yyyy")}
          </h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            There are no tasks scheduled for this period. Try selecting a different
            date or create new tasks in your repository.
          </p>
        </div>
      ) : (
        <div className="relative">
          {tasksByDate.map(({ date, tasks }) => {
            const dateKey = format(date, "yyyy-MM-dd");
            const today = startOfDay(new Date());
            const isToday = isSameDay(date, today);

            return (
              <AgendaDateSection
                key={dateKey}
                ref={(el) => {
                  if (el) {
                    dateRefs.current.set(dateKey, el);
                  } else {
                    dateRefs.current.delete(dateKey);
                  }
                }}
                date={date}
                tasks={tasks}
                isTargetDate={isToday}
              />
            );
          })}
        </div>
      )}

      {/* Floating Action Buttons */}
      {hasAnyTasks && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
          {/* Scroll to Top Button */}
          <button
            onClick={scrollToTop}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-4 shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Scroll to top"
            title="Scroll to top"
          >
            <ArrowUp className="w-6 h-6" />
          </button>

          {/* Jump to Today Button */}
          <button
            onClick={scrollToToday}
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-4 shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label="Jump to today"
            title="Jump to today"
          >
            <CalendarCheck className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
