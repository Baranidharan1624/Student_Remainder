"use client";

import Link from "next/link";
import { Clock, ArrowRight, MoreHorizontal } from "lucide-react";
import type { Reminder } from "@/types";
import { formatDateTime, getPriorityBg } from "@/lib/utils";

interface RecentlyCreatedProps {
  reminders: Reminder[];
  loading?: boolean;
}

export default function RecentlyCreated({ reminders, loading }: RecentlyCreatedProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
            <div className="h-9 w-9 rounded-xl skeleton flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-36 rounded skeleton" />
              <div className="h-2.5 w-24 rounded skeleton" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const recent = [...reminders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  if (recent.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          No reminders created yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {recent.map((r) => (
        <Link
          key={r._id}
          href={`/dashboard/reminders/${r._id}`}
          className="flex items-center gap-3 p-3 rounded-xl transition-colors group hover:bg-[var(--surface-hover)]"
        >
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--bg-tertiary)" }}
          >
            <Clock className="h-3.5 w-3.5" style={{ color: "var(--text-tertiary)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium truncate leading-snug"
              style={{ color: "var(--text-primary)" }}
            >
              {r.title}
            </p>
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              {r.subject && <span>{r.subject}</span>}
              {r.subject && <span>·</span>}
              <span>{formatDateTime(r.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium leading-none ${getPriorityBg(r.priority)}`}>
              {r.priority}
            </span>
            <button
              className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: "var(--text-tertiary)" }}
              onClick={(e) => e.preventDefault()}
              aria-label="More options"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        </Link>
      ))}

      <Link
        href="/dashboard/reminders"
        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-colors hover:bg-[var(--surface-hover)]"
        style={{ color: "var(--color-primary)" }}
      >
        View All Reminders
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
