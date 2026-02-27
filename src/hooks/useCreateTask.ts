import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Task } from "@/lib/types";

interface CreateTaskParams {
  owner: string;
  repo: string;
  title: string;
  description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateTaskParams) => {
      const response = await fetch("/api/github/tasks/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create task");
      }

      return response.json() as Promise<{ task: Task }>;
    },
    onSuccess: (data, variables) => {
      // Invalidate tasks list to refresh
      queryClient.invalidateQueries({
        queryKey: ["tasks", variables.owner, variables.repo],
      });

      // Invalidate board config to get updated next_task_number
      queryClient.invalidateQueries({
        queryKey: ["board-config", variables.owner, variables.repo],
      });

      toast.success(`Task ${data.task.id} created successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create task");
    },
  });
}
