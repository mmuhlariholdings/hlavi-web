"use client";

import { RepoSelector } from "@/components/dashboard/RepoSelector";
import { useRepository } from "@/contexts/RepositoryContext";
import { useTasks } from "@/hooks/useTasks";
import { CheckCircle2, Clock, AlertCircle, BarChart3 } from "lucide-react";

export default function DashboardPage() {
  const { owner, repo } = useRepository();
  const { data } = useTasks(owner || "", repo || "");

  const tasks = data?.tasks || [];

  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done" || t.status === "closed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "inprogress").length;
  const blockedTasks = tasks.filter((t) => t.status === "pending").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Select a repository to view and manage your hlavi tasks
        </p>
      </div>

      <RepoSelector />

      {owner && repo && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Task Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {totalTasks}
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {completedTasks}
                    </p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">
                      {inProgressTasks}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Blocked</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">
                      {blockedTasks}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
