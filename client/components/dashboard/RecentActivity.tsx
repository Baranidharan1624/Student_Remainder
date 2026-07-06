"use client";

import {
  Plus,
  Pencil,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import type { Reminder } from "@/types";
import { formatDateTime } from "@/lib/utils";

interface Activity {
  id: string;
  type: "created" | "updated" | "completed" | "deleted";
  title: string;
  timestamp: string;
}

interface RecentActivityProps {
  reminders: Reminder[];
  loading?: boolean;
}

export default function RecentActivity({ reminders, loading }: RecentActivityProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-full skeleton" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-48 rounded skeleton" />
              <div className="h-2.5 w-32 rounded skeleton" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const activities: Activity[] = reminders
    .slice(0, 8)
    .map((r) => ({
      id: r._id,
      type: r.completed ? "completed" : "created",
      title: r.title,
      timestamp: r.updatedAt || r.createdAt,
    }));

  const iconMap = {
    created: { icon: Plus, bg: "var(--color-primary)", color: "var(--color-primary)" },
    updated: { icon: Pencil, bg: "var(--color-warning-light)", color: "var(--color-warning)" },
    completed: { icon: CheckCircle2, bg: "var(--color-success-light)", color: "var(--color-success)" },
    deleted: { icon: Trash2, bg: "var(--color-danger-light)", color: "var(--color-danger)" },
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((a) => {
        const { icon: Icon, bg, color } = iconMap[a.type];
        return (
          <div key={a.id} className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: bg, opacity: 0.15 }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate" style={{ color: "var(--text-primary)" }}>
                {a.type === "created" && "Created "}
                {a.type === "updated" && "Updated "}
                {a.type === "completed" && "Completed "}
                <span className="font-medium">{a.title}</span>
              </p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {formatDateTime(a.timestamp)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
