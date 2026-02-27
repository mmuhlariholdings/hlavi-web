import { useQuery } from "@tanstack/react-query";

interface BranchesResponse {
  branches: Array<{ name: string }>;
  defaultBranch: string;
}

export function useBranches(owner: string, repo: string) {
  return useQuery<BranchesResponse>({
    queryKey: ["branches", owner, repo],
    queryFn: async () => {
      const params = new URLSearchParams({ owner, repo });
      const res = await fetch(`/api/github/branches?${params}`);
      if (!res.ok) throw new Error("Failed to fetch branches");
      return res.json();
    },
    enabled: !!owner && !!repo,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
