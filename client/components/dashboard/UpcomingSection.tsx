"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Reminder } from "@/types";
import { getRelativeDate, getPriorityBg, getCategoryDotColor } from "@/lib/utils";

interface UpcomingSectionProps {
  reminders: Reminder[];
  loading?: boolean;
}

export default function UpcomingSection({ reminders, loading }: UpcomingSectionProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="space-y-2">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No upcoming reminders
        </p>
      </div>
    );
  }

  const grouped = new Map<string, Reminder[]>();
  const sorted = [...reminders]
    .filter((r) => !r.completed)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  for (const r of sorted) {
    const key = new Date(r.dueDate).toISOString().split("T")[0];
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([date, items]) => (
        <div key={date}>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            {getRelativeDate(date)}
          </p>
          <div className="space-y-1.5">
            {items.map((r) => (
              <Link
                key={r._id}
                href={`/dashboard/reminders/${r._id}`}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group"
              >
                <div className={`h-2 w-2 rounded-full flex-shrink-0 ${getCategoryDotColor(r.category)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {r.title}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityBg(r.priority)}`}>
                  {r.priority}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}