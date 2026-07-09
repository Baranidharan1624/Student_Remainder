import Link from "next/link";
import {
  Calendar,
  Tag,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  AlertTriangle,
  Mail,
  Smartphone,
} from "lucide-react";
import type { Reminder } from "@/types";
import { useSmartStatus } from "@/hooks/useSmartStatus";
import { formatTime } from "@/lib/utils";

interface ReminderCardProps {
  reminder: Reminder;
  onDelete: (id: string) => void;
  viewMode?: "grid" | "list";
}

const priorityBorder = {
  Low: "border-l-green-400",
  Medium: "border-l-amber-400",
  High: "border-l-red-400",
};

const categoryColors: Record<string, string> = {
  Assignment: "bg-blue-50 text-blue-600",
  Exam: "bg-purple-50 text-purple-600",
  Project: "bg-teal-50 text-teal-600",
  Lab: "bg-cyan-50 text-cyan-600",
  Class: "bg-indigo-50 text-indigo-600",
  Personal: "bg-pink-50 text-pink-600",
  Meeting: "bg-orange-50 text-orange-600",
  Other: "bg-gray-50 text-gray-600",
};

const statusBadgeStyle: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle2 },
  overdue: { bg: "bg-red-50", text: "text-red-700", icon: AlertTriangle },
  "due-soon": { bg: "bg-amber-50", text: "text-amber-700", icon: Clock },
  "due-30min": { bg: "bg-orange-50", text: "text-orange-700", icon: Clock },
  "due-today": { bg: "bg-blue-50", text: "text-blue-700", icon: Clock },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ReminderCard({
  reminder,
  onDelete,
  viewMode = "grid",
}: ReminderCardProps) {
  const smartStatus = useSmartStatus(reminder.dueDate, reminder.dueTime, reminder.completed);
  const statusStyle = statusBadgeStyle[smartStatus.type];
  const StatusIcon = statusStyle.icon;

  if (viewMode === "list") {
    return (
      <div
        className={`rounded-2xl border p-4 transition-all duration-200 flex flex-col sm:flex-row sm:items-center gap-4 border-l-4 ${
          reminder.completed ? "border-l-emerald-400" : priorityBorder[reminder.priority]
        } hover:shadow-md`}
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-default)",
          borderLeftColor: reminder.completed ? "#34D399" : undefined,
        }}
      >
        {/* Status */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}
          >
            <StatusIcon className="h-3 w-3" />
            {smartStatus.text}
          </span>
          <h3
            className={`font-semibold truncate ${
              reminder.completed ? "line-through" : ""
            }`}
            style={{
              color: reminder.completed
                ? "var(--text-tertiary)"
                : "var(--text-primary)",
            }}
          >
            {reminder.title}
          </h3>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[reminder.category] || "bg-gray-50 text-gray-600"}`}
          >
            {reminder.category}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(reminder.dueDate)}
          </span>
          {reminder.dueTime && (
            <>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(reminder.dueTime)}
              </span>
            </>
          )}
        </div>

        {/* Delivery Status */}
        {reminder.deliveryStatus && (
          <div className="flex items-center gap-2 flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>
            {reminder.notificationMethods?.includes("email") && (
              <span className={`inline-flex items-center p-1 rounded-full ${reminder.deliveryStatus.emailStatus === 'Sent' ? 'text-green-500 bg-green-50' : reminder.deliveryStatus.emailStatus === 'Failed' ? 'text-red-500 bg-red-50' : 'text-gray-400 bg-gray-50'}`} title={`Email: ${reminder.deliveryStatus.emailStatus}`}>
                <Mail className="h-3 w-3" />
              </span>
            )}
            {reminder.notificationMethods?.includes("whatsapp") && (
              <span className={`inline-flex items-center p-1 rounded-full ${reminder.deliveryStatus.whatsappStatus === 'Sent' ? 'text-green-500 bg-green-50' : reminder.deliveryStatus.whatsappStatus === 'Failed' ? 'text-red-500 bg-red-50' : 'text-gray-400 bg-gray-50'}`} title={`WhatsApp: ${reminder.deliveryStatus.whatsappStatus}`}>
                <Smartphone className="h-3 w-3" />
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Link
            href={`/dashboard/reminders/${reminder._id}`}
            className="group relative p-2 rounded-xl transition-colors hover:bg-[var(--surface-hover)]"
            style={{ color: "var(--text-tertiary)" }}
          >
            <Pencil className="h-4 w-4" />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ background: "var(--bg-tooltip)", color: "var(--text-tooltip)" }}
            >
              Edit
            </span>
          </Link>
          <button
            onClick={() => onDelete(reminder._id)}
            className="group relative p-2 rounded-xl transition-colors hover:bg-[var(--color-danger-light)]"
            style={{ color: "var(--text-tertiary)" }}
          >
            <Trash2 className="h-4 w-4" />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ background: "var(--bg-tooltip)", color: "var(--text-tooltip)" }}
            >
              Delete
            </span>
          </button>
        </div>
      </div>
    );
  }

  // Grid view (default)
  return (
    <div
      className={`group rounded-2xl border border-l-4 p-5 transition-all duration-200 flex flex-col ${
        reminder.completed ? "border-l-emerald-400" : priorityBorder[reminder.priority]
      } hover:shadow-lg hover:scale-[1.01]`}
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-default)",
        borderLeftColor: reminder.completed ? "#34D399" : undefined,
      }}
    >
      {/* Top Row: Status Badge + Category */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}
        >
          <StatusIcon className="h-3 w-3" />
          {smartStatus.text}
        </span>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${categoryColors[reminder.category] || "bg-gray-50 text-gray-600"}`}
        >
          {reminder.category}
        </span>
      </div>

      {/* Title */}
      <Link href={`/dashboard/reminders/${reminder._id}`} className="block mb-1.5">
        <h3
          className={`font-semibold line-clamp-2 transition-colors ${
            reminder.completed ? "line-through" : ""
          }`}
          style={{
            color: reminder.completed ? "var(--text-tertiary)" : "var(--text-primary)",
          }}
        >
          {reminder.title}
        </h3>
      </Link>

      {/* Subject */}
      {reminder.subject && (
        <p
          className="text-sm mb-2 flex items-center gap-1.5 line-clamp-1"
          style={{ color: "var(--text-secondary)" }}
        >
          <Tag className="h-3 w-3 flex-shrink-0" />
          {reminder.subject}
        </p>
      )}

      {/* Description */}
      {reminder.description && (
        <p
          className="text-sm mb-3 line-clamp-2"
          style={{ color: "var(--text-tertiary)" }}
        >
          {reminder.description}
        </p>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-3 border-t mt-auto"
        style={{ borderColor: "var(--border-light)" }}
      >
        <div
          className="flex items-center gap-2 text-xs"
          style={{ color: "var(--text-tertiary)" }}
        >
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(reminder.dueDate)}
          </span>
          {reminder.dueTime && (
            <>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(reminder.dueTime)}
              </span>
            </>
          )}
        </div>
        
        {/* Delivery Status */}
        {reminder.deliveryStatus && (
          <div className="flex items-center gap-1.5 ml-2" style={{ color: "var(--text-tertiary)" }}>
            {reminder.notificationMethods?.includes("email") && (
              <span className={`inline-flex items-center p-1 rounded-full ${reminder.deliveryStatus.emailStatus === 'Sent' ? 'text-green-500 bg-green-50' : reminder.deliveryStatus.emailStatus === 'Failed' ? 'text-red-500 bg-red-50' : 'text-gray-400 bg-gray-50'}`} title={`Email: ${reminder.deliveryStatus.emailStatus}`}>
                <Mail className="h-3.5 w-3.5" />
              </span>
            )}
            {reminder.notificationMethods?.includes("whatsapp") && (
              <span className={`inline-flex items-center p-1 rounded-full ${reminder.deliveryStatus.whatsappStatus === 'Sent' ? 'text-green-500 bg-green-50' : reminder.deliveryStatus.whatsappStatus === 'Failed' ? 'text-red-500 bg-red-50' : 'text-gray-400 bg-gray-50'}`} title={`WhatsApp: ${reminder.deliveryStatus.whatsappStatus}`}>
                <Smartphone className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
          <Link
            href={`/dashboard/reminders/${reminder._id}`}
            className="group/btn relative p-1.5 rounded-xl transition-colors hover:bg-[var(--surface-hover)]"
            style={{ color: "var(--text-tertiary)" }}
          >
            <Pencil className="h-4 w-4" />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none"
              style={{ background: "var(--bg-tooltip)", color: "var(--text-tooltip)" }}
            >
              Edit
            </span>
          </Link>
          <button
            onClick={() => onDelete(reminder._id)}
            className="group/btn relative p-1.5 rounded-xl transition-colors hover:bg-[var(--color-danger-light)]"
            style={{ color: "var(--text-tertiary)" }}
          >
            <Trash2 className="h-4 w-4" />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none"
              style={{ background: "var(--bg-tooltip)", color: "var(--text-tooltip)" }}
            >
              Delete
            </span>
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
      <div
        className="rounded-2xl border border-l-4 border-l-gray-200 p-4 animate-pulse flex items-center gap-4"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="h-6 w-20 rounded-full skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-48 rounded skeleton" />
          <div className="h-3 w-32 rounded skeleton" />
        </div>
        <div className="h-6 w-16 rounded-full skeleton" />
      </div>
    );
  }
  return (
    <div
      className="rounded-2xl border border-l-4 border-l-gray-200 p-5 animate-pulse"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-default)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="h-7 w-24 rounded-full skeleton" />
        <div className="h-6 w-20 rounded-full skeleton" />
      </div>
      <div className="h-5 w-3/4 rounded mb-2 skeleton" />
      <div className="h-3 w-1/2 rounded mb-3 skeleton" />
      <div className="h-3 w-full rounded mb-2 skeleton" />
      <div className="h-3 w-2/3 rounded mb-4 skeleton" />
      <div className="border-t pt-3" style={{ borderColor: "var(--border-light)" }}>
        <div className="h-3 w-32 rounded skeleton" />
      </div>
    </div>
  );
}
