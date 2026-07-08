"use client";

import Link from "next/link";
import { ArrowRight, Clock, Hourglass } from "lucide-react";
import type { Reminder } from "@/types";
import { getRelativeDate, getPriorityBg, getCategoryDotColor, formatTime, getCountdownText } from "@/lib/utils";
import { useCountdown } from "@/hooks/useCountdown";

interface UpcomingSectionProps {
  reminders: Reminder[];
  loading?: boolean;
}

export default function UpcomingSection({ reminders, loading }: UpcomingSectionProps) {
  useCountdown(); // Re-render every minute for countdown

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-3 w-24 rounded mb-2 skeleton" />
            <div className="space-y-2">
              <div className="h-10 rounded-lg skeleton" />
              <div className="h-10 rounded-lg skeleton" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
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
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
            {getRelativeDate(date)}
          </p>
          <div className="space-y-1.5">
            {items.map((r) => (
              <Link
                key={r._id}
                href={`/dashboard/reminders/${r._id}`}
                className="flex items-center gap-3 p-2.5 rounded-xl transition-colors group hover:bg-[var(--surface-hover)]"
              >
                <div className={`h-2 w-2 rounded-full flex-shrink-0 ${getCategoryDotColor(r.category)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate mb-1" style={{ color: "var(--text-primary)" }}>
                    {r.title}
                  </p>
                  <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {r.dueTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(r.dueTime)}
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-medium" style={{ color: "var(--text-secondary)" }}>
                      <Hourglass className="h-3 w-3" />
                      {getCountdownText(r.dueDate, r.dueTime, r.completed)}
                    </span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityBg(r.priority)}`}>
                  {r.priority}
                </span>
                <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-tertiary)" }} />
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
