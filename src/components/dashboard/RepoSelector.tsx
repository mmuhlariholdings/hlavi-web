"use client";

import { useState, useEffect } from "react";
import { useRepositories } from "@/hooks/useRepositories";
import { useRepository } from "@/contexts/RepositoryContext";
import { useInitializeHlavi } from "@/hooks/useInitializeHlavi";
import { useBranches } from "@/hooks/useBranches";
import { BranchSelector } from "./BranchSelector";
import { Loader2, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

function useCheckHlavi(owner: string, repo: string, branch?: string) {
  return useQuery<{ hasHlavi: boolean }>({
    queryKey: ["check-hlavi", owner, repo, branch],
    queryFn: async () => {
      const params = new URLSearchParams({
        owner,
        repo,
        ...(branch && { branch }),
      });
      const res = await fetch(`/api/github/check-hlavi?${params}`);
      if (!res.ok) throw new Error("Failed to check .hlavi directory");
      return res.json();
    },
    enabled: !!owner && !!repo,
    staleTime: 30000, // Cache for 30 seconds - allow branch switching to refetch
  });
}

export function RepoSelector() {
  const { data, isLoading, error } = useRepositories();
  const { owner, repo, setRepository, clearRepository } = useRepository();
  const initializeHlavi = useInitializeHlavi();
  const [pendingSelection, setPendingSelection] = useState<{
    owner: string;
    repo: string;
  } | null>(null);
  const [initBranch, setInitBranch] = useState<string>("");

  // Check if selected repo has .hlavi on the selected branch
  const { data: hlaviCheck, isLoading: isCheckingHlavi } = useCheckHlavi(
    pendingSelection?.owner || owner || "",
    pendingSelection?.repo || repo || "",
    pendingSelection ? initBranch : undefined
  );

  // Fetch branches for pending selection (for initialization)
  const { data: branchesData } = useBranches(
    pendingSelection?.owner || "",
    pendingSelection?.repo || ""
  );

  // Auto-select default branch when pending selection changes
  useEffect(() => {
    if (pendingSelection && branchesData?.defaultBranch) {
      setInitBranch(branchesData.defaultBranch);
    }
  }, [pendingSelection, branchesData?.defaultBranch]);

  // Update repository once validation passes, or clear if validation fails
  useEffect(() => {
    if (pendingSelection && hlaviCheck !== undefined && !isCheckingHlavi) {
      if (hlaviCheck?.hasHlavi) {
        setRepository(pendingSelection.owner, pendingSelection.repo, initBranch || undefined);
        setPendingSelection(null);
      } else {
        // Clear the repository context when selected repo doesn't have Hlavi
        clearRepository();
      }
    }
  }, [pendingSelection, hlaviCheck, isCheckingHlavi, setRepository, clearRepository, initBranch]);

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

  const repositories = (data?.repositories || []).sort((a, b) => {
    // First sort by organization (owner)
    const ownerCompare = a.owner.login.localeCompare(b.owner.login);
    if (ownerCompare !== 0) return ownerCompare;

    // Then sort by repository name
    return a.name.localeCompare(b.name);
  });

  if (repositories.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          No repositories found. Create a repository first.
        </p>
      </div>
    );
  }

  const selectedRepo = repositories.find(
    (r) => r.owner.login === owner && r.name === repo
  );

  const handleRepoChange = (fullName: string) => {
    if (!fullName) {
      clearRepository();
      setPendingSelection(null);
      return;
    }

    const selected = repositories.find((r) => r.full_name === fullName);
    if (selected) {
      setPendingSelection({
        owner: selected.owner.login,
        repo: selected.name,
      });
    }
  };

  const handleInitialize = async () => {
    if (!pendingSelection || !initBranch) return;

    await initializeHlavi.mutateAsync({
      owner: pendingSelection.owner,
      repo: pendingSelection.repo,
      branch: initBranch,
    });
  };

  const showWarning =
    pendingSelection &&
    !isCheckingHlavi &&
    hlaviCheck &&
    !hlaviCheck.hasHlavi;

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Select Repository
      </label>
      <select
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        value={selectedRepo?.full_name || ""}
        onChange={(e) => handleRepoChange(e.target.value)}
        disabled={isCheckingHlavi}
      >
        <option value="">Select a repository...</option>
        {repositories.map((repository) => (
          <option key={repository.id} value={repository.full_name}>
            {repository.full_name}
          </option>
        ))}
      </select>

      {isCheckingHlavi && (
        <div className="flex items-center gap-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Checking for hlavi tasks...</span>
        </div>
      )}

      {showWarning && pendingSelection && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900 mb-1">
                Initialize Hlavi in <span className="text-blue-600">{pendingSelection.owner}/{pendingSelection.repo}</span>
              </p>
              <p className="text-sm text-gray-600 mb-3">
                This repository doesn't have a <code className="text-xs bg-white px-1.5 py-0.5 rounded border border-gray-200">.hlavi</code> directory yet.
                Initialize Hlavi to get started with git-based task management.
              </p>

              {/* Branch Selection for Initialization */}
              {branchesData && branchesData.branches.length > 0 && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select branch to initialize
                  </label>
                  <select
                    value={initBranch}
                    onChange={(e) => setInitBranch(e.target.value)}
                    disabled={initializeHlavi.isPending}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                  >
                    {branchesData.branches.map((branch) => (
                      <option key={branch.name} value={branch.name}>
                        {branch.name}
                        {branch.name === branchesData.defaultBranch && " (default)"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleInitialize}
                disabled={initializeHlavi.isPending || !initBranch}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {initializeHlavi.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Initializing on {initBranch}...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Initialize on {initBranch}
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                This will create the <code className="bg-white px-1 py-0.5 rounded border border-gray-200">.hlavi</code> directory with default configuration on the selected branch
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedRepo && hlaviCheck?.hasHlavi && (
        <BranchSelector />
      )}
    </div>
  );
}
