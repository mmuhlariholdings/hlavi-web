import { useQuery } from "@tanstack/react-query";
import { Repository } from "@/lib/types";

export function useRepositories() {
  return useQuery<{ repositories: Repository[] }>({
    queryKey: ["repositories"],
    queryFn: async () => {
      const res = await fetch("/api/github/repos");
      if (!res.ok) throw new Error("Failed to fetch repositories");
      return res.json();
    },
  });
}
