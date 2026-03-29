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
}

export function KanbanBoard({ tasks, boardConfig }: KanbanBoardProps) {
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(
    new Set()
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showMoreLeft, setShowMoreLeft] = useState(false);
  const [showMoreRight, setShowMoreRight] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const { owner, repo, branch } = useRepository();
  const updateTask = useUpdateTask();

  // Mouse: 8px movement required to start drag (prevents accidental drags)
  // Touch: 250ms hold + 5px tolerance before drag starts (lets scroll work naturally)
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

  // Sort tasks by rank (desc), preserving incoming order for ties (secondary sort
  // already applied by the board page's sortOption).
  const sortedTasks = [...tasks].sort((a, b) => {
    const rankDiff = (b.rank ?? 0) - (a.rank ?? 0);
    if (rankDiff !== 0) return rankDiff;
    return 0; // preserve incoming sort order for equal ranks
  });

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || !owner || !repo) return;
    if (active.id === over.id) return;

    const draggedTask = tasks.find((t) => t.id === active.id);
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
      const overTask = tasks.find((t) => t.id === over.id);
      if (!overTask) return;
      targetStatus = overTask.status;
      overTaskId = overTask.id;
    }

    // Get the sorted task list for the target column, excluding the dragged task
    const columnTasks = sortedTasks.filter(
      (t) => t.status === targetStatus && t.id !== draggedTask.id
    );

    let newRank: number;

    if (overTaskId) {
      const overIndex = columnTasks.findIndex((t) => t.id === overTaskId);
      const taskBelow = columnTasks[overIndex];
      const taskAbove = overIndex > 0 ? columnTasks[overIndex - 1] : null;

      if (!taskAbove) {
        // Dropping at the top — leave plenty of room above for future drags
        newRank = (taskBelow.rank ?? 0) + 1000;
      } else {
        // Dropping between two tasks — sit just above the task below
        newRank = (taskBelow.rank ?? 0) + 1;
      }
    } else {
      // Dropped on the column itself (empty column or below all tasks)
      const lastTask = columnTasks[columnTasks.length - 1];
      newRank = lastTask ? (lastTask.rank ?? 0) - 1 : 0;
    }

    const updates: Partial<Task> = { rank: newRank };
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
              />
            );
          })}
        </div>
      </div>

      {/* Drag overlay renders the card being dragged at pointer position */}
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
