import { useQuery } from "@tanstack/react-query";
import { Task } from "@/lib/types";

export function useTasks(owner: string, repo: string) {
  return useQuery<{ tasks: Task[] }>({
    queryKey: ["tasks", owner, repo],
    queryFn: async () => {
      const res = await fetch(
        `/api/github/tasks?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
      );
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
    enabled: !!owner && !!repo,
  });
}

export function useTask(owner: string, repo: string, taskId: string) {
  return useQuery<{ task: Task }>({
    queryKey: ["task", owner, repo, taskId],
    queryFn: async () => {
      const res = await fetch(
        `/api/github/tasks?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&taskId=${encodeURIComponent(taskId)}`
      );
      if (!res.ok) throw new Error("Failed to fetch task");
      return res.json();
    },
    enabled: !!owner && !!repo && !!taskId,
  });
}
