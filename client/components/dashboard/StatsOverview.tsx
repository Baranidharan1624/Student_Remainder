"use client";

import { useState, useEffect, useRef } from "react";
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

function AnimatedCounter({ value, delay = 0 }: { value: number; delay?: number }) {
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number>(0);
  const prevValueRef = useRef(0);

  useEffect(() => {
    const startVal = prevValueRef.current;
    const endVal = value;
    if (startVal === endVal) return;

    const duration = 800;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime - delay;
      if (elapsed < 0) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * eased);
      setDisplayed(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = endVal;
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, delay]);

  return <span ref={useRef(null)}>{displayed}</span>;
}

export default function StatsOverview({ stats, loading }: StatsOverviewProps) {
  const cards = stats
    ? [
        {
          label: "Total",
          value: stats.totalReminders,
          icon: ClipboardList,
          lightBg: "rgba(37, 99, 235, 0.07)",
          iconColor: "#3B82F6",
        },
        {
          label: "Due Today",
          value: stats.dueToday,
          icon: Clock,
          lightBg: "rgba(245, 158, 11, 0.07)",
          iconColor: "#F59E0B",
        },
        {
          label: "Upcoming",
          value: stats.totalReminders - stats.completed - stats.pending,
          icon: CalendarClock,
          lightBg: "rgba(139, 92, 246, 0.07)",
          iconColor: "#8B5CF6",
        },
        {
          label: "Overdue",
          value: stats.overdue,
          icon: AlertTriangle,
          lightBg: "rgba(239, 68, 68, 0.07)",
          iconColor: "#EF4444",
        },
        {
          label: "Completed",
          value: stats.completed,
          icon: CheckCircle2,
          lightBg: "rgba(16, 185, 129, 0.07)",
          iconColor: "#10B981",
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border px-4 py-3.5 animate-pulse"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-default)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl skeleton flex-shrink-0" />
              <div className="space-y-1.5">
                <div className="h-6 w-8 rounded skeleton" />
                <div className="h-2.5 w-16 rounded skeleton" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-2xl border px-4 py-3.5 stat-card-hover animate-fade-in"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-default)",
              boxShadow: "var(--shadow-sm)",
              animationDelay: `${idx * 60}ms`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: card.lightBg }}
              >
                <Icon className="h-4.5 w-4.5" style={{ color: card.iconColor }} />
              </div>
              <div className="min-w-0">
                <p
                  className="text-2xl font-extrabold tracking-tight leading-none"
                  style={{ color: "var(--text-primary)" }}
                >
                  <AnimatedCounter value={card.value} delay={idx * 80} />
                </p>
                <p className="text-[11px] font-medium mt-1 leading-none" style={{ color: "var(--text-tertiary)" }}>
                  {card.label}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
