import { Task, BoardColumn } from "@/lib/types";
import { TaskCard } from "./TaskCard";

interface KanbanColumnProps {
  column: BoardColumn;
  tasks: Task[];
}

export function KanbanColumn({ column, tasks }: KanbanColumnProps) {
  return (
    <div className="w-full md:flex-shrink-0 md:w-80">
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{column.name}</h3>
          <span className="bg-gray-200 rounded-full px-3 py-1 text-sm font-medium">
            {tasks.length}
          </span>
        </div>
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No tasks
            </p>
          ) : (
            tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
