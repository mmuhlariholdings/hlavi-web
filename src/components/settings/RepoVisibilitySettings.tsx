"use client";

import { useRepositories } from "@/hooks/useRepositories";
import { useHiddenRepos } from "@/hooks/useHiddenRepos";
import { Repository } from "@/lib/types";
import { Eye, EyeOff, Loader2, Lock, Globe } from "lucide-react";

export function RepoVisibilitySettings() {
  const { data, isLoading, error } = useRepositories();
  const { isHidden, toggleRepo } = useHiddenRepos();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 py-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading repositories...</span>
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">Failed to load repositories.</p>
    );
  }

  const repositories = (data?.repositories || []).sort((a, b) =>
    a.full_name.localeCompare(b.full_name)
  );

  const grouped = repositories.reduce(
    (acc, repo) => {
      const org = repo.owner.login;
      if (!acc[org]) acc[org] = [];
      acc[org].push(repo);
      return acc;
    },
    {} as Record<string, Repository[]>
  );

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([org, repos]) => (
        <div key={org}>
          <div className="flex items-center gap-2 mb-2">
            <img
              src={repos[0].owner.avatar_url}
              alt={org}
              className="w-5 h-5 rounded-full"
            />
            <span className="text-sm font-semibold text-gray-700">{org}</span>
          </div>
          <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {repos.map((repo) => {
              const hidden = isHidden(repo.full_name);
              return (
                <div
                  key={repo.id}
                  className={`flex items-center justify-between px-4 py-3 transition-colors ${
                    hidden ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {repo.private ? (
                      <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm truncate ${
                        hidden ? "text-gray-400" : "text-gray-800"
                      }`}
                    >
                      {repo.name}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleRepo(repo.full_name)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors flex-shrink-0 ml-3 ${
                      hidden
                        ? "border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300"
                        : "border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100"
                    }`}
                  >
                    {hidden ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        Hidden
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        Visible
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {repositories.length === 0 && (
        <p className="text-sm text-gray-500 py-2">No repositories found.</p>
      )}
    </div>
  );
}
