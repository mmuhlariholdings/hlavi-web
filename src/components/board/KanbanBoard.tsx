"use client";

import { useState, useEffect, useRef } from "react";
import { Task, BoardConfig, TaskStatus } from "@/lib/types";
import { KanbanColumn } from "./KanbanColumn";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCorners,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";
import { useUpdateTask } from "@/hooks/useUpdateTask";
import { useRepository } from "@/contexts/RepositoryContext";

interface KanbanBoardProps {
  tasks: Task[];
  boardConfig: BoardConfig;
  isRankSort?: boolean;
}

export function KanbanBoard({ tasks, boardConfig, isRankSort = false }: KanbanBoardProps) {
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(
    new Set()
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showMoreLeft, setShowMoreLeft] = useState(false);
  const [showMoreRight, setShowMoreRight] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Local optimistic copy — updated immediately on drop for instant visual feedback.
  // Synced back from the server whenever the tasks prop changes.
  const [optimisticTasks, setOptimisticTasks] = useState<Task[]>(tasks);
  useEffect(() => {
    setOptimisticTasks(tasks);
  }, [tasks]);

  const { owner, repo, branch } = useRepository();
  const updateTask = useUpdateTask();

  // Mouse: 8px movement required to start drag (prevents accidental drags on click)
  // Touch: 250ms hold + 5px tolerance before drag starts (preserves scroll)
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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

  // Track horizontal scroll position to show indicators
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowMoreLeft(scrollLeft > 50);
      setShowMoreRight(scrollLeft + clientWidth < scrollWidth - 50);
    };

    container.addEventListener("scroll", handleScroll);
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

  // When drag is enabled (rank sort), re-sort by rank so the board order is always
  // correct even after optimistic updates. Otherwise, respect the order passed in
  // from the page (which already applied the user's chosen sort option).
  const sortedTasks = isRankSort
    ? [...optimisticTasks].sort((a, b) => {
        const rankDiff = (b.rank ?? 0) - (a.rank ?? 0);
        if (rankDiff !== 0) return rankDiff;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      })
    : optimisticTasks;

  const handleDragStart = (event: DragStartEvent) => {
    const task = optimisticTasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || !owner || !repo) return;
    if (active.id === over.id) return;

    const draggedTask = optimisticTasks.find((t) => t.id === active.id);
    if (!draggedTask) return;

    // Determine target status: over.id is either a column status or a task id
    const isColumnTarget = boardConfig.columns.some(
      (c) => c.status === over.id
    );
    let targetStatus: TaskStatus;
    let overTaskId: string | null = null;

    if (isColumnTarget) {
      targetStatus = over.id as TaskStatus;
    } else {
      const overTask = optimisticTasks.find((t) => t.id === over.id);
      if (!overTask) return;
      targetStatus = overTask.status;
      overTaskId = overTask.id;
    }

    // In non-rank sort modes, only allow cross-column drops (status changes).
    // Within-column reordering is only meaningful when sorted by rank.
    if (!isRankSort && draggedTask.status === targetStatus) return;

    const updates: Partial<Task> = {};

    if (isRankSort) {
      // Sorted tasks in the target column, excluding the dragged card
      const columnTasks = sortedTasks.filter(
        (t) => t.status === targetStatus && t.id !== draggedTask.id
      );

      // Give every task in the column an effective rank based on its visual position.
      // Tasks with rank=0 (never explicitly ranked) get a position-based rank so
      // insertion math always has room to place a card between any two neighbours.
      const effectiveTasks = columnTasks.map((t, i) => ({
        ...t,
        rank: (t.rank ?? 0) !== 0 ? t.rank! : (columnTasks.length - i) * 1000,
      }));

      let newRank: number;

      if (overTaskId) {
        const overIndex = effectiveTasks.findIndex((t) => t.id === overTaskId);
        const below = effectiveTasks[overIndex];
        const above = overIndex > 0 ? effectiveTasks[overIndex - 1] : null;

        if (!above) {
          newRank = below.rank + 1000;
        } else {
          const mid = Math.floor((above.rank + below.rank) / 2);
          newRank = mid !== below.rank ? mid : below.rank + 1;
        }
      } else {
        const lastTask = effectiveTasks[effectiveTasks.length - 1];
        newRank = lastTask ? lastTask.rank - 1000 : 1000;
      }

      updates.rank = newRank;

      setOptimisticTasks((prev) =>
        prev.map((t) =>
          t.id === draggedTask.id
            ? { ...t, rank: newRank, status: targetStatus, updated_at: new Date().toISOString() }
            : t
        )
      );
    } else {
      // Non-rank sort: optimistically move card to the new column
      setOptimisticTasks((prev) =>
        prev.map((t) =>
          t.id === draggedTask.id
            ? { ...t, status: targetStatus, updated_at: new Date().toISOString() }
            : t
        )
      );
    }

    if (draggedTask.status !== targetStatus) {
      updates.status = targetStatus;
    }

    updateTask.mutate({ owner, repo, branch, taskId: draggedTask.id, updates });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="relative">
        {showMoreLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-400/30 z-10 pointer-events-none" />
        )}
        {showMoreRight && (
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gray-400/30 z-10 pointer-events-none" />
        )}

        <div
          ref={scrollContainerRef}
          className="flex flex-row gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0"
        >
          {boardConfig.columns.map((column) => {
            const columnTasks = sortedTasks.filter(
              (task) => task.status === column.status
            );

            return (
              <KanbanColumn
                key={column.status}
                column={column}
                tasks={columnTasks}
                isCollapsed={collapsedColumns.has(column.status)}
                onToggleCollapse={() => toggleColumn(column.status)}
                isDragEnabled={true}
              />
            );
          })}
        </div>
      </div>

      {/* Drag overlay — rendered at pointer position during drag */}
      <DragOverlay>
        {activeTask ? (
          <div className="rotate-2 opacity-90 shadow-2xl">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
