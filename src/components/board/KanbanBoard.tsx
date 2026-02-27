"use client";

import { Task, BoardConfig } from "@/lib/types";
import { KanbanColumn } from "./KanbanColumn";

interface KanbanBoardProps {
  tasks: Task[];
  boardConfig: BoardConfig;
}

export function KanbanBoard({ tasks, boardConfig }: KanbanBoardProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 md:overflow-x-auto md:pb-4 -mx-4 px-4 md:mx-0">
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
