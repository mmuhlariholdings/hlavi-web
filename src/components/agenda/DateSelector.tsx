"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, CalendarDays } from "lucide-react";
import { format, addDays, addWeeks, addMonths, addYears, startOfDay } from "date-fns";

interface DateSelectorProps {
  onDateJump: (date: Date) => void;
}

type QuickSelectOption = "today" | "tomorrow" | "nextWeek" | "nextMonth" | "nextYear" | "custom";

export function DateSelector({ onDateJump }: DateSelectorProps) {
  const [selectedOption, setSelectedOption] = useState<QuickSelectOption | "">("");
  const [customDate, setCustomDate] = useState<Date>(new Date());

  const handleQuickSelect = (option: QuickSelectOption) => {
    const now = startOfDay(new Date());

    switch (option) {
      case "today":
        onDateJump(now);
        break;
      case "tomorrow":
        onDateJump(addDays(now, 1));
        break;
      case "nextWeek":
        onDateJump(addWeeks(now, 1));
        break;
      case "nextMonth":
        onDateJump(addMonths(now, 1));
        break;
      case "nextYear":
        onDateJump(addYears(now, 1));
        break;
      case "custom":
        // User will use date picker
        setSelectedOption(option);
        return;
    }

    // Reset to empty after jumping (except custom)
    setSelectedOption("");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Quick select dropdown */}
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-gray-500 hidden sm:block" />
        <select
          value={selectedOption}
          onChange={(e) => {
            const value = e.target.value as QuickSelectOption;
            handleQuickSelect(value);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm font-medium text-gray-700"
        >
          <option value="">Jump to...</option>
          <option value="today">Today</option>
          <option value="tomorrow">Tomorrow</option>
          <option value="nextWeek">Next Week</option>
          <option value="nextMonth">Next Month</option>
          <option value="nextYear">Next Year</option>
          <option value="custom">Go To Day</option>
        </select>
      </div>

      {/* Date picker - only show for custom selection */}
      {selectedOption === "custom" && (
        <div className="relative">
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            type="date"
            value={format(customDate, "yyyy-MM-dd")}
            onChange={(e) => {
              const newDate = new Date(e.target.value);
              setCustomDate(newDate);
              onDateJump(newDate);
            }}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
          />
        </div>
      )}
    </div>
  );
}
