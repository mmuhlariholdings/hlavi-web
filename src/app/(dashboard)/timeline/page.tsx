"use client";

import { useRepository } from "@/contexts/RepositoryContext";
import { useTasks } from "@/hooks/useTasks";
import { TimelineView } from "@/components/timeline/TimelineView";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function TimelinePage() {
  const { owner, repo } = useRepository();
  const { data, isLoading, error } = useTasks(owner || "", repo || "");

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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Timeline View</h1>
        <p className="text-sm md:text-base text-gray-600">
          Gantt chart visualization of tasks with dates
          <span className="md:hidden block mt-1 text-xs text-gray-500">
            Swipe horizontally to view the full timeline
          </span>
        </p>
      </div>

      <TimelineView tasks={data?.tasks || []} />
    </div>
  );
}
