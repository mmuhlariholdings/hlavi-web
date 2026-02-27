"use client";

import { useRepository } from "@/contexts/RepositoryContext";
import { GitBranch, FolderGit2 } from "lucide-react";

export function RepositoryBreadcrumb() {
  const { owner, repo, branch } = useRepository();

  if (!owner || !repo) {
    return null;
  }

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center gap-3 text-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <FolderGit2 className="w-4 h-4 text-gray-500" />
          <span className="font-medium">{owner}</span>
          <span className="text-gray-400">/</span>
          <span className="font-medium">{repo}</span>
        </div>

        {branch && (
          <>
            <span className="text-gray-400">@</span>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
              <GitBranch className="w-3.5 h-3.5" />
              <span className="font-medium">{branch}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
