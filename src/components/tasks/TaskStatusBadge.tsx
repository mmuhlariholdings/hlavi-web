import { TaskStatus } from "@/lib/types";

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-gray-100 text-gray-800" },
  open: { label: "Open", className: "bg-blue-100 text-blue-800" },
  inprogress: { label: "In Progress", className: "bg-yellow-100 text-yellow-800" },
  pending: { label: "Pending", className: "bg-orange-100 text-orange-800" },
  review: { label: "Review", className: "bg-purple-100 text-purple-800" },
  done: { label: "Done", className: "bg-green-100 text-green-800" },
  closed: { label: "Closed", className: "bg-gray-200 text-gray-600" },
};

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}
    >
      {config.label}
    </span>
  );
}
