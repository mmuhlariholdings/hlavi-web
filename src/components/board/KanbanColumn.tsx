import { Task, BoardColumn } from "@/lib/types";
import { TaskCard } from "./TaskCard";
import { ChevronDown, ChevronUp } from "lucide-react";

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
  return (
    <div className="w-full md:flex-shrink-0 md:w-80">
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">{column.name}</h3>
          <div className="flex items-center gap-2">
            <span className="bg-gray-200 rounded-full px-3 py-1 text-sm font-medium">
              {tasks.length}
            </span>
            {/* Collapse button - only visible on mobile */}
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

        {/* Separator */}
        <div className="border-t border-gray-300 mb-3" />

        <div
          className={`space-y-3 transition-all duration-300 ease-in-out overflow-hidden ${
            isCollapsed ? "max-h-0 opacity-0" : "max-h-[5000px] opacity-100"
          }`}
        >
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No tasks
            </p>
          ) : (
            tasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </div>
      </div>
    </div>
  );
}
