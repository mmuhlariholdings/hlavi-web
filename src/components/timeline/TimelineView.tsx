"use client";

import React, { useEffect, useRef, useState } from "react";
import { Timeline } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.css";
import { Task } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Calendar, CalendarRange } from "lucide-react";
import { format } from "date-fns";

interface TimelineViewProps {
  tasks: Task[];
}

const STATUS_CONFIG = {
  new: { color: "#e5e7eb", borderColor: "#9ca3af", label: "New" },
  open: { color: "#dbeafe", borderColor: "#3b82f6", label: "Open" },
  inprogress: { color: "#fef3c7", borderColor: "#f59e0b", label: "In Progress" },
  pending: { color: "#fed7aa", borderColor: "#f97316", label: "Pending" },
  review: { color: "#ede9fe", borderColor: "#8b5cf6", label: "Review" },
  done: { color: "#d1fae5", borderColor: "#10b981", label: "Done" },
  closed: { color: "#f3f4f6", borderColor: "#6b7280", label: "Closed" },
};

export function TimelineView({ tasks }: TimelineViewProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstance = useRef<Timeline | null>(null);
  const router = useRouter();
  const [activeZoom, setActiveZoom] = useState<string>("overall");

  useEffect(() => {
    if (!timelineRef.current) return;

    // Filter tasks with dates
    const tasksWithDates = tasks.filter(
      (task) => task.start_date || task.end_date
    );

    if (tasksWithDates.length === 0) {
      return;
    }

    // Prepare data items with custom HTML content
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

      const completedAC = task.acceptance_criteria.filter((ac) => ac.completed).length;
      const totalAC = task.acceptance_criteria.length;
      const progress = totalAC > 0 ? (completedAC / totalAC) * 100 : 0;

      const statusConfig = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.new;

      return {
        id: task.id,
        content: `
          <div style="padding: 4px 8px; font-size: 13px; font-weight: 500; color: #1f2937;">
            <div style="margin-bottom: 2px;">${task.id}</div>
            <div style="font-size: 11px; font-weight: 400; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">${task.title}</div>
            ${totalAC > 0 ? `
              <div style="margin-top: 4px; height: 3px; background: rgba(0,0,0,0.1); border-radius: 2px; overflow: hidden;">
                <div style="height: 100%; background: ${statusConfig.borderColor}; width: ${progress}%; transition: width 0.3s;"></div>
              </div>
            ` : ''}
          </div>
        `,
        start: startDate,
        end: endDate,
        className: `status-${task.status}`,
        title: `
          <div style="padding: 8px; min-width: 200px;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #111827;">${task.id}: ${task.title}</div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
              <div style="margin-bottom: 2px;"><strong>Status:</strong> ${statusConfig.label}</div>
              <div style="margin-bottom: 2px;"><strong>Start:</strong> ${format(startDate, "MMM d, yyyy")}</div>
              <div style="margin-bottom: 2px;"><strong>End:</strong> ${format(endDate, "MMM d, yyyy")}</div>
            </div>
            ${totalAC > 0 ? `
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                  <strong>Progress:</strong> ${completedAC}/${totalAC} criteria completed
                </div>
                <div style="height: 6px; background: #f3f4f6; border-radius: 3px; overflow: hidden;">
                  <div style="height: 100%; background: ${statusConfig.borderColor}; width: ${progress}%; transition: width 0.3s;"></div>
                </div>
              </div>
            ` : ''}
          </div>
        `,
      };
    });

    // Enhanced timeline options
    const options = {
      stack: true,
      horizontalScroll: true,
      zoomKey: "ctrlKey" as const,
      maxHeight: "600px",
      minHeight: "400px",
      orientation: "top" as const,
      tooltip: {
        followMouse: true,
        overflowMethod: "cap" as const,
      },
      margin: {
        item: {
          horizontal: 10,
          vertical: 8,
        },
      },
      editable: false,
      selectable: true,
      showCurrentTime: true,
      format: {
        minorLabels: {
          day: "D",
          month: "MMM",
          year: "YYYY",
        },
        majorLabels: {
          day: "MMMM YYYY",
          month: "YYYY",
          year: "",
        },
      },
      timeAxis: { scale: "day" as const, step: 1 },
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

  const handleZoom = (type: string) => {
    if (!timelineInstance.current) return;
    setActiveZoom(type);

    const now = new Date();
    let start: Date;
    let end: Date;
    let timeAxisConfig;
    let formatConfig;

    switch (type) {
      case "day":
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
        timeAxisConfig = { scale: "hour" as const, step: 1 };
        formatConfig = {
          minorLabels: {
            hour: "HH:mm",
          },
          majorLabels: {
            hour: "ddd D MMMM",
          },
        };
        break;
      case "week":
        start = new Date(now.setDate(now.getDate() - now.getDay()));
        end = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        timeAxisConfig = { scale: "day" as const, step: 1 };
        formatConfig = {
          minorLabels: {
            day: "D",
          },
          majorLabels: {
            day: "MMMM YYYY",
          },
        };
        break;
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        timeAxisConfig = { scale: "week" as const, step: 1 };
        formatConfig = {
          minorLabels: {
            week: "w",
          },
          majorLabels: {
            week: "MMMM YYYY",
          },
        };
        break;
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        timeAxisConfig = { scale: "month" as const, step: 1 };
        formatConfig = {
          minorLabels: {
            month: "MMM",
          },
          majorLabels: {
            month: "YYYY",
          },
        };
        break;
      case "overall":
        timelineInstance.current.fit();
        // For overall, let vis-timeline auto-determine the best scale
        timelineInstance.current.setOptions({
          timeAxis: { scale: "day" as const, step: 1 },
          format: {
            minorLabels: {
              day: "D",
              month: "MMM",
              year: "YYYY",
            },
            majorLabels: {
              day: "MMMM YYYY",
              month: "YYYY",
              year: "",
            },
          },
        });
        return;
      default:
        return;
    }

    // Update time axis configuration and format
    timelineInstance.current.setOptions({
      timeAxis: timeAxisConfig,
      format: formatConfig,
    });

    timelineInstance.current.setWindow(start, end, { animation: true });
  };

  if (tasksWithDates.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 shadow-sm">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-lg font-semibold text-gray-700">No tasks with dates found</p>
          <p className="text-sm text-gray-500 mt-2">
            Tasks need start_date or end_date to appear on the timeline
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CalendarRange className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{tasksWithDates.length} tasks on timeline</span>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="timeline-zoom" className="text-xs text-gray-500">
            Zoom:
          </label>
          <select
            id="timeline-zoom"
            value={activeZoom}
            onChange={(e) => handleZoom(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
            <option value="overall">Overall</option>
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded border-2 shadow-sm"
                style={{
                  backgroundColor: config.color,
                  borderColor: config.borderColor,
                }}
              />
              <span className="text-xs text-gray-600 font-medium">{config.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <div ref={timelineRef} className="w-full overflow-x-auto p-4" />
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        .vis-item.status-new {
          background-color: ${STATUS_CONFIG.new.color};
          border-color: ${STATUS_CONFIG.new.borderColor};
          border-width: 2px;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .vis-item.status-open {
          background-color: ${STATUS_CONFIG.open.color};
          border-color: ${STATUS_CONFIG.open.borderColor};
          border-width: 2px;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .vis-item.status-inprogress {
          background-color: ${STATUS_CONFIG.inprogress.color};
          border-color: ${STATUS_CONFIG.inprogress.borderColor};
          border-width: 2px;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .vis-item.status-pending {
          background-color: ${STATUS_CONFIG.pending.color};
          border-color: ${STATUS_CONFIG.pending.borderColor};
          border-width: 2px;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .vis-item.status-review {
          background-color: ${STATUS_CONFIG.review.color};
          border-color: ${STATUS_CONFIG.review.borderColor};
          border-width: 2px;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .vis-item.status-done {
          background-color: ${STATUS_CONFIG.done.color};
          border-color: ${STATUS_CONFIG.done.borderColor};
          border-width: 2px;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .vis-item.status-closed {
          background-color: ${STATUS_CONFIG.closed.color};
          border-color: ${STATUS_CONFIG.closed.borderColor};
          border-width: 2px;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .vis-item {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .vis-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15) !important;
          z-index: 100;
        }
        .vis-item.vis-selected {
          box-shadow: 0 0 0 2px #3b82f6 !important;
        }
        .vis-tooltip {
          background: white !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
          color: #111827 !important;
          font-family: inherit !important;
          padding: 0 !important;
        }
        .vis-time-axis .vis-text {
          color: #6b7280 !important;
          font-size: 12px !important;
        }
        .vis-time-axis .vis-text.vis-major {
          font-weight: 600 !important;
        }
        .vis-current-time {
          background-color: #ef4444 !important;
          width: 2px !important;
        }
        .vis-timeline {
          border: none !important;
          font-family: inherit !important;
        }
        .vis-panel.vis-center,
        .vis-panel.vis-top,
        .vis-panel.vis-bottom {
          border-color: #e5e7eb !important;
        }
      `}</style>
    </div>
  );
}
