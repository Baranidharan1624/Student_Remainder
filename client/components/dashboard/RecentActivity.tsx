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
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-2.5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
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
    created: { icon: Plus, color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
    updated: { icon: Pencil, color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" },
    completed: { icon: CheckCircle2, color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" },
    deleted: { icon: Trash2, color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((a) => {
        const { icon: Icon, color } = iconMap[a.type];
        return (
          <div key={a.id} className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                {a.type === "created" && "Created "}
                {a.type === "updated" && "Updated "}
                {a.type === "completed" && "Completed "}
                <span className="font-medium">{a.title}</span>
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {formatDateTime(a.timestamp)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}