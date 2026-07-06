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
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
            <div className="h-8 w-8 rounded-lg skeleton" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-40 rounded skeleton" />
              <div className="h-3 w-24 rounded skeleton" />
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
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
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
            className="flex items-center gap-3 p-3 rounded-xl transition-colors group"
            style={{ background: "var(--color-danger-light)" }}
          >
            <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--color-danger)", opacity: 0.15 }}>
              <AlertTriangle className="h-4 w-4" style={{ color: "var(--color-danger)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                {r.title}
              </p>
              <p className="text-xs" style={{ color: "var(--color-danger)" }}>
                Overdue — Due {days} day{days > 1 ? "s" : ""} ago
              </p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityBg(r.priority)}`}>
              {r.priority}
            </span>
            <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-tertiary)" }} />
          </Link>
        );
      })}
    </div>
  );
}
