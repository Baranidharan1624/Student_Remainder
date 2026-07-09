"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Clock, Calendar, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useBrowserNotifications, useReminderNotifications } from "@/hooks/useNotifications";
import { dashboardAPI, remindersAPI } from "@/lib/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import FloatingActionButton from "@/components/layout/FloatingActionButton";
import StatsOverview from "@/components/dashboard/StatsOverview";
import TodaysSchedule from "@/components/dashboard/TodaysSchedule";
import UpcomingSection from "@/components/dashboard/UpcomingSection";
import ProductivityScore from "@/components/dashboard/ProductivityScore";
import TodayFocus from "@/components/dashboard/TodayFocus";
import RecentlyCreated from "@/components/dashboard/RecentlyCreated";
import Widget from "@/components/ui/Widget";
import ErrorState from "@/components/ui/ErrorState";
import type { DashboardStatistics, Reminder } from "@/types";

function HeroIllustration() {
  return (
    <div
      className="hidden md:flex items-center justify-center flex-shrink-0 pointer-events-none relative"
      style={{ width: 260, height: 200, marginRight: 16 }}
    >
      {/* Dark mode glow */}
      <div 
        className="absolute inset-0 rounded-[24px] hidden dark:block"
        style={{
          background: "radial-gradient(ellipse at center, rgba(59,130,246,0.15) 0%, transparent 70%)",
          filter: "blur(16px)",
          transform: "scale(1.2)",
        }}
      />
      
      {/* Container */}
      <div
        className="relative flex items-center justify-center w-full h-full rounded-[24px] bg-transparent animate-hero-float"
        style={{
          boxShadow: "var(--hero-shadow, 0 20px 50px rgba(37,99,235,0.12))",
        }}
      >
        <img
          src="/illustration.png"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-contain select-none pointer-events-none"
          style={{
            transform: "scale(1.15)", // 15% larger
            opacity: 0.95,
          }}
        />
      </div>
    </div>
  );
}

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

  const handleComplete = async (id: string) => {
    try {
      await remindersAPI.update(id, { completed: true } as any);
      // Wait for a tiny moment to allow visual animations before refreshing stats
      await new Promise((resolve) => setTimeout(resolve, 500));
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Failed to complete reminder:", error);
      throw error;
    }
  };

  const todayReminders = useMemo(
    () =>
      reminders.filter(
        (r) =>
          !r.completed &&
          new Date(r.dueDate).toISOString().split("T")[0] ===
          new Date().toISOString().split("T")[0]
      ),
    [reminders]
  );

  const upcomingReminders = useMemo(() => {
    return reminders.filter((r) => {
      if (r.completed) return false;
      const due = new Date(r.dueDate);
      const now = new Date();
      const weekFromNow = new Date(now);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return due > now && due <= weekFromNow;
    });
  }, [reminders]);

  const completedToday = useMemo(
    () => todayReminders.filter((r) => r.completed).length,
    [todayReminders]
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: "Good Morning", emoji: "\uD83C\uDF05" };
    if (hour >= 12 && hour < 17) return { text: "Good Afternoon", emoji: "\u2600\uFE0F" };
    if (hour >= 17 && hour < 21) return { text: "Good Evening", emoji: "\uD83C\uDF06" };
    return { text: "Good Night", emoji: "\uD83C\uDF19" };
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-secondary)" }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Hero Section */}
        <div
          className="relative rounded-[24px] mb-8 hero-gradient hero-card-shadow animate-fade-in overflow-hidden"
          style={{ minHeight: 260 }}
        >
          <div className="flex flex-col lg:flex-row items-center gap-3 lg:gap-1 pl-7 sm:pl-10 pr-3 sm:pr-6 py-7 lg:py-6">
            {/* Text — ~65-70% */}
            <div className="flex-1 min-w-0 text-center sm:text-left z-10">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5"
                style={{ color: "var(--color-primary)" }}
              >
                {greeting.text} {greeting.emoji}
              </p>
              <h1
                className="text-[24px] sm:text-[30px] lg:text-[36px] font-extrabold tracking-tight mb-1.5"
                style={{ color: "var(--text-primary)", lineHeight: 1.15, letterSpacing: "-0.03em" }}
              >
                Welcome back, {user?.name?.split(" ")[0]}!
              </h1>
              <p
                className="text-[13px] max-w-sm leading-snug"
                style={{ color: "var(--text-secondary)", fontWeight: 400 }}
              >
                Let&apos;s make today productive and achieve your goals.
              </p>
            </div>

            {/* Illustration — ~30-35%, max 260px */}
            <HeroIllustration />
          </div>

          {/* Soft radial glow behind illustration */}
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:block pointer-events-none"
            style={{
              width: 200,
              height: 180,
              background: "radial-gradient(ellipse at center, rgba(219,234,254,0.06) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
        </div>

        {/* Error */}
        {error && !loading && (
          <ErrorState message={error} onRetry={() => setRefreshKey((k) => k + 1)} />
        )}

        {/* Statistics */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <StatsOverview stats={stats} loading={loading} />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column — 2/3 */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            {/* Today's Schedule */}
            <div className="animate-fade-in" style={{ animationDelay: "150ms" }}>
              <Widget
                title="Today's Schedule"
                icon={<Clock className="h-4 w-4" />}
                action={
                  <Link
                    href="/dashboard/reminders"
                    className="flex items-center gap-1 text-xs font-medium transition-colors hover:text-[var(--color-primary)]"
                    style={{ color: "var(--text-tertiary)" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    View All
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                }
              >
                <TodaysSchedule reminders={todayReminders} loading={loading} onComplete={handleComplete} />
              </Widget>
            </div>

            {/* Upcoming */}
            <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
              <Widget title="Upcoming (Next 7 Days)" icon={<Calendar className="h-4 w-4" />}>
                <UpcomingSection reminders={upcomingReminders} loading={loading} />
              </Widget>
            </div>
          </div>

          {/* Right Column — 1/3 */}
          <div className="space-y-6 lg:space-y-8">
            {/* Today's Focus */}
            <div className="animate-fade-in" style={{ animationDelay: "175ms" }}>
              <TodayFocus
                reminders={reminders}
                todayCount={todayReminders.length}
                completedToday={completedToday}
                loading={loading}
                onComplete={handleComplete}
              />
            </div>

            {/* Productivity Score */}
            <div className="animate-fade-in" style={{ animationDelay: "225ms" }}>
              <Widget title="Productivity Score">
                <ProductivityScore stats={stats} loading={loading} />
              </Widget>
            </div>

            {/* Recently Created */}
            <div className="animate-fade-in" style={{ animationDelay: "275ms" }}>
              <Widget title="Recently Created">
                <RecentlyCreated reminders={reminders} loading={loading} />
              </Widget>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton />
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
