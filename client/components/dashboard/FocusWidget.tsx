"use client";

import Link from "next/link";
import { Flame, ArrowRight } from "lucide-react";
import type { Reminder } from "@/types";
import { getPriorityBg } from "@/lib/utils";

interface FocusWidgetProps {
  reminders: Reminder[];
  loading?: boolean;
}

export default function FocusWidget({ reminders, loading }: FocusWidgetProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg animate-pulse skeleton" />
        ))}
      </div>
    );
  }

  const highPriority = reminders
    .filter((r) => r.priority === "High" && !r.completed)
    .slice(0, 5);

  if (highPriority.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No high priority tasks</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {highPriority.map((r) => (
        <Link
          key={r._id}
          href={`/dashboard/reminders/${r._id}`}
          className="flex items-center gap-3 p-2.5 rounded-xl transition-colors group hover:bg-[var(--surface-hover)]"
        >
          <Flame className="h-4 w-4 flex-shrink-0" style={{ color: "var(--color-danger)" }} />
          <span className="text-sm font-medium truncate flex-1" style={{ color: "var(--text-primary)" }}>
            {r.title}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityBg(r.priority)}`}>
            {r.priority}
          </span>
          <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-tertiary)" }} />
        </Link>
      ))}
    </div>
  );
}
