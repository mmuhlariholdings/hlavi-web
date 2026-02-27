"use client";

import { useState, useEffect } from "react";
import { useRepository } from "@/contexts/RepositoryContext";
import { useTasks } from "@/hooks/useTasks";
import { TimelineView } from "@/components/timeline/TimelineView";
import { TimelineSkeleton } from "@/components/ui/Skeleton";
import { TaskSort, SortOption, sortTasks } from "@/components/ui/TaskSort";
import Link from "next/link";

export default function TimelinePage() {
  const { owner, repo } = useRepository();
  const { data, isLoading, error } = useTasks(owner || "", repo || "");

  const [sortOption, setSortOption] = useState<SortOption>("created-newest");

  // Load sort preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("timeline-sort-option");
    if (stored) {
      setSortOption(stored as SortOption);
    }
  }, []);

  // Save sort preference to localStorage
  useEffect(() => {
    localStorage.setItem("timeline-sort-option", sortOption);
  }, [sortOption]);

  // Apply sorting to tasks
  const sortedTasks = sortTasks(data?.tasks || [], sortOption);

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
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Timeline View</h1>
            <p className="text-sm md:text-base text-gray-600">
              Gantt chart visualization of tasks with dates
            </p>
          </div>
          <TaskSort value={sortOption} onChange={setSortOption} />
        </div>
        <TimelineSkeleton />
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
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Timeline View</h1>
          <p className="text-sm md:text-base text-gray-600">
            Gantt chart visualization of tasks with dates
            <span className="md:hidden block mt-1 text-xs text-gray-500">
              Swipe horizontally to view the full timeline
            </span>
          </p>
        </div>
        <TaskSort value={sortOption} onChange={setSortOption} />
      </div>

      <TimelineView tasks={sortedTasks} />
    </div>
  );
}
