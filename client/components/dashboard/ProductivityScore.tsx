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
        <div className="h-20 w-20 rounded-full skeleton" />
      </div>
    );
  }

  const total = stats?.totalReminders || 0;
  const completed = stats?.completed || 0;
  const score = total > 0 ? Math.round((completed / total) * 100) : 0;

  const getColor = (s: number) => {
    if (s >= 75) return "#22C55E";
    if (s >= 50) return "#3B82F6";
    if (s >= 25) return "#F97316";
    return "#EF4444";
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
