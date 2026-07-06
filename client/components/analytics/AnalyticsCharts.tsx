"use client";

import { useMemo } from "react";
import type { Reminder, DashboardStatistics } from "@/types";
import ProgressRing from "@/components/ui/ProgressRing";

interface AnalyticsChartsProps {
  reminders: Reminder[];
  stats: DashboardStatistics | null;
  loading?: boolean;
}

function PieChart({ data, size = 160 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="h-40 flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>No data</div>;

  let cumulative = 0;
  const radius = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;

  const slices = data.filter((d) => d.value > 0).map((d) => {
    const start = cumulative;
    cumulative += d.value / total;
    const startAngle = start * 2 * Math.PI - Math.PI / 2;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const largeArc = d.value / total > 0.5 ? 1 : 0;
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    return {
      ...d,
      path: `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
    };
  });

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="flex-shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} className="hover:opacity-80 transition-opacity" />
        ))}
      </svg>
      <div className="space-y-1.5">
        {data.filter((d) => d.value > 0).map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="h-3 w-3 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span style={{ color: "var(--text-secondary)" }}>{d.label}</span>
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data, height = 160 }: { data: { label: string; value: number; color: string }[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{d.value}</span>
          <div
            className="w-full rounded-t-lg transition-all duration-500"
            style={{
              height: `${(d.value / max) * (height - 30)}px`,
              backgroundColor: d.color,
              minHeight: d.value > 0 ? "8px" : "0px",
            }}
          />
          <span className="text-[10px] text-center leading-tight" style={{ color: "var(--text-muted)" }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function LineChart({ data, height = 160, color = "#3b82f6" }: { data: { label: string; value: number }[]; height?: number; color?: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const padding = 20;
  const w = 100;
  const h = height - 30;

  const points = data.map((d, i) => ({
    x: padding + (i / Math.max(data.length - 1, 1)) * (w - padding * 2),
    y: h - (d.value / max) * (h - padding),
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h + 10}`} className="w-full" style={{ height }}>
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#grad-${color.replace("#", "")})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} className="hover:r-4 transition-all" />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {data.map((d, i) => (
          <span key={i} className="text-[9px]" style={{ color: "var(--text-muted)" }}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsCharts({ reminders, stats, loading }: AnalyticsChartsProps) {
  const analytics = useMemo(() => {
    const completed = reminders.filter((r) => r.completed).length;
    const pending = reminders.filter((r) => !r.completed).length;
    const overdue = reminders.filter(
      (r) => !r.completed && new Date(r.dueDate) < new Date()
    ).length;

    const priorityData = [
      { label: "High", value: reminders.filter((r) => r.priority === "High").length, color: "#ef4444" },
      { label: "Medium", value: reminders.filter((r) => r.priority === "Medium").length, color: "#f59e0b" },
      { label: "Low", value: reminders.filter((r) => r.priority === "Low").length, color: "#22c55e" },
    ];

    const categoryMap = new Map<string, number>();
    reminders.forEach((r) => {
      categoryMap.set(r.category, (categoryMap.get(r.category) || 0) + 1);
    });
    const categoryColors = ["#3b82f6", "#8b5cf6", "#14b8a6", "#06b6d4", "#6366f1", "#ec4899", "#f97316", "#6b7280"];
    const categoryData = Array.from(categoryMap.entries()).map(([label, value], i) => ({
      label,
      value,
      color: categoryColors[i % categoryColors.length],
    }));

    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split("T")[0];
      return {
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        value: reminders.filter((r) => r.updatedAt?.startsWith(dateStr) && r.completed).length,
      };
    });

    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return {
        label: d.toLocaleDateString("en-US", { month: "short" }),
        value: reminders.filter((r) => {
          const rd = new Date(r.updatedAt || r.createdAt);
          return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear() && r.completed;
        }).length,
      };
    });

    const total = stats?.totalReminders || reminders.length;
    const completedToday = reminders.filter(
      (r) => r.completed && r.updatedAt?.startsWith(new Date().toISOString().split("T")[0])
    ).length;

    return {
      completionData: [
        { label: "Completed", value: completed, color: "#22c55e" },
        { label: "Pending", value: pending, color: "#f59e0b" },
        { label: "Overdue", value: overdue, color: "#ef4444" },
      ],
      priorityData,
      categoryData,
      weeklyData,
      monthlyData,
      completedToday,
      total,
      completed,
      pending,
    };
  }, [reminders, stats]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl p-6 border animate-pulse"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}
          >
            <div className="h-4 w-32 rounded mb-4" style={{ background: "var(--bg-tertiary)" }} />
            <div className="h-40 rounded" style={{ background: "var(--bg-tertiary)" }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          className="rounded-2xl p-4 border flex justify-center"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}
        >
          <ProgressRing value={analytics.completed} max={analytics.total || 1} label="Completed" color="#22c55e" />
        </div>
        <div
          className="rounded-2xl p-4 border flex justify-center"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}
        >
          <ProgressRing value={analytics.pending} max={analytics.total || 1} label="Pending" color="#f59e0b" />
        </div>
        <div
          className="rounded-2xl p-4 border flex justify-center"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}
        >
          <ProgressRing value={analytics.completedToday} max={7} label="This Week" color="#3b82f6" />
        </div>
        <div
          className="rounded-2xl p-4 border flex justify-center"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}
        >
          <ProgressRing
            value={analytics.total > 0 ? Math.round((analytics.completed / analytics.total) * 30) : 0}
            max={30}
            label="Streak Days"
            color="#8b5cf6"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="rounded-2xl p-6 border"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Completion Distribution</h3>
          <PieChart data={analytics.completionData} />
        </div>

        <div
          className="rounded-2xl p-6 border"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Priority Distribution</h3>
          <BarChart data={analytics.priorityData} />
        </div>

        <div
          className="rounded-2xl p-6 border"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Category Distribution</h3>
          <PieChart data={analytics.categoryData} />
        </div>

        <div
          className="rounded-2xl p-6 border"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Categories</h3>
          <BarChart data={analytics.categoryData} />
        </div>

        <div
          className="rounded-2xl p-6 border"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Weekly Productivity</h3>
          <LineChart data={analytics.weeklyData} color="#3b82f6" />
        </div>

        <div
          className="rounded-2xl p-6 border"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Monthly Productivity</h3>
          <LineChart data={analytics.monthlyData} color="#8b5cf6" />
        </div>
      </div>
    </div>
  );
}
