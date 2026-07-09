"use client";

import { useState, useEffect } from "react";
import { dashboardAPI, remindersAPI } from "@/lib/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import AnalyticsCharts from "@/components/analytics/AnalyticsCharts";
import ErrorState from "@/components/ui/ErrorState";
import type { DashboardStatistics, Reminder } from "@/types";
import { TrendingUp } from "lucide-react";
import Link from "next/link";

function AnalyticsContent() {
  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [statsRes, remindersRes] = await Promise.all([
          dashboardAPI.getStats(),
          remindersAPI.getAll({ limit: 1000 }),
        ]);
        if (!cancelled) {
          setStats(statsRes.data.statistics);
          setReminders(remindersRes.data.reminders);
        }
      } catch {
        if (!cancelled) setError("Failed to load analytics data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  if (!loading && reminders.length === 0 && !error) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg-secondary)" }}>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center min-h-[70vh]">
          <div className="text-center animate-fade-in max-w-md">
            <div className="w-32 h-32 mx-auto mb-6 rounded-[20px] flex items-center justify-center" style={{ background: "var(--bg-card)", boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
              <TrendingUp className="h-12 w-12" style={{ color: "var(--color-primary)" }} />
            </div>
            <h2 className="text-[22px] font-extrabold tracking-tight mb-3" style={{ color: "var(--text-primary)" }}>No analytics available yet.</h2>
            <p className="text-[16px] mb-8" style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Start creating reminders to unlock productivity insights, track your performance, and discover your workflow patterns.
            </p>
            <Link 
              href="/dashboard/reminders/new"
              className="inline-flex items-center justify-center px-6 py-3 rounded-[20px] text-white font-bold transition-all hover:scale-105 hover:shadow-lg"
              style={{ background: "var(--color-primary)" }}
            >
              Create Reminder
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-secondary)" }}>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Premium Minimal Hero Section */}
        <div className="flex flex-col items-start justify-center mb-10 animate-fade-in max-w-2xl">
          <p className="text-[13px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "var(--text-muted)" }}>
            Analytics
          </p>
          <h1 className="text-[36px] sm:text-[48px] font-extrabold tracking-tight mb-4" style={{ color: "var(--text-primary)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            Track your productivity
          </h1>
          <p className="text-[16px]" style={{ color: "var(--text-secondary)", fontWeight: 400, lineHeight: 1.6 }}>
            Monitor your progress, stay focused, and improve every day.
          </p>
        </div>

        {error && !loading && (
          <div className="mb-8">
            <ErrorState message={error} onRetry={() => setRefreshKey((k) => k + 1)} />
          </div>
        )}

        <AnalyticsCharts reminders={reminders} stats={stats} loading={loading} />
      </main>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <AnalyticsContent />
    </ProtectedRoute>
  );
}
