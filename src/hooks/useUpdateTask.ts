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
    onMutate: async (variables) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: ["task", variables.owner, variables.repo, variables.taskId],
      });
      await queryClient.cancelQueries({
        queryKey: ["tasks", variables.owner, variables.repo],
      });

      // Snapshot previous values
      const previousTask = queryClient.getQueryData([
        "task",
        variables.owner,
        variables.repo,
        variables.taskId,
      ]);
      const previousTasks = queryClient.getQueryData([
        "tasks",
        variables.owner,
        variables.repo,
      ]);

      // Optimistically update individual task
      queryClient.setQueryData(
        ["task", variables.owner, variables.repo, variables.taskId],
        (old: any) => {
          if (!old?.task) return old;
          return {
            task: {
              ...old.task,
              ...variables.updates,
              updated_at: new Date().toISOString(),
            },
          };
        }
      );

      // Optimistically update tasks list
      queryClient.setQueryData(
        ["tasks", variables.owner, variables.repo],
        (old: any) => {
          if (!old?.tasks) return old;
          return {
            tasks: old.tasks.map((task: Task) =>
              task.id === variables.taskId
                ? {
                    ...task,
                    ...variables.updates,
                    updated_at: new Date().toISOString(),
                  }
                : task
            ),
          };
        }
      );

      // Return context with previous values
      return { previousTask, previousTasks };
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch to ensure consistency with server
      queryClient.invalidateQueries({
        queryKey: ["tasks", variables.owner, variables.repo],
      });
      queryClient.invalidateQueries({
        queryKey: ["task", variables.owner, variables.repo, variables.taskId],
      });

      // Show success toast
      toast.success("Task updated successfully");
    },
    onError: (error: Error, variables, context: any) => {
      // Rollback optimistic updates on error
      if (context?.previousTask) {
        queryClient.setQueryData(
          ["task", variables.owner, variables.repo, variables.taskId],
          context.previousTask
        );
      }
      if (context?.previousTasks) {
        queryClient.setQueryData(
          ["tasks", variables.owner, variables.repo],
          context.previousTasks
        );
      }

      // Show error toast
      toast.error(error.message || "Failed to update task");
    },
  });
}
