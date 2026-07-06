"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { Reminder } from "@/types";
import { getDaysUntil, getPriorityBg } from "@/lib/utils";

interface OverdueSectionProps {
  reminders: Reminder[];
  loading?: boolean;
}

export default function OverdueSection({ reminders, loading }: OverdueSectionProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse bg-gray-50 dark:bg-gray-750">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const overdue = reminders.filter(
    (r) => !r.completed && new Date(r.dueDate) < new Date()
  );

  if (overdue.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-3xl mb-2">✅</div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No overdue reminders. Great job!
        </p>
      </div>
    );
  }

  const sorted = [...overdue].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  return (
    <div className="space-y-2">
      {sorted.map((r) => {
        const days = Math.abs(getDaysUntil(r.dueDate));
        return (
          <Link
            key={r._id}
            href={`/dashboard/reminders/${r._id}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors group"
          >
            <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {r.title}
              </p>
              <p className="text-xs text-red-500 dark:text-red-400">
                ❌ Overdue — Due {days} day{days > 1 ? "s" : ""} ago
              </p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityBg(r.priority)}`}>
              {r.priority}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        );
      })}
    </div>
  );
}