"use client";

import { useState } from "react";
import { useRepository } from "@/contexts/RepositoryContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

function useCheckWorkflow(owner: string, repo: string, branch?: string | null) {
  return useQuery<{ hasWorkflow: boolean }>({
    queryKey: ["check-workflow", owner, repo, branch],
    queryFn: async () => {
      const params = new URLSearchParams({ owner, repo, ...(branch && { branch }) });
      const res = await fetch(`/api/github/check-workflow?${params}`);
      if (!res.ok) throw new Error("Failed to check workflow");
      return res.json();
    },
    enabled: !!owner && !!repo,
    staleTime: 60000,
  });
}

export function AgentWorkflowBanner() {
  const { owner, repo, branch } = useRepository();
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const { data, isLoading } = useCheckWorkflow(owner || "", repo || "", branch);

  if (!owner || !repo || isLoading || dismissed) {
    return null;
  }

  const hasWorkflow = data?.hasWorkflow ?? false;

  const handleSubmit = async () => {
    setIsPending(true);
    try {
      const res = await fetch("/api/github/init-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo, branch }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create workflow");
      queryClient.setQueryData(["check-workflow", owner, repo, branch], { hasWorkflow: true });
      toast.success(
        hasWorkflow
          ? "Agent workflow updated in .github/workflows/hlavi-agent.yml"
          : "Agent workflow added to .github/workflows/hlavi-agent.yml"
      );
      if (hasWorkflow) setDismissed(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save workflow");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className={`border rounded-lg p-4 flex items-start gap-3 ${hasWorkflow ? "bg-gray-50 border-gray-200" : "bg-violet-50 border-violet-200"}`}>
      <Bot className={`w-5 h-5 flex-shrink-0 mt-0.5 ${hasWorkflow ? "text-gray-500" : "text-violet-600"}`} />
      <div className="flex-1">
        {hasWorkflow ? (
          <>
            <p className="font-semibold text-gray-900 mb-1">Agent workflow found</p>
            <p className="text-sm text-gray-600 mb-3">
              Overwrite <code className="text-xs bg-white px-1.5 py-0.5 rounded border border-gray-200">.github/workflows/hlavi-agent.yml</code> with
              the latest template to get updated model options and settings.
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold text-gray-900 mb-1">Agent workflow not found</p>
            <p className="text-sm text-gray-600 mb-3">
              Add <code className="text-xs bg-white px-1.5 py-0.5 rounded border border-gray-200">.github/workflows/hlavi-agent.yml</code> to
              enable the Hlavi Agent to autonomously work on tasks in this repository.
            </p>
          </>
        )}
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className={`inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium ${hasWorkflow ? "bg-gray-600 hover:bg-gray-700" : "bg-violet-600 hover:bg-violet-700"}`}
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {hasWorkflow ? "Updating..." : "Adding workflow..."}
            </>
          ) : (
            <>
              <Bot className="w-4 h-4" />
              {hasWorkflow ? "Update workflow" : "Add agent workflow"}
            </>
          )}
        </button>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
        title="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
