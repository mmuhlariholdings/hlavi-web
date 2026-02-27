import { Task } from "@/lib/types";
import { TaskCard } from "@/components/board/TaskCard";

interface AgendaSectionProps {
  title: string;
  tasks: Task[];
  icon?: React.ReactNode;
  emptyMessage?: string;
  variant?: "default" | "warning" | "success";
}

export function AgendaSection({
  title,
  tasks,
  icon,
  emptyMessage = "No tasks",
  variant = "default",
}: AgendaSectionProps) {
  const variantStyles = {
    default: "border-gray-200 bg-gray-50",
    warning: "border-orange-200 bg-orange-50",
    success: "border-green-200 bg-green-50",
  };

  const headerStyles = {
    default: "text-gray-900",
    warning: "text-orange-900",
    success: "text-green-900",
  };

  return (
    <div className={`rounded-lg border ${variantStyles[variant]} p-4`}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className={`font-semibold text-lg ${headerStyles[variant]}`}>
          {title}
        </h3>
        <span
          className={`ml-auto px-2.5 py-0.5 rounded-full text-sm font-medium ${
            variant === "warning"
              ? "bg-orange-200 text-orange-900"
              : variant === "success"
              ? "bg-green-200 text-green-900"
              : "bg-gray-200 text-gray-900"
          }`}
        >
          {tasks.length}
        </span>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
