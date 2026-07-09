"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Circle,
  List as ListIcon,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

type ViewMode = "monthly" | "weekly" | "daily" | "agenda";

const priorityDotColors: Record<Priority, string> = {
  Low: "var(--color-success)",
  Medium: "var(--color-warning)",
  High: "var(--color-danger)",
};

interface CalendarViewProps {
  reminders: Reminder[];
}

export default function CalendarView({ reminders }: CalendarViewProps) {
  const router = useRouter();
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
    if (view === "monthly" || view === "agenda") {
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
    if (view === "monthly" || view === "agenda") {
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
    e.stopPropagation();
    setHoveredReminder(r);
    setPopupPos({ x: e.clientX, y: e.clientY });
  };

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthLabel = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const variants = {
    initial: { opacity: 0, y: 10 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: "easeIn" } }
  };

  return (
    <div
      className="rounded-[24px] overflow-hidden"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-sm)" }}
    >
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b gap-4"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <button
              onClick={prev}
              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-hover)]"
              style={{ color: "var(--text-muted)" }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-[17px] font-extrabold min-w-[130px] text-center" style={{ color: "var(--text-primary)" }}>
              {view === "daily"
                ? currentDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                  })
                : monthLabel}
            </h2>
            <button
              onClick={next}
              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-hover)]"
              style={{ color: "var(--text-muted)" }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all hover:bg-[var(--surface-hover)]"
            style={{ color: "var(--color-primary)" }}
          >
            Today
          </button>
        </div>

        <div
          className="flex items-center rounded-xl p-1"
          style={{ background: "var(--bg-tertiary)" }}
        >
          {(["monthly", "weekly", "daily", "agenda"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize"
              )}
              style={
                view === v
                  ? { background: "var(--bg-card)", color: "var(--text-primary)", boxShadow: "var(--shadow-sm)" }
                  : { color: "var(--text-secondary)", background: "transparent" }
              }
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Inline Legend */}
      <div className="px-5 py-3 border-b flex items-center gap-4 overflow-x-auto" style={{ borderColor: "var(--border-light)" }}>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Circle className="h-2 w-2" style={{ fill: "var(--color-danger)", color: "transparent" }} />
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>High</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Circle className="h-2 w-2" style={{ fill: "var(--color-warning)", color: "transparent" }} />
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Medium</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Circle className="h-2 w-2" style={{ fill: "var(--color-success)", color: "transparent" }} />
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Low</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Circle className="h-2 w-2" style={{ fill: "var(--text-tertiary)", color: "transparent" }} />
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Completed</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          variants={variants}
          initial="initial"
          animate="enter"
          exit="exit"
        >
          {/* Monthly View */}
          {view === "monthly" && (
            <div className="p-4 sm:p-5 bg-[var(--bg-card)]">
              <div
                className="grid grid-cols-7 gap-px rounded-xl overflow-hidden border"
                style={{ background: "var(--border-light)", borderColor: "var(--border-light)" }}
              >
                {dayLabels.map((d) => (
                  <div
                    key={d}
                    className="p-3 text-center text-[11px] font-bold uppercase tracking-wider bg-[var(--bg-tertiary)]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {d}
                  </div>
                ))}
                {monthDates.map((date, i) => {
                  const dayReminders = getRemindersForDate(date);
                  const isCurrentMonth = date.getMonth() === month;
                  const today = isToday(date);
                  const selected = selectedDate && isSameDay(date, selectedDate);
                  
                  const isSaturday = date.getDay() === 6;
                  const isSunday = date.getDay() === 0;

                  // Date specific background
                  let bgCol = "var(--bg-card)";
                  if (selected) bgCol = "var(--bg-tertiary)";
                  else if (isSaturday) bgCol = "rgba(59, 130, 246, 0.02)";
                  else if (isSunday) bgCol = "rgba(239, 68, 68, 0.02)";

                  const dateStr = date.toISOString().split("T")[0];

                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        "p-2 min-h-[110px] text-left transition-all relative group cursor-pointer",
                        !isCurrentMonth && "opacity-40",
                        "hover:-translate-y-0.5 hover:shadow-md hover:z-10"
                      )}
                      style={{
                        background: bgCol,
                        border: "1px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--border-light)";
                        e.currentTarget.style.background = "var(--bg-card)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "transparent";
                        e.currentTarget.style.background = bgCol;
                      }}
                    >
                      
                      <div className="flex justify-between items-start mb-1 relative z-10">
                        {/* Empty day add button */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/reminders/new?date=${dateStr}`);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-muted)] cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </div>

                        <span
                          className={cn(
                            "text-xs font-bold inline-flex items-center justify-center h-6 w-6 rounded-full transition-all"
                          )}
                          style={
                            today
                              ? { background: "var(--color-primary)", color: "white", boxShadow: "0 2px 8px rgba(37,99,235,0.4)" }
                              : selected ? { background: "var(--color-primary-light)", color: "var(--color-primary)" }
                              : { color: "var(--text-secondary)" }
                          }
                        >
                          {date.getDate()}
                        </span>
                      </div>

                      <div className="space-y-1 relative z-10">
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
                                "flex flex-col gap-0.5 px-1.5 py-1.5 rounded-lg transition-all hover:scale-[1.02]",
                                r.completed && "opacity-50"
                              )}
                              style={{
                                background: r.completed ? "var(--bg-tertiary)" : "var(--bg-card)",
                                border: `1px solid ${r.completed ? "transparent" : "var(--border-default)"}`,
                                boxShadow: r.completed ? "none" : "var(--shadow-sm)"
                              }}
                            >
                              <div className="flex items-center gap-1">
                                <Circle className="h-1.5 w-1.5 flex-shrink-0" style={{ fill: r.completed ? "var(--text-tertiary)" : priorityDotColors[r.priority], color: "transparent" }} />
                                <span
                                  className={cn(
                                    "text-[9px] font-bold uppercase tracking-wider truncate",
                                    r.completed && "line-through"
                                  )}
                                  style={{ color: "var(--text-secondary)" }}
                                >
                                  {r.category}
                                </span>
                              </div>
                              <span
                                className={cn(
                                  "text-[10px] font-bold truncate leading-tight",
                                  r.completed && "line-through"
                                )}
                                style={{
                                  color: r.completed ? "var(--text-tertiary)" : "var(--text-primary)",
                                }}
                              >
                                {r.title}
                              </span>
                              {r.dueTime && (
                                <span className="text-[9px] font-medium" style={{ color: "var(--text-muted)" }}>
                                  {formatTime(r.dueTime)}
                                </span>
                              )}
                            </Link>
                          </div>
                        ))}
                        {dayReminders.length > 3 && (
                          <div className="px-1.5 mt-1">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-all hover:bg-[var(--color-primary)] hover:text-white cursor-pointer" style={{ color: "var(--color-primary)", background: "var(--color-primary-light)" }}>
                              +{dayReminders.length - 3} more
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weekly View */}
          {view === "weekly" && (
            <div className="p-4 sm:p-5 bg-[var(--bg-card)]">
              <div className="grid grid-cols-7 gap-3 sm:gap-4">
                {weekDates.map((date) => {
                  const dayReminders = getRemindersForDate(date);
                  const today = isToday(date);
                  return (
                    <div key={date.toISOString()} className="space-y-3">
                      <div
                        className={cn("text-center py-2 rounded-xl transition-all")}
                        style={today ? { background: "var(--color-primary)", color: "white", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" } : { background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                      >
                        <p className={cn("text-[10px] font-bold uppercase tracking-wider opacity-80")}>{dayLabels[date.getDay()]}</p>
                        <p className="text-xl font-extrabold mt-0.5">{date.getDate()}</p>
                      </div>
                      <div className="space-y-2">
                        {dayReminders.map((r) => (
                          <Link
                            key={r._id}
                            href={`/dashboard/reminders/${r._id}`}
                            className="block p-2.5 rounded-xl transition-all hover:-translate-y-0.5"
                            style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-sm)" }}
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <Circle className="h-1.5 w-1.5 flex-shrink-0" style={{ fill: r.completed ? "var(--text-tertiary)" : priorityDotColors[r.priority], color: "transparent" }} />
                                <span className="text-[9px] font-bold uppercase tracking-wider truncate" style={{ color: "var(--text-secondary)" }}>{r.category}</span>
                              </div>
                              <p className={cn("text-[11px] font-bold truncate leading-tight", r.completed && "line-through opacity-60")} style={{ color: "var(--text-primary)" }}>
                                {r.title}
                              </p>
                              {r.dueTime && (
                                <p className="text-[10px] font-medium" style={{ color: "var(--text-secondary)" }}>
                                  {formatTime(r.dueTime)}
                                </p>
                              )}
                            </div>
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
            <div className="p-4 sm:p-5 bg-[var(--bg-card)]">
              {(() => {
                const dayReminders = getRemindersForDate(currentDate);
                if (dayReminders.length === 0) {
                  return (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "var(--bg-tertiary)" }}>
                        <CalendarIcon className="h-8 w-8" style={{ color: "var(--text-muted)" }} />
                      </div>
                      <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>No reminders scheduled</p>
                      <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>You have a free day!</p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-3 max-w-3xl mx-auto">
                    {dayReminders
                      .sort((a, b) => new Date(a.reminderDateTime).getTime() - new Date(b.reminderDateTime).getTime())
                      .map((r) => (
                        <Link
                          key={r._id}
                          href={`/dashboard/reminders/${r._id}`}
                          className="flex items-stretch gap-4 p-4 rounded-2xl transition-all hover:-translate-y-0.5"
                          style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-sm)" }}
                        >
                          <div className="text-center flex-col justify-center flex-shrink-0 w-16 hidden sm:flex">
                            <p className="text-sm font-extrabold" style={{ color: "var(--color-primary)" }}>
                              {formatTime(r.dueTime)}
                            </p>
                          </div>
                          <div className={cn("w-1.5 rounded-full")} style={{ background: priorityDotColors[r.priority] }} />
                          <div className="flex-1 min-w-0 py-1">
                            <p
                              className={cn("text-base font-bold", r.completed && "line-through opacity-60")}
                              style={{ color: "var(--text-primary)" }}
                            >
                              {r.title}
                            </p>
                            {r.subject && (
                              <p className="text-xs font-medium mt-1" style={{ color: "var(--text-secondary)" }}>{r.subject}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2.5">
                              <span
                                className={cn("text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider")}
                                style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                              >
                                {r.category}
                              </span>
                              <span
                                className={cn("text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider", getPriorityBg(r.priority))}
                              >
                                {r.priority}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Agenda View */}
          {view === "agenda" && (
            <div className="p-4 sm:p-5 bg-[var(--bg-card)]">
              {(() => {
                // Group reminders by date string from current month onwards
                const currentMonthStart = new Date(year, month, 1).getTime();
                const upcomingReminders = reminders
                  .filter((r) => new Date(r.dueDate).getTime() >= currentMonthStart)
                  .sort((a, b) => new Date(a.reminderDateTime).getTime() - new Date(b.reminderDateTime).getTime());

                if (upcomingReminders.length === 0) {
                  return (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "var(--bg-tertiary)" }}>
                        <ListIcon className="h-8 w-8" style={{ color: "var(--text-muted)" }} />
                      </div>
                      <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Your agenda is empty</p>
                    </div>
                  );
                }

                // Group by date
                const grouped: Record<string, Reminder[]> = {};
                upcomingReminders.forEach((r) => {
                  const d = new Date(r.dueDate);
                  const key = d.toISOString().split("T")[0]; // YYYY-MM-DD
                  if (!grouped[key]) grouped[key] = [];
                  grouped[key].push(r);
                });

                return (
                  <div className="max-w-3xl mx-auto space-y-8">
                    {Object.entries(grouped).map(([dateStr, items]) => {
                      const d = new Date(dateStr);
                      d.setMinutes(d.getMinutes() + d.getTimezoneOffset()); // Fix UTC offset for display
                      return (
                        <div key={dateStr}>
                          <div className="sticky top-0 z-10 py-2 mb-3 bg-[var(--bg-card)] flex items-baseline gap-2">
                            <h3 className="text-sm font-extrabold uppercase tracking-widest" style={{ color: "var(--color-primary)" }}>
                              {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </h3>
                            <span className="text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>
                              {d.toLocaleDateString("en-US", { weekday: "long" })}
                            </span>
                          </div>
                          <div className="space-y-3 pl-2 sm:pl-4 border-l-2" style={{ borderColor: "var(--border-light)" }}>
                            {items.map((r) => (
                              <Link
                                key={r._id}
                                href={`/dashboard/reminders/${r._id}`}
                                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-2xl transition-all hover:-translate-y-0.5"
                                style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-sm)" }}
                              >
                                <div className="flex items-center gap-2 sm:w-24 flex-shrink-0">
                                  <div className={cn("h-4 w-1 rounded-full")} style={{ background: priorityDotColors[r.priority] }} />
                                  <p className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                                    {formatTime(r.dueTime)}
                                  </p>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={cn("text-sm font-extrabold truncate", r.completed && "line-through opacity-60")}
                                    style={{ color: "var(--text-primary)" }}
                                  >
                                    {r.title}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span
                                    className={cn("text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider")}
                                    style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                                  >
                                    {r.category}
                                  </span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Hover Popup */}
      {hoveredReminder && (
        <div
          className="fixed z-50 rounded-xl shadow-2xl p-3 max-w-xs pointer-events-none transition-opacity duration-200"
          style={{
            left: popupPos.x + 10,
            top: popupPos.y - 10,
            background: "var(--bg-tooltip)",
            color: "var(--text-tooltip)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <p className="text-sm font-bold leading-tight">{hoveredReminder.title}</p>
          {hoveredReminder.subject && (
            <p className="text-xs font-medium mt-1 opacity-80">
              {hoveredReminder.subject}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2.5">
            <span className={cn("text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider", getPriorityBg(hoveredReminder.priority))}>
              {hoveredReminder.priority}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
              {formatTime(hoveredReminder.dueTime)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
