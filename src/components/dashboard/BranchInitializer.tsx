"use client";

import { useRepository } from "@/contexts/RepositoryContext";
import { useInitializeHlavi } from "@/hooks/useInitializeHlavi";
import { Sparkles, Loader2 } from "lucide-react";
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
    staleTime: 30000,
  });
}

export function BranchInitializer() {
  const { owner, repo, branch } = useRepository();
  const initializeHlavi = useInitializeHlavi();
  const { data: hlaviCheck, isLoading } = useCheckHlavi(
    owner || "",
    repo || "",
    branch || undefined
  );

  // Don't show anything if we're still checking or if hlavi exists
  if (!owner || !repo || !branch || isLoading || hlaviCheck?.hasHlavi) {
    return null;
  }

  const handleInitialize = async () => {
    if (!owner || !repo || !branch) return;

    await initializeHlavi.mutateAsync({
      owner,
      repo,
      branch,
    });
  };

  return (
    <div>
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <Sparkles className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Initialize Hlavi on{" "}
              <span className="text-blue-600">{branch}</span> branch
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              The <span className="font-medium">{branch}</span> branch in{" "}
              <span className="font-medium">{owner}/{repo}</span> doesn't have a{" "}
              <code className="text-xs bg-white px-1.5 py-0.5 rounded border border-gray-200">
                .hlavi
              </code>{" "}
              directory yet. Initialize Hlavi on this branch to start managing tasks.
            </p>
            <button
              onClick={handleInitialize}
              disabled={initializeHlavi.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {initializeHlavi.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Initializing on {branch}...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Initialize Hlavi on {branch}
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-3">
              This will create the{" "}
              <code className="bg-white px-1 py-0.5 rounded border border-gray-200">
                .hlavi
              </code>{" "}
              directory with default configuration on the {branch} branch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
