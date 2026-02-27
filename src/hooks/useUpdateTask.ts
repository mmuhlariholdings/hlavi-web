import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Task } from "@/lib/types";
import toast from "react-hot-toast";

interface UpdateTaskParams {
  owner: string;
  repo: string;
  taskId: string;
  updates: Partial<Task>;
}

interface UpdateTaskResponse {
  task: Task;
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      owner,
      repo,
      taskId,
      updates,
    }: UpdateTaskParams): Promise<UpdateTaskResponse> => {
      const response = await fetch(`/api/github/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ owner, repo, updates }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update task");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch tasks list
      queryClient.invalidateQueries({
        queryKey: ["tasks", variables.owner, variables.repo],
      });

      // Invalidate and refetch the specific task
      queryClient.invalidateQueries({
        queryKey: ["task", variables.owner, variables.repo, variables.taskId],
      });

      // Show success toast
      toast.success("Task updated successfully");
    },
    onError: (error: Error) => {
      // Show error toast
      toast.error(error.message || "Failed to update task");
    },
  });
}
