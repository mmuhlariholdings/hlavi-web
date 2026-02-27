"use client";

import React, { useEffect, useRef } from "react";
import { Timeline } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.css";
import { Task } from "@/lib/types";
import { useRouter } from "next/navigation";

interface TimelineViewProps {
  tasks: Task[];
}

export function TimelineView({ tasks }: TimelineViewProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstance = useRef<Timeline | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!timelineRef.current) return;

    // Filter tasks with dates
    const tasksWithDates = tasks.filter(
      (task) => task.start_date || task.end_date
    );

    if (tasksWithDates.length === 0) {
      return;
    }

    // Prepare data items
    const items = tasksWithDates.map((task) => {
      const startDate = task.start_date
        ? new Date(task.start_date)
        : task.end_date
        ? new Date(task.end_date)
        : new Date();

      const endDate = task.end_date
        ? new Date(task.end_date)
        : task.start_date
        ? new Date(task.start_date)
        : new Date();

      return {
        id: task.id,
        content: `${task.id}: ${task.title}`,
        start: startDate,
        end: endDate,
        className: `status-${task.status}`,
        title: `${task.id}: ${task.title}\nStatus: ${task.status}\nAC: ${
          task.acceptance_criteria.filter((ac) => ac.completed).length
        }/${task.acceptance_criteria.length}`,
      };
    });

    // Timeline options
    const options = {
      stack: true,
      horizontalScroll: true,
      zoomKey: "ctrlKey" as const,
      maxHeight: "600px",
      orientation: "top" as const,
      tooltip: {
        followMouse: true,
      },
      margin: {
        item: 10,
      },
    };

    // Create timeline
    timelineInstance.current = new Timeline(
      timelineRef.current,
      items,
      options
    );

    // Add click event listener
    timelineInstance.current.on("click", (properties) => {
      if (properties.item) {
        router.push(`/tasks/${properties.item}`);
      }
    });

    // Cleanup
    return () => {
      if (timelineInstance.current) {
        timelineInstance.current.destroy();
      }
    };
  }, [tasks, router]);

  const tasksWithDates = tasks.filter(
    (task) => task.start_date || task.end_date
  );

  if (tasksWithDates.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-700">No tasks with dates found</p>
          <p className="text-sm text-gray-500 mt-2">
            Tasks need start_date or end_date to appear on the timeline
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden bg-white">
        <div ref={timelineRef} className="w-full overflow-x-auto p-2 md:p-4" />
      </div>
      <style jsx global>{`
        .vis-item.status-new {
          background-color: #e5e7eb;
          border-color: #d1d5db;
        }
        .vis-item.status-open {
          background-color: #93c5fd;
          border-color: #3b82f6;
        }
        .vis-item.status-inprogress {
          background-color: #fbbf24;
          border-color: #f59e0b;
        }
        .vis-item.status-pending {
          background-color: #fb923c;
          border-color: #f97316;
        }
        .vis-item.status-review {
          background-color: #a78bfa;
          border-color: #8b5cf6;
        }
        .vis-item.status-done {
          background-color: #86efac;
          border-color: #22c55e;
        }
        .vis-item.status-closed {
          background-color: #9ca3af;
          border-color: #6b7280;
        }
        .vis-item {
          cursor: pointer;
        }
        .vis-item:hover {
          filter: brightness(0.95);
        }
      `}</style>
    </div>
  );
}
