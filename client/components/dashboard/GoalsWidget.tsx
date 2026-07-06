"use client";

import { Target, TrendingUp } from "lucide-react";
import type { DashboardStatistics } from "@/types";

interface GoalsWidgetProps {
  stats: DashboardStatistics | null;
  loading?: boolean;
}

export default function GoalsWidget({ stats, loading }: GoalsWidgetProps) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 rounded w-full skeleton" />
        <div className="h-4 rounded w-3/4 skeleton" />
      </div>
    );
  }

  const completed = stats?.completed || 0;
  const weeklyGoal = Math.max(7, Math.ceil(completed * 1.2));
  const monthlyGoal = Math.max(30, Math.ceil(completed * 1.5));
  const weeklyProgress = Math.min((completed / weeklyGoal) * 100, 100);
  const monthlyProgress = Math.min((completed / monthlyGoal) * 100, 100);

  return (
    <div className="space-y-5 py-2">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Weekly Goal</span>
          </div>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{completed}/{weeklyGoal}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${weeklyProgress}%` }}
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" style={{ color: "var(--color-success)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Monthly Goal</span>
          </div>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{completed}/{monthlyGoal}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
            style={{ width: `${monthlyProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
