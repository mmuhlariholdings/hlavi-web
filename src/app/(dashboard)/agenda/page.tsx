"use client";

import { useState, useEffect, useMemo } from "react";
import { useRepository } from "@/contexts/RepositoryContext";
import { useTasks } from "@/hooks/useTasks";
import { DateSelector } from "@/components/agenda/DateSelector";
import { AgendaSection } from "@/components/agenda/AgendaSection";
import { Skeleton } from "@/components/ui/Skeleton";
import { PlayCircle, CheckCircle2, AlertTriangle, Calendar, Clock, Circle, Eye, XCircle } from "lucide-react";
import { format, isWithinInterval, isSameDay, startOfWeek, endOfWeek, isBefore, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import Link from "next/link";
import { BranchInitializer } from "@/components/dashboard/BranchInitializer";

export default function AgendaPage() {
  const { owner, repo, branch } = useRepository();
  const { data, isLoading, error } = useTasks(owner || "", repo || "", branch);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewPeriod, setViewPeriod] = useState<"day" | "week" | "month" | "year">("day");

  // Filter tasks based on selected date - grouped by status for planning
  const filteredTasks = useMemo(() => {
    const tasks = data?.tasks || [];
    const selectedDay = startOfDay(selectedDate);

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

    // Get all tasks that are relevant to this period
    // (either active during this period or scheduled to start/end)
    const relevantTasks = tasks.filter((task) => {
      // Include tasks without dates
      if (!task.start_date && !task.end_date) return true;

      const taskStart = task.start_date ? new Date(task.start_date) : null;
      const taskEnd = task.end_date ? new Date(task.end_date) : null;

      // Include tasks where date ranges overlap with viewing period
      // Overlap occurs if: task.start <= period.end AND task.end >= period.start
      if (taskStart && taskEnd) {
        return taskStart <= periodEnd && taskEnd >= periodStart;
      }

      // Include tasks that only have start date and it falls within period
      if (taskStart && !taskEnd) {
        return taskStart >= periodStart && taskStart <= periodEnd;
      }

      // Include tasks that only have end date and it falls within period
      if (taskEnd && !taskStart) {
        return taskEnd >= periodStart && taskEnd <= periodEnd;
      }

      return false;
    });

    // Group by status for planning
    const overdue = relevantTasks.filter((task) => {
      if (!task.end_date) return false;
      const endDate = new Date(task.end_date);
      return (
        isBefore(endDate, selectedDay) &&
        task.status !== "done" &&
        task.status !== "closed"
      );
    });

    const notStarted = relevantTasks.filter(
      (task) =>
        (task.status === "new" || task.status === "open") &&
        !overdue.includes(task)
    );

    const inProgress = relevantTasks.filter(
      (task) => task.status === "inprogress" && !overdue.includes(task)
    );

    const inReview = relevantTasks.filter(
      (task) => task.status === "review" && !overdue.includes(task)
    );

    const blocked = relevantTasks.filter(
      (task) => task.status === "pending" && !overdue.includes(task)
    );

    const completed = relevantTasks.filter(
      (task) => task.status === "done" || task.status === "closed"
    );

    // Debug logging to understand categorization
    const statusBreakdown = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tasksNotShowing = tasks.filter(t => !relevantTasks.includes(t));

    console.log('=== AGENDA DEBUG ===');
    console.log('View Period:', viewPeriod);
    console.log('Selected Date:', format(selectedDate, 'yyyy-MM-dd'));
    console.log('Period Range:', format(periodStart, 'yyyy-MM-dd'), 'to', format(periodEnd, 'yyyy-MM-dd'));
    console.log('Total Tasks in Repo:', tasks.length);
    console.log('Status Breakdown (ALL tasks):', statusBreakdown);
    console.log('\nTasks Relevant to Selected Date:', relevantTasks.length);
    console.log('Categorization:', {
      overdue: overdue.length,
      notStarted: notStarted.length,
      inProgress: inProgress.length,
      inReview: inReview.length,
      blocked: blocked.length,
      completed: completed.length,
    });
    console.log('\nRelevant Tasks Details:');
    relevantTasks.forEach(t => {
      console.log(`  ${t.id} | ${t.status.padEnd(10)} | ${t.start_date || 'no start'} to ${t.end_date || 'no end'} | ${t.title.substring(0, 40)}`);
    });
    console.log('\nTasks NOT showing (filtered out by date):', tasksNotShowing.length);
    if (tasksNotShowing.length > 0) {
      console.log('Not Showing:');
      tasksNotShowing.forEach(t => {
        console.log(`  ${t.id} | ${t.status.padEnd(10)} | ${t.start_date || 'no start'} to ${t.end_date || 'no end'} | ${t.title.substring(0, 40)}`);
      });
    }
    console.log('===================\n');

    return {
      overdue,
      notStarted,
      inProgress,
      inReview,
      blocked,
      completed,
    };
  }, [data, selectedDate, viewPeriod]);

  // Check if there are any tasks for this period
  const hasAnyTasks =
    filteredTasks.overdue.length > 0 ||
    filteredTasks.notStarted.length > 0 ||
    filteredTasks.inProgress.length > 0 ||
    filteredTasks.inReview.length > 0 ||
    filteredTasks.blocked.length > 0 ||
    filteredTasks.completed.length > 0;

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
        <div className="space-y-4">
          {/* Overdue Tasks */}
          {filteredTasks.overdue.length > 0 && (
            <AgendaSection
              title="Overdue"
              tasks={filteredTasks.overdue}
              icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
              variant="warning"
            />
          )}

          {/* Not Started */}
          {filteredTasks.notStarted.length > 0 && (
            <AgendaSection
              title="To Do"
              tasks={filteredTasks.notStarted}
              icon={<Circle className="w-5 h-5 text-gray-600" />}
            />
          )}

          {/* In Progress */}
          {filteredTasks.inProgress.length > 0 && (
            <AgendaSection
              title="In Progress"
              tasks={filteredTasks.inProgress}
              icon={<Clock className="w-5 h-5 text-blue-600" />}
            />
          )}

          {/* In Review */}
          {filteredTasks.inReview.length > 0 && (
            <AgendaSection
              title="In Review"
              tasks={filteredTasks.inReview}
              icon={<Eye className="w-5 h-5 text-purple-600" />}
            />
          )}

          {/* Blocked/Pending */}
          {filteredTasks.blocked.length > 0 && (
            <AgendaSection
              title="Blocked"
              tasks={filteredTasks.blocked}
              icon={<XCircle className="w-5 h-5 text-orange-600" />}
            />
          )}

          {/* Completed */}
          {filteredTasks.completed.length > 0 && (
            <AgendaSection
              title="Completed"
              tasks={filteredTasks.completed}
              icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
              variant="success"
            />
          )}
        </div>
      )}
    </div>
  );
}
