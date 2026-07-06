"use client";

import { useState, useEffect } from "react";
import { dashboardAPI, remindersAPI } from "@/lib/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import AnalyticsCharts from "@/components/analytics/AnalyticsCharts";
import ErrorState from "@/components/ui/ErrorState";
import type { DashboardStatistics, Reminder } from "@/types";

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
          remindersAPI.getAll({ limit: 200 }),
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

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-secondary)" }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Analytics</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Your productivity insights
          </p>
        </div>

        {error && !loading && (
          <ErrorState message={error} onRetry={() => setRefreshKey((k) => k + 1)} />
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
