"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, CalendarDays } from "lucide-react";
import { format, startOfWeek, startOfMonth, startOfYear } from "date-fns";

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onPeriodChange?: (period: "day" | "week" | "month" | "year") => void;
}

type QuickSelectOption = "today" | "tomorrow" | "week" | "month" | "year" | "custom";

export function DateSelector({ selectedDate, onDateChange, onPeriodChange }: DateSelectorProps) {
  const [selectedOption, setSelectedOption] = useState<QuickSelectOption>("today");

  const handleQuickSelect = (option: QuickSelectOption) => {
    setSelectedOption(option);
    const now = new Date();

    switch (option) {
      case "today":
        onDateChange(now);
        onPeriodChange?.("day");
        break;
      case "tomorrow":
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        onDateChange(tomorrow);
        onPeriodChange?.("day");
        break;
      case "week":
        onDateChange(startOfWeek(now));
        onPeriodChange?.("week");
        break;
      case "month":
        onDateChange(startOfMonth(now));
        onPeriodChange?.("month");
        break;
      case "year":
        onDateChange(startOfYear(now));
        onPeriodChange?.("year");
        break;
      case "custom":
        onPeriodChange?.("day");
        // User will use date picker
        break;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Quick select dropdown */}
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-gray-500 hidden sm:block" />
        <select
          value={selectedOption}
          onChange={(e) => handleQuickSelect(e.target.value as QuickSelectOption)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm font-medium text-gray-700"
        >
          <option value="today">Today</option>
          <option value="tomorrow">Tomorrow</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
          <option value="custom">Custom Date</option>
        </select>
      </div>

      {/* Date picker - only show for custom selection */}
      {selectedOption === "custom" && (
        <div className="relative">
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            type="date"
            value={format(selectedDate, "yyyy-MM-dd")}
            onChange={(e) => onDateChange(new Date(e.target.value))}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
          />
        </div>
      )}
    </div>
  );
}
