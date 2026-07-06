"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Reminder } from "@/types";
import { getDateGroup, formatTime, getPriorityBg, getCategoryDotColor, cn } from "@/lib/utils";

interface TimelineViewProps {
  reminders: Reminder[];
  loading?: boolean;
}

const groupLabels = {
  today: "Today",
  tomorrow: "Tomorrow",
  thisWeek: "This Week",
  thisMonth: "This Month",
  later: "Later",
};

const groupOrder: Array<keyof typeof groupLabels> = ["today", "tomorrow", "thisWeek", "thisMonth", "later"];

export default function TimelineView({ reminders, loading }: TimelineViewProps) {
  if (loading) {
    return (
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 w-24 rounded mb-3" style={{ background: "var(--bg-tertiary)" }} />
            <div className="space-y-2 ml-4">
              <div className="h-16 rounded-xl" style={{ background: "var(--bg-tertiary)" }} />
              <div className="h-16 rounded-xl" style={{ background: "var(--bg-tertiary)" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const sorted = [...reminders].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const groups = new Map<string, Reminder[]>();
  for (const r of sorted) {
    const group = getDateGroup(r.dueDate);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(r);
  }

  const activeGroups = groupOrder.filter((g) => groups.get(g)?.length);

  if (activeGroups.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">📋</div>
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>No reminders yet</h3>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Create your first reminder to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {activeGroups.map((groupKey) => {
        const items = groups.get(groupKey)!;
        return (
          <div key={groupKey}>
            <h3
              className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
              style={{ color: "var(--text-muted)" }}
            >
              <div
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  groupKey === "today" ? "bg-red-500" :
                  groupKey === "tomorrow" ? "bg-amber-500" :
                  "bg-blue-500"
                )}
              />
              {groupLabels[groupKey]}
              <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                ({items.length})
              </span>
            </h3>
            <div
              className="space-y-2 ml-4 pl-4 border-l-2"
              style={{ borderColor: "var(--border-light)" }}
            >
              {items.map((r) => (
                <Link
                  key={r._id}
                  href={`/dashboard/reminders/${r._id}`}
                  className="flex items-center gap-4 p-4 rounded-xl border transition-all group card-hover"
                  style={{
                    background: "var(--bg-card)",
                    borderColor: "var(--border-default)",
                  }}
                >
                  <div className="text-center flex-shrink-0 w-16">
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {new Date(r.dueDate).toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                    <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      {formatTime(r.dueDate)}
                    </p>
                  </div>
                  <div className={cn("h-10 w-1 rounded-full flex-shrink-0", getCategoryDotColor(r.category))} />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn("text-sm font-medium", r.completed && "line-through")}
                      style={{ color: r.completed ? "var(--text-muted)" : "var(--text-primary)" }}
                    >
                      {r.title}
                    </p>
                    {r.subject && (
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{r.subject}</p>
                    )}
                  </div>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0", getPriorityBg(r.priority))}>
                    {r.priority}
                  </span>
                  <ArrowRight
                    className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    style={{ color: "var(--text-muted)" }}
                  />
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
