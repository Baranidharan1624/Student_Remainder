"use client";

import {
  ClipboardList,
  Clock,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import type { DashboardStatistics } from "@/types";

interface StatsOverviewProps {
  stats: DashboardStatistics | null;
  loading?: boolean;
}

export default function StatsOverview({ stats, loading }: StatsOverviewProps) {
  const cards = stats
    ? [
        {
          label: "Total Reminders",
          value: stats.totalReminders,
          icon: ClipboardList,
          color: "from-blue-500 to-blue-600",
          shadow: "shadow-blue-500/20",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          text: "text-blue-600 dark:text-blue-400",
        },
        {
          label: "Due Today",
          value: stats.dueToday,
          icon: Clock,
          color: "from-amber-500 to-amber-600",
          shadow: "shadow-amber-500/20",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          text: "text-amber-600 dark:text-amber-400",
        },
        {
          label: "Upcoming",
          value: stats.totalReminders - stats.completed - stats.pending,
          icon: CalendarClock,
          color: "from-indigo-500 to-indigo-600",
          shadow: "shadow-indigo-500/20",
          bg: "bg-indigo-50 dark:bg-indigo-900/20",
          text: "text-indigo-600 dark:text-indigo-400",
        },
        {
          label: "Overdue",
          value: stats.overdue,
          icon: AlertTriangle,
          color: "from-red-500 to-red-600",
          shadow: "shadow-red-500/20",
          bg: "bg-red-50 dark:bg-red-900/20",
          text: "text-red-600 dark:text-red-400",
        },
        {
          label: "Completed",
          value: stats.completed,
          icon: CheckCircle2,
          color: "from-green-500 to-green-600",
          shadow: "shadow-green-500/20",
          bg: "bg-green-50 dark:bg-green-900/20",
          text: "text-green-600 dark:text-green-400",
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-1.5">
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-6 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200 ${card.shadow}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {card.label}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {card.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}