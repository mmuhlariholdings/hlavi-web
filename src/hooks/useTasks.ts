import { useQuery } from "@tanstack/react-query";
import { Task } from "@/lib/types";

export function useTasks(owner: string, repo: string, branch?: string | null) {
  return useQuery<{ tasks: Task[] }>({
    queryKey: ["tasks", owner, repo, branch],
    queryFn: async () => {
      const params = new URLSearchParams({
        owner,
        repo,
        ...(branch && { branch }),
      });
      const res = await fetch(`/api/github/tasks?${params}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
    enabled: !!owner && !!repo,
  });
}

export function useTask(owner: string, repo: string, taskId: string, branch?: string | null) {
  return useQuery<{ task: Task }>({
    queryKey: ["task", owner, repo, taskId, branch],
    queryFn: async () => {
      const params = new URLSearchParams({
        owner,
        repo,
        taskId,
        ...(branch && { branch }),
      });
      const res = await fetch(`/api/github/tasks?${params}`);
      if (!res.ok) throw new Error("Failed to fetch task");
      return res.json();
    },
    enabled: !!owner && !!repo && !!taskId,
  });
}
