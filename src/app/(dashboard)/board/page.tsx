"use client";

import { useState, useEffect } from "react";
import { useRepository } from "@/contexts/RepositoryContext";
import { useTasks } from "@/hooks/useTasks";
import { useBoardConfig } from "@/hooks/useBoardConfig";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { KanbanColumnSkeleton } from "@/components/ui/Skeleton";
import { TaskSort, SortOption, sortTasks } from "@/components/ui/TaskSort";
import Link from "next/link";
import { BranchInitializer } from "@/components/dashboard/BranchInitializer";

export default function BoardPage() {
  const { owner, repo, branch } = useRepository();
  const { data: tasksData, isLoading: tasksLoading, error: tasksError } = useTasks(
    owner || "",
    repo || "",
    branch
  );
  const { data: boardConfig, isLoading: configLoading } = useBoardConfig(
    owner || "",
    repo || "",
    branch
  );

  const [sortOption, setSortOption] = useState<SortOption>("created-newest");

  // Load sort preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("board-sort-option");
    if (stored) {
      setSortOption(stored as SortOption);
    }
  }, []);

  // Save sort preference to localStorage
  useEffect(() => {
    localStorage.setItem("board-sort-option", sortOption);
  }, [sortOption]);

  // Apply sorting to tasks
  const sortedTasks = sortTasks(tasksData?.tasks || [], sortOption);

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

  if (tasksLoading || configLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Kanban Board</h1>
            <p className="text-sm md:text-base text-gray-600">
              Organize and track your tasks by status
            </p>
          </div>
          <TaskSort value={sortOption} onChange={setSortOption} />
        </div>
        <div className="flex flex-col md:flex-row gap-4 md:overflow-x-auto md:pb-4 -mx-4 px-4 md:mx-0 md:px-0">
          <KanbanColumnSkeleton />
          <KanbanColumnSkeleton />
          <KanbanColumnSkeleton />
          <KanbanColumnSkeleton />
        </div>
      </div>
    );
  }

  if (tasksError) {
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
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Kanban Board</h1>
          <p className="text-sm md:text-base text-gray-600">
            Organize and track your tasks by status
          </p>
        </div>
        <TaskSort value={sortOption} onChange={setSortOption} />
      </div>

      {boardConfig && (
        <KanbanBoard
          tasks={sortedTasks}
          boardConfig={boardConfig}
        />
      )}
    </div>
  );
}
