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
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
            <div className="space-y-2 ml-4">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No reminders yet</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Create your first reminder to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {activeGroups.map((groupKey) => {
        const items = groups.get(groupKey)!;
        return (
          <div key={groupKey}>
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className={cn(
                "h-2.5 w-2.5 rounded-full",
                groupKey === "today" ? "bg-red-500" :
                groupKey === "tomorrow" ? "bg-amber-500" :
                "bg-blue-500"
              )} />
              {groupLabels[groupKey]}
              <span className="text-xs font-normal text-gray-400 dark:text-gray-500">({items.length})</span>
            </h3>
            <div className="space-y-2 ml-4 pl-4 border-l-2 border-gray-100 dark:border-gray-700">
              {items.map((r) => (
                <Link
                  key={r._id}
                  href={`/dashboard/reminders/${r._id}`}
                  className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group"
                >
                  <div className="text-center flex-shrink-0 w-16">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(r.dueDate).toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {formatTime(r.dueDate)}
                    </p>
                  </div>
                  <div className={cn("h-10 w-1 rounded-full flex-shrink-0", getCategoryDotColor(r.category))} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", r.completed ? "line-through text-gray-400" : "text-gray-900 dark:text-gray-100")}>
                      {r.title}
                    </p>
                    {r.subject && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{r.subject}</p>
                    )}
                  </div>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0", getPriorityBg(r.priority))}>
                    {r.priority}
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
