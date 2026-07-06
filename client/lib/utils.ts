import type { Reminder, Priority, Category } from "@/types";

export function formatDate(dateStr: string | Date): string {
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(dateStr: string | Date): string {
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(dateStr: string | Date): string {
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isToday(dateStr: string | Date): boolean {
  const today = new Date();
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

export function isTomorrow(dateStr: string | Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return (
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate()
  );
}

export function isThisWeek(dateStr: string | Date): boolean {
  const now = new Date();
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return d >= startOfWeek && d < endOfWeek;
}

export function isThisMonth(dateStr: string | Date): boolean {
  const now = new Date();
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  );
}

export function isOverdue(dateStr: string | Date, completed: boolean): boolean {
  if (completed) return false;
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return d < new Date();
}

export function isDueToday(dateStr: string | Date): boolean {
  return isToday(dateStr);
}

export function getDaysUntil(dateStr: string | Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = typeof dateStr === "string" ? new Date(dateStr) : new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getRelativeDate(dateStr: string | Date): string {
  const days = getDaysUntil(dateStr);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days < -1) return `${Math.abs(days)} days ago`;
  if (days <= 7) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "long" });
  }
  return formatDate(dateStr);
}

export function getDateGroup(dateStr: string | Date): "today" | "tomorrow" | "thisWeek" | "thisMonth" | "later" {
  if (isToday(dateStr)) return "today";
  if (isTomorrow(dateStr)) return "tomorrow";
  if (isThisWeek(dateStr)) return "thisWeek";
  if (isThisMonth(dateStr)) return "thisMonth";
  return "later";
}

export function groupRemindersByDate(reminders: Reminder[]): Map<string, Reminder[]> {
  const groups = new Map<string, Reminder[]>();
  const sorted = [...reminders].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
  for (const r of sorted) {
    const dateKey = new Date(r.dueDate).toISOString().split("T")[0];
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey)!.push(r);
  }
  return groups;
}

export function getPriorityColor(priority: Priority): string {
  const colors = {
    Low: "text-green-500",
    Medium: "text-amber-500",
    High: "text-red-500",
  };
  return colors[priority];
}

export function getPriorityBg(priority: Priority): string {
  const colors = {
    Low: "bg-green-100 text-green-700",
    Medium: "bg-amber-100 text-amber-700",
    High: "bg-red-100 text-red-700",
  };
  return colors[priority];
}

export function getCategoryColor(category: Category): string {
  const colors: Record<string, string> = {
    Assignment: "bg-blue-100 text-blue-700",
    Exam: "bg-purple-100 text-purple-700",
    Project: "bg-teal-100 text-teal-700",
    Lab: "bg-cyan-100 text-cyan-700",
    Class: "bg-indigo-100 text-indigo-700",
    Personal: "bg-pink-100 text-pink-700",
    Meeting: "bg-orange-100 text-orange-700",
    Other: "bg-gray-100 text-gray-700",
  };
  return colors[category] || "bg-gray-100 text-gray-700";
}

export function getCategoryDotColor(category: Category): string {
  const colors: Record<string, string> = {
    Assignment: "bg-blue-500",
    Exam: "bg-purple-500",
    Project: "bg-teal-500",
    Lab: "bg-cyan-500",
    Class: "bg-indigo-500",
    Personal: "bg-pink-500",
    Meeting: "bg-orange-500",
    Other: "bg-gray-500",
  };
  return colors[category] || "bg-gray-500";
}

export function calculateProductivityScore(
  completed: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function getWeekDates(date: Date = new Date()): Date[] {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export function getMonthDates(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const dates: Date[] = [];
  for (let i = -startOffset; i < totalDays + (7 - lastDay.getDay()); i++) {
    const d = new Date(year, month, 1 + i);
    dates.push(d);
  }
  return dates;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
