import { AcceptanceCriteria } from "@/lib/types";
import { CheckCircle2, Circle } from "lucide-react";

interface AcceptanceCriteriaListProps {
  criteria: AcceptanceCriteria[];
}

export function AcceptanceCriteriaList({ criteria }: AcceptanceCriteriaListProps) {
  if (criteria.length === 0) {
    return (
      <p className="text-gray-500 text-sm">No acceptance criteria defined</p>
    );
  }

  return (
    <div className="space-y-3">
      {criteria.map((criterion) => (
        <div
          key={criterion.id}
          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
        >
          {criterion.completed ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p
              className={`text-sm ${
                criterion.completed
                  ? "text-gray-600 line-through"
                  : "text-gray-900"
              }`}
            >
              {criterion.description}
            </p>
            {criterion.completed_at && (
              <p className="text-xs text-gray-500 mt-1">
                Completed: {new Date(criterion.completed_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
