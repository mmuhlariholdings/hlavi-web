"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const getWeekStart = () => {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day;
    return new Date(date.setDate(diff));
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Quick filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onDateChange(today)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            format(selectedDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Today
        </button>
        <button
          onClick={() => onDateChange(tomorrow)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            format(selectedDate, "yyyy-MM-dd") === format(tomorrow, "yyyy-MM-dd")
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Tomorrow
        </button>
        <button
          onClick={() => onDateChange(getWeekStart())}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          This Week
        </button>
      </div>

      {/* Date picker */}
      <div className="relative">
        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          type="date"
          value={format(selectedDate, "yyyy-MM-dd")}
          onChange={(e) => onDateChange(new Date(e.target.value))}
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
        />
      </div>
    </div>
  );
}
