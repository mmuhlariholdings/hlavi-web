import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

interface InitializeHlaviParams {
  owner: string;
  repo: string;
  branch?: string | null;
}

export function useInitializeHlavi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ owner, repo, branch }: InitializeHlaviParams) => {
      const response = await fetch("/api/github/init-hlavi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ owner, repo, branch }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to initialize Hlavi");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate the hlavi check query for the specific branch to refresh the status
      queryClient.invalidateQueries({
        queryKey: ["check-hlavi", variables.owner, variables.repo, variables.branch],
      });

      // Also invalidate without branch to refresh general repo status
      queryClient.invalidateQueries({
        queryKey: ["check-hlavi", variables.owner, variables.repo],
      });

      // Invalidate branches query to refresh branch list
      queryClient.invalidateQueries({
        queryKey: ["branches", variables.owner, variables.repo],
      });

      // Invalidate tasks query to load the default task immediately
      queryClient.invalidateQueries({
        queryKey: ["tasks", variables.owner, variables.repo, variables.branch],
      });

      // Invalidate board config query to load the default board configuration
      queryClient.invalidateQueries({
        queryKey: ["board-config", variables.owner, variables.repo, variables.branch],
      });

      toast.success("Hlavi initialized successfully! 🎉");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to initialize Hlavi");
    },
  });
}
