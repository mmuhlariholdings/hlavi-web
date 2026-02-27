import { useQuery } from "@tanstack/react-query";
import { Board, BoardConfig } from "@/lib/types";

const DEFAULT_BOARD_CONFIG: BoardConfig = {
  name: "Default Board",
  columns: [
    { name: "New", status: "new", agent_enabled: false, agent_mode: null },
    { name: "Open", status: "open", agent_enabled: false, agent_mode: null },
    {
      name: "In Progress",
      status: "inprogress",
      agent_enabled: true,
      agent_mode: "unattended",
    },
    {
      name: "Pending",
      status: "pending",
      agent_enabled: false,
      agent_mode: null,
    },
    { name: "Review", status: "review", agent_enabled: false, agent_mode: null },
    { name: "Done", status: "done", agent_enabled: false, agent_mode: null },
    { name: "Closed", status: "closed", agent_enabled: false, agent_mode: null },
  ],
};

export function useBoardConfig(owner: string, repo: string) {
  return useQuery<BoardConfig>({
    queryKey: ["board-config", owner, repo],
    queryFn: async () => {
      const res = await fetch(
        `/api/github/board-config?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
      );
      if (!res.ok) throw new Error("Failed to fetch board config");
      const data: { board: Board | null } = await res.json();
      return data.board?.config || DEFAULT_BOARD_CONFIG;
    },
    enabled: !!owner && !!repo,
  });
}
