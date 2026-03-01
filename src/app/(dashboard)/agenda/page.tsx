"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRepository } from "@/contexts/RepositoryContext";
import { useTasks } from "@/hooks/useTasks";
import { DateSelector } from "@/components/agenda/DateSelector";
import { AgendaDateSection } from "@/components/agenda/AgendaDateSection";
import { Skeleton } from "@/components/ui/Skeleton";
import { Calendar } from "lucide-react";
import { format, startOfDay, parseISO, eachDayOfInterval, isSameDay } from "date-fns";
import Link from "next/link";
import { BranchInitializer } from "@/components/dashboard/BranchInitializer";

export default function AgendaPage() {
  const { owner, repo, branch } = useRepository();
  const { data, isLoading, error } = useTasks(owner || "", repo || "", branch);
  const dateRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showMoreBelow, setShowMoreBelow] = useState(false);
  const [showMoreAbove, setShowMoreAbove] = useState(false);

  // Scroll to a specific date
  const scrollToDate = useCallback((targetDate: Date) => {
    const dateKey = format(startOfDay(targetDate), "yyyy-MM-dd");
    const targetRef = dateRefs.current.get(dateKey);

    if (targetRef && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const element = targetRef;

      // Calculate position to place element near top with padding to show peek of previous item
      const containerTop = container.getBoundingClientRect().top;
      const elementTop = element.getBoundingClientRect().top;
      const offset = elementTop - containerTop + container.scrollTop - 60;

      container.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
    }
  }, []);

  // Group tasks by date chronologically (tasks appear on every day they span)
  const tasksByDate = useMemo(() => {
    const tasks = data?.tasks || [];

    // Show all tasks with dates (no period filtering)
    const relevantTasks = tasks.filter((task) => {
      return task.start_date !== undefined && task.start_date !== null;
    });

    // Group tasks by date - each task appears on every day it spans
    const grouped = new Map<string, typeof tasks>();

    relevantTasks.forEach((task) => {
      const taskStart = new Date(task.start_date!);
      const taskEnd = task.end_date ? new Date(task.end_date) : taskStart;

      // Generate all dates this task spans
      const datesSpanned = eachDayOfInterval({ start: taskStart, end: taskEnd });

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
  }, [data]);

  // Check if there are any tasks for this period
  const hasAnyTasks = tasksByDate.length > 0;

  // Scroll to today's date (or selected date) when data loads
  useEffect(() => {
    if (tasksByDate.length === 0 || !scrollContainerRef.current) return;

    // Find today's date in the list
    const today = startOfDay(new Date());
    const todayKey = format(today, "yyyy-MM-dd");

    // Try to scroll to today, or the first date if today isn't in the list
    const targetRef = dateRefs.current.get(todayKey) || dateRefs.current.values().next().value;

    if (targetRef) {
      setTimeout(() => {
        const container = scrollContainerRef.current;
        const element = targetRef;

        if (container && element) {
          // Calculate position to place element near top with padding to show peek of previous item
          const containerTop = container.getBoundingClientRect().top;
          const elementTop = element.getBoundingClientRect().top;
          const offset = elementTop - containerTop + container.scrollTop - 60; // 60px padding to show previous item peek

          container.scrollTo({ top: Math.max(0, offset), behavior: "auto" });
        }
      }, 100);
    }
  }, [tasksByDate]);

  // Track scroll position to show indicators for more content
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;

      // Show indicator if there's more content above (scrolled down at least 50px)
      setShowMoreAbove(scrollTop > 50);

      // Show indicator if there's more content below (not at bottom)
      setShowMoreBelow(scrollTop + clientHeight < scrollHeight - 50);
    };

    container.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
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
              All scheduled tasks
            </p>
          </div>
        </div>
        <DateSelector onDateJump={() => {}} />
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
            All scheduled tasks
          </p>
        </div>
      </div>

      <DateSelector onDateJump={scrollToDate} />

      <div className="relative border-t border-gray-200 rounded-t-lg">
        {/* Indicator for more content above */}
        {showMoreAbove && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-400/30 z-10 pointer-events-none" />
        )}

        {/* Indicator for more content below */}
        {showMoreBelow && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-400/30 z-10 pointer-events-none" />
        )}

        <div
          ref={scrollContainerRef}
          className="overflow-y-auto px-1 py-4"
          style={{ height: 'calc(100vh - 280px)' }}
        >
          {!hasAnyTasks ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No scheduled tasks
              </h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                There are no tasks with dates in your repository. Create new tasks with start dates to see them here.
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
        </div>
      </div>
    </div>
  );
}
