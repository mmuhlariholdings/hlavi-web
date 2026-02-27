"use client";

import { useRepositories } from "@/hooks/useRepositories";
import { useRepository } from "@/contexts/RepositoryContext";
import { GitBranch, Loader2 } from "lucide-react";

export function RepoSelector() {
  const { data, isLoading, error } = useRepositories();
  const { owner, repo, setRepository } = useRepository();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading repositories...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
        Failed to load repositories. Please try again.
      </div>
    );
  }

  const repositories = data?.repositories || [];

  if (repositories.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          No repositories with hlavi tasks found. Initialize hlavi in a
          repository first by running <code className="bg-yellow-100 px-1 py-0.5 rounded">hlavi init</code>.
        </p>
      </div>
    );
  }

  const selectedRepo = repositories.find(
    (r) => r.owner.login === owner && r.name === repo
  );

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Select Repository
      </label>
      <select
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        value={selectedRepo?.full_name || ""}
        onChange={(e) => {
          const selected = repositories.find(
            (r) => r.full_name === e.target.value
          );
          if (selected) {
            setRepository(selected.owner.login, selected.name);
          }
        }}
      >
        <option value="">Select a repository...</option>
        {repositories.map((repository) => (
          <option key={repository.id} value={repository.full_name}>
            {repository.full_name}
          </option>
        ))}
      </select>

      {selectedRepo && (
        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <GitBranch className="w-5 h-5 text-gray-500 mt-0.5" />
          <div>
            <h3 className="font-medium">{selectedRepo.full_name}</h3>
            {selectedRepo.description && (
              <p className="text-sm text-gray-600 mt-1">
                {selectedRepo.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
