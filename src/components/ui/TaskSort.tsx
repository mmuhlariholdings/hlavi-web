"use client";

import { Task } from "@/lib/types";
import { ArrowUpDown } from "lucide-react";

export type SortOption =
  | "created-newest"
  | "created-oldest"
  | "updated-newest"
  | "updated-oldest"
  | "start-earliest"
  | "start-latest"
  | "end-earliest"
  | "end-latest"
  | "title-asc"
  | "title-desc";

interface TaskSortProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function TaskSort({ value, onChange }: TaskSortProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="task-sort"
        className="text-sm font-medium text-gray-700 flex items-center gap-2"
      >
        <ArrowUpDown className="w-4 h-4" />
        <span className="hidden sm:inline">Sort by:</span>
      </label>
      <select
        id="task-sort"
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      >
        <option value="created-newest">Created (Newest)</option>
        <option value="created-oldest">Created (Oldest)</option>
        <option value="updated-newest">Updated (Newest)</option>
        <option value="updated-oldest">Updated (Oldest)</option>
        <option value="start-earliest">Start Date (Earliest)</option>
        <option value="start-latest">Start Date (Latest)</option>
        <option value="end-earliest">End Date (Earliest)</option>
        <option value="end-latest">End Date (Latest)</option>
        <option value="title-asc">Title (A-Z)</option>
        <option value="title-desc">Title (Z-A)</option>
      </select>
    </div>
  );
}

export function sortTasks(tasks: Task[], sortOption: SortOption): Task[] {
  const sorted = [...tasks];

  switch (sortOption) {
    case "created-newest":
      return sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    case "created-oldest":
      return sorted.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    case "updated-newest":
      return sorted.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    case "updated-oldest":
      return sorted.sort(
        (a, b) =>
          new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      );
    case "start-earliest":
      return sorted.sort((a, b) => {
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return (
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );
      });
    case "start-latest":
      return sorted.sort((a, b) => {
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return (
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        );
      });
    case "end-earliest":
      return sorted.sort((a, b) => {
        if (!a.end_date) return 1;
        if (!b.end_date) return -1;
        return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
      });
    case "end-latest":
      return sorted.sort((a, b) => {
        if (!a.end_date) return 1;
        if (!b.end_date) return -1;
        return new Date(b.end_date).getTime() - new Date(a.end_date).getTime();
      });
    case "title-asc":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "title-desc":
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    default:
      return sorted;
  }
}
