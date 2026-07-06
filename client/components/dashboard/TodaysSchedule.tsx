"use client";

import Link from "next/link";
import { Clock, CheckCircle2, ArrowRight } from "lucide-react";
import type { Reminder } from "@/types";
import { formatTime, getPriorityBg } from "@/lib/utils";

interface TodaysScheduleProps {
  reminders: Reminder[];
  loading?: boolean;
}

export default function TodaysSchedule({ reminders, loading }: TodaysScheduleProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
            <div className="h-10 w-20 rounded-lg skeleton" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 rounded skeleton" />
              <div className="h-3 w-32 rounded skeleton" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">🎉</div>
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Nothing due today.
        </p>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Enjoy your day.
        </p>
      </div>
    );
  }

  const sorted = [...reminders].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  return (
    <div className="space-y-2">
      {sorted.map((r) => (
        <Link
          key={r._id}
          href={`/dashboard/reminders/${r._id}`}
          className="flex items-center gap-3 p-3 rounded-xl transition-colors group hover:bg-[var(--surface-hover)]"
        >
          <div className="flex-shrink-0 text-center">
            <p className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>
              {formatTime(r.dueDate)}
            </p>
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium truncate ${r.completed ? "line-through" : ""}`}
              style={{ color: r.completed ? "var(--text-tertiary)" : "var(--text-primary)" }}
            >
              {r.title}
            </p>
            {r.subject && (
              <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                {r.subject}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityBg(r.priority)}`}>
              {r.priority}
            </span>
            {r.completed ? (
              <CheckCircle2 className="h-4 w-4" style={{ color: "var(--color-success)" }} />
            ) : (
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-tertiary)" }} />
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
