"use client";

import { useRepository } from "@/contexts/RepositoryContext";
import { useTask } from "@/hooks/useTasks";
import { TaskDetail } from "@/components/tasks/TaskDetail";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use } from "react";

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = use(params);
  const { owner, repo, branch } = useRepository();
  const router = useRouter();
  const { data, isLoading, error } = useTask(
    owner || "",
    repo || "",
    taskId,
    branch
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="text-red-600 text-center py-12 bg-red-50 rounded-lg border border-red-200">
          Failed to load task. Please try again.
        </div>
      </div>
    );
  }

  if (!data?.task) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          Task not found
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm md:text-base text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 lg:p-8">
        <TaskDetail task={data.task} />
      </div>
    </div>
  );
}
