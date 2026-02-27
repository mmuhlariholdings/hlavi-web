"use client";

import { useRepository } from "@/contexts/RepositoryContext";
import { useTasks } from "@/hooks/useTasks";
import { useBoardConfig } from "@/hooks/useBoardConfig";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function BoardPage() {
  const { owner, repo } = useRepository();
  const { data: tasksData, isLoading: tasksLoading, error: tasksError } = useTasks(
    owner || "",
    repo || ""
  );
  const { data: boardConfig, isLoading: configLoading } = useBoardConfig(
    owner || "",
    repo || ""
  );

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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Kanban Board</h1>
        <p className="text-sm md:text-base text-gray-600">
          Organize and track your tasks by status
        </p>
        <p className="hidden md:block mt-1 text-xs text-gray-500">
          Scroll horizontally to view all columns
        </p>
      </div>

      {boardConfig && (
        <KanbanBoard
          tasks={tasksData?.tasks || []}
          boardConfig={boardConfig}
        />
      )}
    </div>
  );
}
