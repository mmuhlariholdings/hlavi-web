"use client";

import { Task, BoardConfig } from "@/lib/types";
import { KanbanColumn } from "./KanbanColumn";

interface KanbanBoardProps {
  tasks: Task[];
  boardConfig: BoardConfig;
}

export function KanbanBoard({ tasks, boardConfig }: KanbanBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {boardConfig.columns.map((column) => {
        const columnTasks = tasks.filter(
          (task) => task.status === column.status
        );

        return (
          <KanbanColumn
            key={column.status}
            column={column}
            tasks={columnTasks}
          />
        );
      })}
    </div>
  );
}
