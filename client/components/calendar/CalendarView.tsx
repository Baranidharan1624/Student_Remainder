"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
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
    <div
      className="rounded-2xl border"
      style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {view === "daily"
              ? currentDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })
              : monthLabel}
          </h2>
          <div
            className="flex items-center rounded-lg p-0.5"
            style={{ background: "var(--bg-tertiary)" }}
          >
            {(["monthly", "weekly", "daily"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  view === v ? "shadow-sm" : ""
                )}
                style={
                  view === v
                    ? { background: "var(--bg-card)", color: "var(--text-primary)" }
                    : { color: "var(--text-muted)" }
                }
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
            style={{ color: "var(--color-primary)" }}
          >
            Today
          </button>
          <button
            onClick={prev}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Monthly View */}
      {view === "monthly" && (
        <div className="p-4">
          <div
            className="grid grid-cols-7 gap-px rounded-xl overflow-hidden"
            style={{ background: "var(--border-default)" }}
          >
            {dayLabels.map((d) => (
              <div
                key={d}
                className="p-2 text-center text-xs font-semibold"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}
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
                    "p-1.5 min-h-[80px] text-left transition-colors relative",
                    !isCurrentMonth && "opacity-40",
                    selected && "ring-2 ring-inset"
                  )}
                  style={{
                    background: "var(--bg-card)",
                    ...(selected ? { "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties : {}),
                  }}
                >
                  <span
                    className={cn(
                      "text-xs font-medium inline-flex items-center justify-center h-6 w-6 rounded-full",
                      today ? "text-white" : ""
                    )}
                    style={
                      today
                        ? { background: "var(--color-primary)" }
                        : { color: "var(--text-secondary)" }
                    }
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
                            r.completed && "line-through"
                          )}
                          style={{
                            background: r.completed ? "var(--color-primary-soft)" : "var(--bg-tertiary)",
                            color: r.completed ? "var(--color-primary)" : "var(--text-secondary)",
                          }}
                        >
                          {r.title}
                        </Link>
                      </div>
                    ))}
                    {dayReminders.length > 3 && (
                      <span className="text-[10px] px-1" style={{ color: "var(--text-muted)" }}>
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
                  <div
                    className={cn("text-center p-2 rounded-lg", today && "text-white")}
                    style={today ? { background: "var(--color-primary)" } : { color: "var(--text-primary)" }}
                  >
                    <p className="text-xs font-medium">{dayLabels[date.getDay()]}</p>
                    <p className="text-lg font-bold">{date.getDate()}</p>
                  </div>
                  <div className="space-y-1">
                    {dayReminders.map((r) => (
                      <Link
                        key={r._id}
                        href={`/dashboard/reminders/${r._id}`}
                        className="block p-2 rounded-lg transition-colors"
                        style={{ background: "var(--bg-tertiary)" }}
                      >
                        <div className="flex items-center gap-1.5">
                          <div className={cn("h-2 w-2 rounded-full flex-shrink-0", priorityDotColors[r.priority])} />
                          <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                            {r.title}
                          </p>
                        </div>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {formatTime(r.dueTime)}
                        </p>
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
                  <CalendarIcon
                    className="h-12 w-12 mx-auto mb-3"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No reminders for this day</p>
                </div>
              );
            }
            return (
              <div className="space-y-2">
                {dayReminders
                  .sort((a, b) => (a.dueTime || "23:59").localeCompare(b.dueTime || "23:59"))
                  .map((r) => (
                    <Link
                      key={r._id}
                      href={`/dashboard/reminders/${r._id}`}
                      className="flex items-center gap-4 p-3 rounded-xl transition-colors"
                      style={{ background: "var(--bg-tertiary)" }}
                    >
                      <div className="text-center flex-shrink-0 w-16">
                        <p className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>
                          {formatTime(r.dueTime)}
                        </p>
                      </div>
                      <div className={cn("h-10 w-1 rounded-full", getCategoryDotColor(r.category))} />
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn("text-sm font-medium", r.completed && "line-through")}
                          style={{ color: r.completed ? "var(--text-muted)" : "var(--text-primary)" }}
                        >
                          {r.title}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{r.subject}</p>
                      </div>
                      <span
                        className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getPriorityBg(r.priority))}
                      >
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
          className="fixed z-50 rounded-xl shadow-xl p-3 text-sm max-w-xs pointer-events-none"
          style={{
            left: popupPos.x + 10,
            top: popupPos.y - 10,
            background: "var(--bg-tooltip)",
            color: "var(--text-tooltip)",
          }}
        >
          <p className="font-medium">{hoveredReminder.title}</p>
          {hoveredReminder.subject && (
            <p className="text-xs mt-1" style={{ color: "var(--text-tooltip-secondary)" }}>
              {hoveredReminder.subject}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getPriorityBg(hoveredReminder.priority))}>
              {hoveredReminder.priority}
            </span>
            <span className="text-xs" style={{ color: "var(--text-tooltip-secondary)" }}>
              {formatTime(hoveredReminder.dueTime)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
