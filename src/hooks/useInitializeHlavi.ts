import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

interface InitializeHlaviParams {
  owner: string;
  repo: string;
}

export function useInitializeHlavi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ owner, repo }: InitializeHlaviParams) => {
      const response = await fetch("/api/github/init-hlavi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ owner, repo }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to initialize Hlavi");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate the hlavi check query to refresh the status
      queryClient.invalidateQueries({
        queryKey: ["check-hlavi", variables.owner, variables.repo],
      });

      toast.success("Hlavi initialized successfully! 🎉");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to initialize Hlavi");
    },
  });
}
