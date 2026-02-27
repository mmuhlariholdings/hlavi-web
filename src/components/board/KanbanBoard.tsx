"use client";

import { useState, useEffect } from "react";
import { Task, BoardConfig } from "@/lib/types";
import { KanbanColumn } from "./KanbanColumn";

interface KanbanBoardProps {
  tasks: Task[];
  boardConfig: BoardConfig;
}

export function KanbanBoard({ tasks, boardConfig }: KanbanBoardProps) {
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(
    new Set()
  );

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("kanban-collapsed-columns");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCollapsedColumns(new Set(parsed));
      } catch (e) {
        console.error("Failed to parse collapsed columns from localStorage", e);
      }
    }
  }, []);

  // Save collapsed state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      "kanban-collapsed-columns",
      JSON.stringify(Array.from(collapsedColumns))
    );
  }, [collapsedColumns]);

  const toggleColumn = (status: string) => {
    setCollapsedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

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
            isCollapsed={collapsedColumns.has(column.status)}
            onToggleCollapse={() => toggleColumn(column.status)}
          />
        );
      })}
    </div>
  );
}
