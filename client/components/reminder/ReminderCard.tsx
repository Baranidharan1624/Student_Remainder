import Link from "next/link";
import {
  Calendar,
  Tag,
  Flag,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Reminder } from "@/types";

interface ReminderCardProps {
  reminder: Reminder;
  onDelete: (id: string) => void;
  viewMode?: "grid" | "list";
}

const priorityColors = {
  Low: "bg-green-100 text-green-700 border-green-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  High: "bg-red-100 text-red-700 border-red-200",
};

const categoryColors: Record<string, string> = {
  Assignment: "bg-blue-100 text-blue-700",
  Exam: "bg-purple-100 text-purple-700",
  Project: "bg-teal-100 text-teal-700",
  Lab: "bg-cyan-100 text-cyan-700",
  Class: "bg-indigo-100 text-indigo-700",
  Personal: "bg-pink-100 text-pink-700",
  Meeting: "bg-orange-100 text-orange-700",
  Other: "bg-gray-100 text-gray-700",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCreatedDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isOverdue(dateStr: string, completed: boolean) {
  if (completed) return false;
  return new Date(dateStr) < new Date();
}

function isDueToday(dateStr: string) {
  const today = new Date();
  const due = new Date(dateStr);
  return (
    due.getFullYear() === today.getFullYear() &&
    due.getMonth() === today.getMonth() &&
    due.getDate() === today.getDate()
  );
}

export default function ReminderCard({
  reminder,
  onDelete,
  viewMode = "grid",
}: ReminderCardProps) {
  const overdue = isOverdue(reminder.dueDate, reminder.completed);
  const dueToday = isDueToday(reminder.dueDate);

  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Status Indicator */}
        <div className="flex-shrink-0">
          {reminder.completed ? (
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          ) : (
            <Clock
              className={`h-6 w-6 ${overdue ? "text-red-500" : "text-amber-500"}`}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={`font-semibold text-gray-900 truncate ${reminder.completed ? "line-through text-gray-400" : ""}`}
            >
              {reminder.title}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${priorityColors[reminder.priority]}`}
            >
              {reminder.priority}
            </span>
          </div>
          {reminder.subject && (
            <p className="text-sm text-gray-500 truncate mb-1">
              {reminder.subject}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full ${categoryColors[reminder.category] || "bg-gray-100 text-gray-700"}`}
            >
              {reminder.category}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(reminder.dueDate)}
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1">
              {reminder.completed ? "✓ Completed" : "○ Pending"}
            </span>
            <span className="text-gray-300">|</span>
            <span>Created {formatCreatedDate(reminder.createdAt)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href={`/dashboard/reminders/${reminder._id}`}
            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            onClick={() => onDelete(reminder._id)}
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Grid view (default)
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {reminder.completed ? (
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
          ) : (
            <Clock
              className={`h-5 w-5 flex-shrink-0 ${overdue ? "text-red-500" : "text-amber-500"}`}
            />
          )}
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${priorityColors[reminder.priority]}`}
          >
            <Flag className="h-3 w-3 mr-1" />
            {reminder.priority}
          </span>
        </div>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[reminder.category] || "bg-gray-100 text-gray-700"}`}
        >
          {reminder.category}
        </span>
      </div>

      {/* Title & Subject */}
      <Link href={`/dashboard/reminders/${reminder._id}`} className="block mb-2">
        <h3
          className={`font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors ${reminder.completed ? "line-through text-gray-400" : ""}`}
        >
          {reminder.title}
        </h3>
      </Link>
      {reminder.subject && (
        <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
          <Tag className="h-3 w-3" />
          {reminder.subject}
        </p>
      )}
      {reminder.description && (
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">
          {reminder.description}
        </p>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span
            className={`font-medium ${overdue ? "text-red-500" : dueToday ? "text-blue-600" : ""}`}
          >
            {overdue
              ? "Overdue"
              : dueToday
                ? "Due Today"
                : formatDate(reminder.dueDate)}
          </span>
          <span className="text-gray-300">|</span>
          <span>{reminder.completed ? "✓ Completed" : "○ Pending"}</span>
          <span className="text-gray-300">|</span>
          <span>Created {formatCreatedDate(reminder.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/dashboard/reminders/${reminder._id}`}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            onClick={() => onDelete(reminder._id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Skeleton variant
export function ReminderCardSkeleton({ viewMode = "grid" }: { viewMode?: "grid" | "list" }) {
  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 animate-pulse flex items-center gap-4">
        <div className="h-6 w-6 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-48 bg-gray-200 rounded" />
          <div className="h-3 w-32 bg-gray-200 rounded" />
        </div>
        <div className="h-6 w-16 bg-gray-200 rounded-full" />
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-5 bg-gray-200 rounded-full" />
        <div className="h-6 w-16 bg-gray-200 rounded-full" />
      </div>
      <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-1/2 bg-gray-200 rounded mb-3" />
      <div className="h-3 w-full bg-gray-200 rounded mb-2" />
      <div className="h-3 w-2/3 bg-gray-200 rounded" />
    </div>
  );
}
