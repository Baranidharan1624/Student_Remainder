"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";
import type { Reminder, Priority } from "@/types";
import {
  getMonthDates,
  getWeekDates,
  isSameDay,
  isToday,
  formatTime,
  getPriorityBg,
  getCategoryDotColor,
  cn,
} from "@/lib/utils";

type ViewMode = "monthly" | "weekly" | "daily";

const priorityDotColors: Record<Priority, string> = {
  Low: "bg-green-500",
  Medium: "bg-amber-500",
  High: "bg-red-500",
};

interface CalendarViewProps {
  reminders: Reminder[];
}

export default function CalendarView({ reminders }: CalendarViewProps) {
  const [view, setView] = useState<ViewMode>("monthly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [hoveredReminder, setHoveredReminder] = useState<Reminder | null>(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthDates = getMonthDates(year, month);
  const weekDates = getWeekDates(currentDate);

  const prev = () => {
    if (view === "monthly") {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (view === "weekly") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const next = () => {
    if (view === "monthly") {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (view === "weekly") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const goToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const getRemindersForDate = (date: Date) =>
    reminders.filter((r) => isSameDay(new Date(r.dueDate), date));

  const handleReminderHover = (r: Reminder, e: React.MouseEvent) => {
    setHoveredReminder(r);
    setPopupPos({ x: e.clientX, y: e.clientY });
  };

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthLabel = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {view === "daily"
              ? currentDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })
              : monthLabel}
          </h2>
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            {(["monthly", "weekly", "daily"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  view === v
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                )}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={prev}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Monthly View */}
      {view === "monthly" && (
        <div className="p-4">
          <div className="grid grid-cols-7 gap-px bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
            {dayLabels.map((d) => (
              <div
                key={d}
                className="bg-gray-50 dark:bg-gray-750 p-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400"
              >
                {d}
              </div>
            ))}
            {monthDates.map((date, i) => {
              const dayReminders = getRemindersForDate(date);
              const isCurrentMonth = date.getMonth() === month;
              const today = isToday(date);
              const selected = selectedDate && isSameDay(date, selectedDate);

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "bg-white dark:bg-gray-800 p-1.5 min-h-[80px] text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors relative",
                    !isCurrentMonth && "opacity-40",
                    selected && "ring-2 ring-blue-500 ring-inset"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-medium inline-flex items-center justify-center h-6 w-6 rounded-full",
                      today
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 dark:text-gray-300"
                    )}
                  >
                    {date.getDate()}
                  </span>
                  <div className="mt-0.5 space-y-0.5">
                    {dayReminders.slice(0, 3).map((r) => (
                      <div
                        key={r._id}
                        className="relative"
                        onMouseEnter={(e) => handleReminderHover(r, e)}
                        onMouseLeave={() => setHoveredReminder(null)}
                      >
                        <Link
                          href={`/dashboard/reminders/${r._id}`}
                          className={cn(
                            "block text-[10px] leading-tight px-1 py-0.5 rounded truncate",
                            r.completed
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 line-through"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          )}
                        >
                          {r.title}
                        </Link>
                      </div>
                    ))}
                    {dayReminders.length > 3 && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 px-1">
                        +{dayReminders.length - 3} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly View */}
      {view === "weekly" && (
        <div className="p-4">
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((date) => {
              const dayReminders = getRemindersForDate(date);
              const today = isToday(date);
              return (
                <div key={date.toISOString()} className="space-y-2">
                  <div className={cn("text-center p-2 rounded-lg", today && "bg-blue-600 text-white")}>
                    <p className="text-xs font-medium">{dayLabels[date.getDay()]}</p>
                    <p className="text-lg font-bold">{date.getDate()}</p>
                  </div>
                  <div className="space-y-1">
                    {dayReminders.map((r) => (
                      <Link
                        key={r._id}
                        href={`/dashboard/reminders/${r._id}`}
                        className="block p-2 rounded-lg bg-gray-50 dark:bg-gray-750 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <div className={cn("h-2 w-2 rounded-full flex-shrink-0", priorityDotColors[r.priority])} />
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                            {r.title}
                          </p>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">{formatTime(r.dueDate)}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily View */}
      {view === "daily" && (
        <div className="p-4">
          {(() => {
            const dayReminders = getRemindersForDate(currentDate);
            if (dayReminders.length === 0) {
              return (
                <div className="text-center py-12">
                  <CalendarIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No reminders for this day</p>
                </div>
              );
            }
            return (
              <div className="space-y-2">
                {dayReminders
                  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .map((r) => (
                    <Link
                      key={r._id}
                      href={`/dashboard/reminders/${r._id}`}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                    >
                      <div className="text-center flex-shrink-0 w-16">
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {formatTime(r.dueDate)}
                        </p>
                      </div>
                      <div className={cn("h-10 w-1 rounded-full", getCategoryDotColor(r.category))} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-medium", r.completed ? "line-through text-gray-400" : "text-gray-900 dark:text-gray-100")}>
                          {r.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{r.subject}</p>
                      </div>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getPriorityBg(r.priority))}>
                        {r.priority}
                      </span>
                    </Link>
                  ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Hover Popup */}
      {hoveredReminder && (
        <div
          className="fixed z-50 bg-gray-900 dark:bg-gray-700 text-white rounded-xl shadow-xl p-3 text-sm max-w-xs pointer-events-none"
          style={{ left: popupPos.x + 10, top: popupPos.y - 10 }}
        >
          <p className="font-medium">{hoveredReminder.title}</p>
          {hoveredReminder.subject && (
            <p className="text-xs text-gray-300 mt-1">{hoveredReminder.subject}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getPriorityBg(hoveredReminder.priority))}>
              {hoveredReminder.priority}
            </span>
            <span className="text-xs text-gray-400">{formatTime(hoveredReminder.dueDate)}</span>
          </div>
        </div>
      )}
    </div>
  );
}