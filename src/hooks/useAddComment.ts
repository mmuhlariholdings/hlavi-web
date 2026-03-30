import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Task } from "@/lib/types";
import toast from "react-hot-toast";

interface AddCommentParams {
  owner: string;
  repo: string;
  branch?: string | null;
  taskId: string;
  body: string;
}

interface AddCommentResponse {
  task: Task;
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      owner,
      repo,
      branch,
      taskId,
      body,
    }: AddCommentParams): Promise<AddCommentResponse> => {
      const response = await fetch(`/api/github/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo, branch, body }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add comment");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        ["task", variables.owner, variables.repo, variables.taskId, variables.branch],
        { task: data.task }
      );
      queryClient.setQueryData(
        ["tasks", variables.owner, variables.repo, variables.branch],
        (old: any) => {
          if (!old?.tasks) return old;
          return {
            tasks: old.tasks.map((t: Task) =>
              t.id === variables.taskId ? data.task : t
            ),
          };
        }
      );
      toast.success("Comment added");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add comment");
    },
  });
}
