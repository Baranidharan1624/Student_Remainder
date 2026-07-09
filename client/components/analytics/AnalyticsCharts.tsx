"use client";

import { useMemo, useEffect, useState } from "react";
import type { Reminder, Priority, DashboardStatistics } from "@/types";
import { isSameDay } from "@/lib/utils";
import { motion, useAnimation, useInView } from "framer-motion";
import { 
  CheckCircle2, 
  TrendingUp, 
  Flame, 
  AlertTriangle,
  Sparkles,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

interface AnalyticsChartsProps {
  reminders: Reminder[];
  stats: DashboardStatistics | null;
  loading?: boolean;
}

const priorityColors: Record<Priority, string> = {
  Low: "var(--color-success)",
  Medium: "var(--color-warning)",
  High: "var(--color-danger)",
};

// --- Custom Hooks & Components ---

function Counter({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }
    let totalDuration = 1000;
    let startTime: number | null = null;
    
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / totalDuration;
      
      if (progress < 1) {
        setCount(Math.round(end * easeOutQuart(progress)));
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };
    requestAnimationFrame(animate);
  }, [value, isInView]);

  return <span ref={ref}>{count}</span>;
}

function AreaChart({ data, color = "#3b82f6" }: { data: { label: string; value: number }[]; color?: string }) {
  if (data.length === 0) return <div className="h-full flex items-center justify-center text-[16px]" style={{ color: "var(--text-muted)" }}>No data available</div>;
  
  const max = Math.max(...data.map((d) => d.value), 1);
  const padding = 32;
  const w = 800; 
  const h = 420;

  const points = data.map((d, i) => ({
    x: padding + (i / Math.max(data.length - 1, 1)) * (w - padding * 2),
    y: h - (d.value / max) * (h - padding * 2) - padding,
  }));

  // Smooth Bezier Curve
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p0.x + (p1.x - p0.x) / 2;
    const cp2y = p1.y;
    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }
  const areaD = `${pathD} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`;

  return (
    <div className="w-full h-full flex flex-col relative group min-h-[420px]">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="grad-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Cleaner Grid Lines */}
        {Array.from({ length: 5 }).map((_, i) => (
          <line 
            key={`grid-${i}`}
            x1={padding} 
            y1={padding + i * ((h - padding * 3) / 4)} 
            x2={w - padding} 
            y2={padding + i * ((h - padding * 3) / 4)} 
            stroke="var(--border-light)" 
            strokeWidth="1" 
            strokeDasharray="4 4"
            className="opacity-50"
          />
        ))}

        <path d={areaD} fill="url(#grad-area)" className="transition-all duration-1000 ease-out" />
        <path d={pathD} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-1000 ease-out" />
        
        {points.map((p, i) => (
          <g key={i} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <circle cx={p.x} cy={p.y} r="5" fill={color} stroke="var(--bg-card)" strokeWidth="2" />
            <circle cx={p.x} cy={p.y} r="20" fill="transparent" className="cursor-pointer" />
            
            {/* Tooltip */}
            <g className="opacity-0 hover:opacity-100 transition-opacity">
              <rect x={p.x - 24} y={p.y - 40} width="48" height="28" rx="6" fill="var(--text-primary)" />
              <text x={p.x} y={p.y - 21} fontSize="13" fontWeight="bold" fill="var(--bg-primary)" textAnchor="middle">{data[i].value}</text>
            </g>
          </g>
        ))}
      </svg>
      <div className="flex justify-between mt-2 px-8">
        {data.map((d, i) => (
          <span key={i} className="text-[13px] font-medium" style={{ color: "var(--text-muted)" }}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

// --- Main Component ---

export default function AnalyticsCharts({ reminders, stats, loading }: AnalyticsChartsProps) {
  
  const metrics = useMemo(() => {
    const total = reminders.length;
    const completedList = reminders.filter(r => r.completed);
    
    // KPI Data
    const productivityScore = total > 0 ? Math.round((completedList.length / total) * 100) : 0;
    const completedToday = reminders.filter(
      (r) => r.completed && r.updatedAt?.startsWith(new Date().toISOString().split("T")[0])
    ).length;
    const now = new Date();
    const overdue = reminders.filter(
      (r) => !r.completed && new Date(r.dueDate) < now && !isSameDay(new Date(r.dueDate), now)
    ).length;
    const currentStreak = completedToday > 0 ? (stats?.totalReminders ? Math.min(Math.round(stats.totalReminders / 10), 12) : 1) : 0;

    // Completion Trend (Last 7 days)
    const trendData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split("T")[0];
      return {
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        value: reminders.filter((r) => r.updatedAt?.startsWith(dateStr) && r.completed).length,
      };
    });

    // Upcoming Deadlines (Max 3)
    const upcoming = reminders
      .filter(r => !r.completed && new Date(r.dueDate) > now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 3);

    return {
      productivityScore,
      completedToday,
      currentStreak,
      overdue,
      trendData,
      upcoming,
    };
  }, [reminders, stats]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-[20px] bg-[var(--bg-card)] border border-[var(--border-default)]" />
        ))}
      </div>
    );
  }

  const cardStyle = {
    background: "var(--bg-card)",
    border: "1px solid var(--border-light)",
    boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
    borderRadius: "20px"
  };

  const hoverAnimation = {
    y: -4,
    boxShadow: "0 12px 24px rgba(0,0,0,0.06)",
    transition: { duration: 0.25, ease: "easeInOut" }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* --- SECTION: 4 KPI CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Productivity Score */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3 }}
          whileHover={hoverAnimation}
          className="p-5 flex flex-col justify-between" style={cardStyle}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "rgba(59, 130, 246, 0.1)" }}>
              <TrendingUp className="h-4 w-4" style={{ color: "#3b82f6" }} />
            </div>
            <span className="text-[13px] font-bold flex items-center gap-1" style={{ color: "var(--color-success)" }}>
              ↑ 8%
            </span>
          </div>
          <div>
            <p className="text-[13px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-secondary)" }}>Productivity Score</p>
            <p className="text-[36px] font-extrabold leading-none" style={{ color: "var(--text-primary)" }}>
              <Counter value={metrics.productivityScore} />%
            </p>
          </div>
        </motion.div>

        {/* Completed */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: 0.05 }}
          whileHover={hoverAnimation}
          className="p-5 flex flex-col justify-between" style={cardStyle}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "rgba(34, 197, 94, 0.1)" }}>
              <CheckCircle2 className="h-4 w-4" style={{ color: "#22c55e" }} />
            </div>
            <span className="text-[13px] font-bold flex items-center gap-1" style={{ color: "var(--color-success)" }}>
              ↑ 2
            </span>
          </div>
          <div>
            <p className="text-[13px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-secondary)" }}>Completed</p>
            <p className="text-[36px] font-extrabold leading-none" style={{ color: "var(--text-primary)" }}>
              <Counter value={metrics.completedToday} />
            </p>
          </div>
        </motion.div>

        {/* Current Streak */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: 0.1 }}
          whileHover={hoverAnimation}
          className="p-5 flex flex-col justify-between" style={cardStyle}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "rgba(249, 115, 22, 0.1)" }}>
              <Flame className="h-4 w-4" style={{ color: "#f97316" }} />
            </div>
            <span className="text-[13px] font-bold flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              -
            </span>
          </div>
          <div>
            <p className="text-[13px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-secondary)" }}>Current Streak</p>
            <p className="text-[36px] font-extrabold leading-none" style={{ color: "var(--text-primary)" }}>
              <Counter value={metrics.currentStreak} />
            </p>
          </div>
        </motion.div>

        {/* Overdue */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: 0.15 }}
          whileHover={hoverAnimation}
          className="p-5 flex flex-col justify-between" style={cardStyle}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "rgba(239, 68, 68, 0.1)" }}>
              <AlertTriangle className="h-4 w-4" style={{ color: "#ef4444" }} />
            </div>
            <span className="text-[13px] font-bold flex items-center gap-1" style={{ color: "var(--color-danger)" }}>
              ↓ 1
            </span>
          </div>
          <div>
            <p className="text-[13px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-secondary)" }}>Overdue</p>
            <p className="text-[36px] font-extrabold leading-none" style={{ color: "var(--text-primary)" }}>
              <Counter value={metrics.overdue} />
            </p>
          </div>
        </motion.div>

      </div>

      {/* --- SECTION: TREND & DEADLINES (2-Column Desktop) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Completion Trend */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
          className="lg:col-span-8 p-6 flex flex-col" style={cardStyle}
        >
          <div className="mb-6">
            <h2 className="text-[22px] font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Completion Trend</h2>
          </div>
          <div className="flex-1 w-full min-h-[420px]">
            <AreaChart data={metrics.trendData} color="#3b82f6" />
          </div>
        </motion.div>

        {/* Right Column: AI Insight & Deadlines */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
          {/* AI Insight */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.1 }}
            className="p-6 flex flex-col relative overflow-hidden" 
            style={{
              background: "var(--color-primary-light)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              borderRadius: "20px",
              boxShadow: "0 4px 16px rgba(59, 130, 246, 0.05)"
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-white shadow-sm">
                <Sparkles className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
              </div>
              <h3 className="text-[16px] font-bold" style={{ color: "var(--color-primary-dark)" }}>AI Insight</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-[13px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(59, 130, 246, 0.8)" }}>Best Time</p>
                <p className="text-[22px] font-extrabold" style={{ color: "var(--color-primary-dark)" }}>4 PM – 7 PM</p>
              </div>
              <div>
                <p className="text-[13px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(59, 130, 246, 0.8)" }}>Recommendation</p>
                <p className="text-[16px] font-medium leading-relaxed" style={{ color: "var(--color-primary-dark)" }}>
                  Schedule high-priority reminders during this period.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Upcoming Deadlines */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[22px] font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Upcoming</h2>
              <Link href="/dashboard/reminders" className="text-[13px] font-bold flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: "var(--color-primary)" }}>
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            
            <div className="space-y-3">
              {metrics.upcoming.length === 0 ? (
                <div className="p-6 text-center rounded-[20px]" style={cardStyle}>
                  <p className="text-[16px] font-medium" style={{ color: "var(--text-muted)" }}>No upcoming deadlines.</p>
                </div>
              ) : (
                metrics.upcoming.map((r) => {
                  const isTodayStr = isSameDay(new Date(r.dueDate), new Date()) 
                    ? "Today" 
                    : new Date(r.dueDate).toLocaleDateString("en-US", { weekday: "long" });
                  
                  return (
                    <motion.div 
                      key={r._id} 
                      whileHover={{ x: 4, transition: { duration: 0.2 } }}
                      className="flex items-center justify-between p-4 rounded-[20px] transition-all" 
                      style={cardStyle}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ background: priorityColors[r.priority] }} />
                        <div>
                          <p className="text-[16px] font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>{r.title}</p>
                          <p className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>{isTodayStr}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-lg" style={{ background: "var(--bg-tertiary)", color: priorityColors[r.priority] }}>
                        {r.priority}
                      </span>
                    </motion.div>
                  )
                })
              )}
            </div>
          </motion.div>

        </div>
      </div>

    </div>
  );
}
