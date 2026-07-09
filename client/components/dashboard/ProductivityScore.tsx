"use client";

import type { DashboardStatistics } from "@/types";

interface ProductivityScoreProps {
  stats: DashboardStatistics | null;
  loading?: boolean;
}

export default function ProductivityScore({ stats, loading }: ProductivityScoreProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-6 animate-pulse">
        <div className="h-24 w-24 rounded-full skeleton mb-3" />
        <div className="h-3.5 w-20 rounded skeleton" />
      </div>
    );
  }

  const total = stats?.totalReminders || 0;
  const completed = stats?.completed || 0;
  const score = total > 0 ? Math.round((completed / total) * 100) : 0;

  const size = 104;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getGradient = (s: number) => {
    if (s >= 75) return { start: "#10B981", end: "#059669", label: "Excellent", message: `You completed ${completed} of today's reminders.` };
    if (s >= 50) return { start: "#3B82F6", end: "#2563EB", label: "Good Work", message: `You completed ${completed} of ${total} reminders.` };
    if (s >= 25) return { start: "#F59E0B", end: "#D97706", label: "Keep Going", message: `You completed ${completed} of ${total} reminders.` };
    return { start: "#EF4444", end: "#DC2626", label: "Just Started", message: "Complete more reminders to improve." };
  };

  const gradient = getGradient(score);
  const gradientId = `ring-gradient-${gradient.start.replace('#', '')}`;

  return (
    <div className="flex flex-col items-center py-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={gradient.start} />
              <stop offset="100%" stopColor={gradient.end} />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--bg-tertiary)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold leading-none" style={{ color: "var(--text-primary)" }}>
            {score}%
          </span>
        </div>
      </div>
      <p className="text-xs font-bold mt-2.5" style={{ color: "var(--text-primary)" }}>
        {gradient.label}
      </p>
      <p className="text-[11px] text-center mt-1 px-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {gradient.message}
      </p>
    </div>
  );
}
