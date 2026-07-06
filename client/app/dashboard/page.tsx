"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Calendar, BarChart3, Clock, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useBrowserNotifications, useReminderNotifications } from "@/hooks/useNotifications";
import { dashboardAPI, remindersAPI } from "@/lib/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import StatsOverview from "@/components/dashboard/StatsOverview";
import TodaysSchedule from "@/components/dashboard/TodaysSchedule";
import UpcomingSection from "@/components/dashboard/UpcomingSection";
import OverdueSection from "@/components/dashboard/OverdueSection";
import RecentActivity from "@/components/dashboard/RecentActivity";
import ProductivityScore from "@/components/dashboard/ProductivityScore";
import GoalsWidget from "@/components/dashboard/GoalsWidget";
import FocusWidget from "@/components/dashboard/FocusWidget";
import Widget from "@/components/ui/Widget";
import ErrorState from "@/components/ui/ErrorState";
import toast from "react-hot-toast";
import type { DashboardStatistics, Reminder } from "@/types";

function DashboardContent() {
  const { user } = useAuth();
  const { generateFromReminders } = useNotifications();
  const { permission, requestPermission } = useBrowserNotifications();
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
          remindersAPI.getAll({ limit: 100, sort: "-createdAt" }),
        ]);
        if (!cancelled) {
          setStats(statsRes.data.statistics);
          setReminders(remindersRes.data.reminders);
          generateFromReminders(remindersRes.data.reminders);
        }
      } catch {
        if (!cancelled) setError("Failed to load dashboard data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [refreshKey, generateFromReminders]);

  useReminderNotifications(reminders);

  useEffect(() => {
    if (permission === "default") {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const todayReminders = reminders.filter(
    (r) =>
      !r.completed &&
      new Date(r.dueDate).toISOString().split("T")[0] ===
        new Date().toISOString().split("T")[0]
  );

  const upcomingReminders = reminders.filter((r) => {
    if (r.completed) return false;
    const due = new Date(r.dueDate);
    const now = new Date();
    const weekFromNow = new Date(now);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return due > now && due <= weekFromNow;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Welcome back, {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Here&apos;s your productivity overview
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/calendar"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            >
              <Calendar className="h-4 w-4" />
              Calendar
            </Link>
            <Link
              href="/dashboard/analytics"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Link>
            <Link
              href="/dashboard/reminders/new"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 transition-all"
            >
              <Plus className="h-4 w-4" />
              New Reminder
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && !loading && (
          <ErrorState message={error} onRetry={() => setRefreshKey((k) => k + 1)} />
        )}

        {/* Stats Overview */}
        <div className="mb-6">
          <StatsOverview stats={stats} loading={loading} />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Schedule */}
            <Widget
              title="Today's Schedule"
              icon={<Clock className="h-4 w-4" />}
            >
              <TodaysSchedule reminders={todayReminders} loading={loading} />
            </Widget>

            {/* Upcoming */}
            <Widget
              title="Upcoming (Next 7 Days)"
              icon={<Calendar className="h-4 w-4" />}
            >
              <UpcomingSection reminders={upcomingReminders} loading={loading} />
            </Widget>

            {/* Overdue */}
            <Widget
              title="Overdue"
              icon={<Bell className="h-4 w-4" />}
            >
              <OverdueSection reminders={reminders} loading={loading} />
            </Widget>
          </div>

          {/* Right Column - Widgets */}
          <div className="space-y-6">
            <Widget title="Productivity Score">
              <ProductivityScore stats={stats} loading={loading} />
            </Widget>

            <Widget title="High Priority Tasks">
              <FocusWidget reminders={reminders} loading={loading} />
            </Widget>

            <Widget title="Goals">
              <GoalsWidget stats={stats} loading={loading} />
            </Widget>

            <Widget title="Recent Activity">
              <RecentActivity reminders={reminders} loading={loading} />
            </Widget>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
