"use client";

import { RepoSelector } from "@/components/dashboard/RepoSelector";
import { useRepository } from "@/contexts/RepositoryContext";
import { useTasks } from "@/hooks/useTasks";
import { CheckCircle2, Clock, AlertCircle, BarChart3 } from "lucide-react";
import { StatsCardSkeleton } from "@/components/ui/Skeleton";

export default function DashboardPage() {
  const { owner, repo, branch } = useRepository();
  const { data, isLoading } = useTasks(owner || "", repo || "", branch);

  const tasks = data?.tasks || [];

  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done" || t.status === "closed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "inprogress").length;
  const blockedTasks = tasks.filter((t) => t.status === "pending").length;

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-sm md:text-base text-gray-600">
          Select a repository to view and manage your hlavi tasks
        </p>
      </div>

      <RepoSelector />

      {owner && repo && (
        <div className="space-y-4 md:space-y-6">
          <div>
            <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Task Overview</h2>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-gray-600">Total Tasks</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2">
                      {totalTasks}
                    </p>
                  </div>
                  <BarChart3 className="w-7 h-7 md:w-8 md:h-8 text-blue-600 flex-shrink-0" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl md:text-3xl font-bold text-green-600 mt-1 md:mt-2">
                      {completedTasks}
                    </p>
                  </div>
                  <CheckCircle2 className="w-7 h-7 md:w-8 md:h-8 text-green-600 flex-shrink-0" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl md:text-3xl font-bold text-yellow-600 mt-1 md:mt-2">
                      {inProgressTasks}
                    </p>
                  </div>
                  <Clock className="w-7 h-7 md:w-8 md:h-8 text-yellow-600 flex-shrink-0" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-gray-600">Blocked</p>
                    <p className="text-2xl md:text-3xl font-bold text-orange-600 mt-1 md:mt-2">
                      {blockedTasks}
                    </p>
                  </div>
                  <AlertCircle className="w-7 h-7 md:w-8 md:h-8 text-orange-600 flex-shrink-0" />
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
