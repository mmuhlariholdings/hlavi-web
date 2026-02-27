"use client";

import { useEffect } from "react";
import { useRepository } from "@/contexts/RepositoryContext";
import { useBranches } from "@/hooks/useBranches";
import { GitBranch, Loader2 } from "lucide-react";

export function BranchSelector() {
  const { owner, repo, branch, setBranch } = useRepository();
  const { data, isLoading, error } = useBranches(owner || "", repo || "");

  // Auto-select default branch if no branch is selected
  useEffect(() => {
    if (data?.defaultBranch && !branch && owner && repo) {
      setBranch(data.defaultBranch);
    }
  }, [data?.defaultBranch, branch, setBranch, owner, repo]);

  if (!owner || !repo) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading branches...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-sm text-red-600">
        Failed to load branches
      </div>
    );
  }

  const branches = data.branches || [];
  const currentBranch = branch || data.defaultBranch;

  if (branches.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <label htmlFor="branch-selector" className="block text-sm font-medium text-gray-700">
        Branch
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <GitBranch className="w-4 h-4 text-gray-400" />
        </div>
        <select
          id="branch-selector"
          value={currentBranch}
          onChange={(e) => setBranch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
        >
          {branches.map((b) => (
            <option key={b.name} value={b.name}>
              {b.name}
              {b.name === data.defaultBranch && " (default)"}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
