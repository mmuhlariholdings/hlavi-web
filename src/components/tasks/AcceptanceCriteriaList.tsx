"use client";

import { AcceptanceCriteria } from "@/lib/types";
import { CheckCircle2, Circle, Trash2 } from "lucide-react";
import {
  useToggleAcceptanceCriteria,
  useDeleteAcceptanceCriteria,
} from "@/hooks/useAcceptanceCriteria";
import { useRepository } from "@/contexts/RepositoryContext";

interface AcceptanceCriteriaListProps {
  taskId: string;
  criteria: AcceptanceCriteria[];
}

export function AcceptanceCriteriaList({
  taskId,
  criteria,
}: AcceptanceCriteriaListProps) {
  const { owner, repo } = useRepository();
  const toggleCriteria = useToggleAcceptanceCriteria();
  const deleteCriteria = useDeleteAcceptanceCriteria();

  const handleToggle = (criteriaId: number) => {
    if (!owner || !repo) return;

    toggleCriteria.mutate({
      owner,
      repo,
      taskId,
      criteriaId,
    });
  };

  const handleDelete = (criteriaId: number) => {
    if (!owner || !repo) return;

    if (
      window.confirm("Are you sure you want to delete this acceptance criteria?")
    ) {
      deleteCriteria.mutate({
        owner,
        repo,
        taskId,
        criteriaId,
      });
    }
  };

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
          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors"
        >
          <button
            onClick={() => handleToggle(criterion.id)}
            className="flex-shrink-0 mt-0.5 hover:opacity-70 transition-opacity"
            disabled={toggleCriteria.isPending}
          >
            {criterion.completed ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400" />
            )}
          </button>

          <div className="flex-1 min-w-0">
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

          <button
            onClick={() => handleDelete(criterion.id)}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
            disabled={deleteCriteria.isPending}
            title="Delete acceptance criteria"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
