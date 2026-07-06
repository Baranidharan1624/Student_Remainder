"use client";

import ProgressRing from "@/components/ui/ProgressRing";
import type { DashboardStatistics } from "@/types";

interface ProductivityScoreProps {
  stats: DashboardStatistics | null;
  loading?: boolean;
}

export default function ProductivityScore({ stats, loading }: ProductivityScoreProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 animate-pulse">
        <div className="h-20 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
    );
  }

  const total = stats?.totalReminders || 0;
  const completed = stats?.completed || 0;
  const score = total > 0 ? Math.round((completed / total) * 100) : 0;

  const getColor = (s: number) => {
    if (s >= 75) return "#22c55e";
    if (s >= 50) return "#3b82f6";
    if (s >= 25) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="flex items-center justify-center py-4">
      <ProgressRing
        value={score}
        size={100}
        strokeWidth={8}
        color={getColor(score)}
        label="Productivity Score"
      />
    </div>
  );
}