"use client";

import { useState, useEffect, useRef } from "react";
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showMoreLeft, setShowMoreLeft] = useState(false);
  const [showMoreRight, setShowMoreRight] = useState(false);

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

  // Track horizontal scroll position to show indicators
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;

      // Show indicator if there's more content to the left (scrolled right at least 50px)
      setShowMoreLeft(scrollLeft > 50);

      // Show indicator if there's more content to the right (not at right edge)
      setShowMoreRight(scrollLeft + clientWidth < scrollWidth - 50);
    };

    container.addEventListener("scroll", handleScroll);
    // Initial check
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, [boardConfig]);

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
    <div className="relative">
      {/* Indicator for more content to the left */}
      {showMoreLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-400/30 z-10 pointer-events-none" />
      )}

      {/* Indicator for more content to the right */}
      {showMoreRight && (
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-gray-400/30 z-10 pointer-events-none" />
      )}

      <div
        ref={scrollContainerRef}
        className="flex flex-row gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0"
      >
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
    </div>
  );
}
