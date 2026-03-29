"use client";

import { Task, BoardColumn } from "@/lib/types";
import { SortableTaskCard } from "./TaskCard";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface KanbanColumnProps {
  column: BoardColumn;
  tasks: Task[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function KanbanColumn({
  column,
  tasks,
  isCollapsed = false,
  onToggleCollapse,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status });

  return (
    <div className="min-w-full md:min-w-0 md:flex-shrink-0 md:w-80">
      <div
        className={`bg-gray-100 rounded-lg p-4 border transition-colors ${
          isOver ? "border-blue-400 bg-blue-50" : "border-gray-300"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">{column.name}</h3>
          <div className="flex items-center gap-2">
            <span className="bg-gray-200 rounded-full px-3 py-1 text-sm font-medium">
              {tasks.length}
            </span>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="md:hidden p-1 hover:bg-gray-200 rounded transition-colors"
                aria-label={isCollapsed ? "Expand column" : "Collapse column"}
              >
                {isCollapsed ? (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                )}
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-gray-300 mb-3" />

        <div
          className={`space-y-3 transition-all duration-300 ease-in-out overflow-hidden ${
            isCollapsed ? "max-h-0 opacity-0" : "max-h-[5000px] opacity-100"
          }`}
        >
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div ref={setNodeRef} className="min-h-[2px]">
              {tasks.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No tasks
                </p>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="mb-3 last:mb-0">
                    <SortableTaskCard task={task} />
                  </div>
                ))
              )}
            </div>
          </SortableContext>
        </div>
      </div>
    </div>
  );
}
