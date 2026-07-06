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
        },
        {
          label: "Due Today",
          value: stats.dueToday,
          icon: Clock,
          color: "from-amber-500 to-amber-600",
        },
        {
          label: "Upcoming",
          value: stats.totalReminders - stats.completed - stats.pending,
          icon: CalendarClock,
          color: "from-indigo-500 to-indigo-600",
        },
        {
          label: "Overdue",
          value: stats.overdue,
          icon: AlertTriangle,
          color: "from-red-500 to-red-600",
        },
        {
          label: "Completed",
          value: stats.completed,
          icon: CheckCircle2,
          color: "from-emerald-500 to-emerald-600",
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border p-4 animate-pulse"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-default)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl skeleton" />
              <div className="space-y-1.5">
                <div className="h-3 w-16 rounded skeleton" />
                <div className="h-6 w-8 rounded skeleton" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-2xl border p-4 card-hover shadow-[var(--shadow-sm)] animate-fade-in"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-default)",
              animationDelay: `${idx * 50}ms`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center flex-shrink-0 shadow-lg`}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  {card.label}
                </p>
                <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
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
