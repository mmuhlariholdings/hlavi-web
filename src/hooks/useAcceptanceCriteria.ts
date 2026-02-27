import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Task } from "@/lib/types";
import toast from "react-hot-toast";

interface AddCriteriaParams {
  owner: string;
  repo: string;
  branch?: string | null;
  taskId: string;
  description: string;
}

interface ToggleCriteriaParams {
  owner: string;
  repo: string;
  branch?: string | null;
  taskId: string;
  criteriaId: number;
}

interface DeleteCriteriaParams {
  owner: string;
  repo: string;
  branch?: string | null;
  taskId: string;
  criteriaId: number;
}

interface TaskResponse {
  task: Task;
}

// Hook for adding acceptance criteria
export function useAddAcceptanceCriteria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      owner,
      repo,
      branch,
      taskId,
      description,
    }: AddCriteriaParams): Promise<TaskResponse> => {
      const response = await fetch(
        `/api/github/tasks/${taskId}/acceptance-criteria`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ owner, repo, branch, description }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add acceptance criteria");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate both queries
      queryClient.invalidateQueries({
        queryKey: ["task", variables.owner, variables.repo, variables.taskId, variables.branch],
      });
      queryClient.invalidateQueries({
        queryKey: ["tasks", variables.owner, variables.repo, variables.branch],
      });

      toast.success("Acceptance criteria added");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add acceptance criteria");
    },
  });
}

// Hook for toggling acceptance criteria completion
export function useToggleAcceptanceCriteria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      owner,
      repo,
      branch,
      taskId,
      criteriaId,
    }: ToggleCriteriaParams): Promise<TaskResponse> => {
      const response = await fetch(
        `/api/github/tasks/${taskId}/acceptance-criteria/${criteriaId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ owner, repo, branch }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "Failed to toggle acceptance criteria"
        );
      }

      return response.json();
    },
    onMutate: async (variables) => {
      // Optimistically update
      await queryClient.cancelQueries({
        queryKey: ["task", variables.owner, variables.repo, variables.taskId, variables.branch],
      });

      const previousTask = queryClient.getQueryData([
        "task",
        variables.owner,
        variables.repo,
        variables.taskId,
        variables.branch,
      ]);

      queryClient.setQueryData(
        ["task", variables.owner, variables.repo, variables.taskId, variables.branch],
        (old: any) => {
          if (!old?.task) return old;
          return {
            task: {
              ...old.task,
              acceptance_criteria: old.task.acceptance_criteria.map(
                (ac: any) =>
                  ac.id === variables.criteriaId
                    ? {
                        ...ac,
                        completed: !ac.completed,
                        completed_at: !ac.completed
                          ? new Date().toISOString()
                          : null,
                      }
                    : ac
              ),
            },
          };
        }
      );

      return { previousTask };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["task", variables.owner, variables.repo, variables.taskId, variables.branch],
      });
      queryClient.invalidateQueries({
        queryKey: ["tasks", variables.owner, variables.repo, variables.branch],
      });

      // Find the toggled criteria to show appropriate message
      const toggledCriteria = data.task.acceptance_criteria.find(
        (ac) => ac.id === variables.criteriaId
      );

      if (toggledCriteria) {
        if (toggledCriteria.completed) {
          toast.success("Marked as completed");
        } else {
          toast.success("Marked as incomplete");
        }
      }
    },
    onError: (error: Error, variables, context: any) => {
      if (context?.previousTask) {
        queryClient.setQueryData(
          ["task", variables.owner, variables.repo, variables.taskId, variables.branch],
          context.previousTask
        );
      }
      toast.error(error.message || "Failed to toggle acceptance criteria");
    },
  });
}

// Hook for deleting acceptance criteria
export function useDeleteAcceptanceCriteria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      owner,
      repo,
      branch,
      taskId,
      criteriaId,
    }: DeleteCriteriaParams): Promise<TaskResponse> => {
      const params = new URLSearchParams({
        owner,
        repo,
        ...(branch && { branch }),
      });
      const response = await fetch(
        `/api/github/tasks/${taskId}/acceptance-criteria/${criteriaId}?${params}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete acceptance criteria");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["task", variables.owner, variables.repo, variables.taskId, variables.branch],
      });
      queryClient.invalidateQueries({
        queryKey: ["tasks", variables.owner, variables.repo, variables.branch],
      });

      toast.success("Acceptance criteria deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete acceptance criteria");
    },
  });
}
