import { type LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  shadow?: string;
}

export default function StatsCard({
  label,
  value,
  icon: Icon,
  color,
}: StatsCardProps) {
  return (
    <div
      className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-default)] p-5 transition-all duration-200 card-hover shadow-[var(--shadow-sm)]"
    >
      <div className="flex items-center gap-4">
        <div
          className={`h-12 w-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-lg`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            {label}
          </p>
          <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

// Skeleton variant for loading state
export function StatsCardSkeleton() {
  return (
    <div
      className="rounded-2xl border p-5 animate-pulse"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-default)",
      }}
    >
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl skeleton" />
        <div className="space-y-2">
          <div className="h-3 w-20 rounded skeleton" />
          <div className="h-7 w-12 rounded skeleton" />
        </div>
      </div>
    </div>
  );
}
