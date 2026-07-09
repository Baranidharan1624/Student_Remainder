"use client";

import { useState, useEffect, useMemo } from "react";
import { remindersAPI } from "@/lib/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import FloatingActionButton from "@/components/layout/FloatingActionButton";
import CalendarView from "@/components/calendar/CalendarView";
import ErrorState from "@/components/ui/ErrorState";
import type { Reminder } from "@/types";
import { Calendar as CalendarIcon, Clock, AlertTriangle } from "lucide-react";
import { isSameDay, isToday } from "@/lib/utils";

function CalendarContent() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const { data } = await remindersAPI.getAll({ limit: 500 });
        if (!cancelled) setReminders(data.reminders);
      } catch {
        if (!cancelled) setError("Failed to load reminders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  // Calculate statistics
  const { todayCount, upcomingCount, overdueCount } = useMemo(() => {
    const now = new Date();
    let today = 0;
    let upcoming = 0;
    let overdue = 0;

    reminders.forEach((r) => {
      if (r.completed) return;
      const dueDate = new Date(r.dueDate);
      if (isToday(dueDate)) {
        today++;
      } else if (dueDate > now) {
        upcoming++;
      } else if (dueDate < now && !isSameDay(dueDate, now)) {
        overdue++;
      }
    });

    return { todayCount: today, upcomingCount: upcoming, overdueCount: overdue };
  }, [reminders]);

  const filteredReminders = useMemo(() => {
    if (!searchQuery.trim()) return reminders;
    const q = searchQuery.toLowerCase();
    return reminders.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.subject && r.subject.toLowerCase().includes(q))
    );
  }, [reminders, searchQuery]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-secondary)" }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Compact Premium Hero Section */}
        <div
          className="relative rounded-[20px] mb-6 hero-gradient animate-fade-in overflow-hidden"
          style={{ minHeight: 120, boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)" }}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pl-6 sm:pl-8 pr-6 sm:pr-8 py-5 lg:py-6">
            <div className="z-10 flex-1">
              <h1
                className="text-[22px] sm:text-[26px] font-extrabold tracking-tight mb-1"
                style={{ color: "var(--text-primary)", lineHeight: 1.2 }}
              >
                Calendar View
              </h1>
              <p
                className="text-[13px]"
                style={{ color: "var(--text-secondary)", fontWeight: 500 }}
              >
                Manage your reminders efficiently and stay organized.
              </p>
            </div>

            {/* Compact Statistics Row */}
            <div className="flex items-center gap-3 z-10 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 hide-scrollbar">
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl flex-shrink-0" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}>
                <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "var(--color-primary-light)" }}>
                  <CalendarIcon className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Today</p>
                  <p className="text-sm font-extrabold leading-none mt-0.5" style={{ color: "var(--text-primary)" }}>{todayCount}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl flex-shrink-0" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}>
                <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "var(--bg-tertiary)" }}>
                  <Clock className="h-3.5 w-3.5" style={{ color: "var(--text-secondary)" }} />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Upcoming</p>
                  <p className="text-sm font-extrabold leading-none mt-0.5" style={{ color: "var(--text-primary)" }}>{upcomingCount}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl flex-shrink-0" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}>
                <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "var(--color-danger-light)" }}>
                  <AlertTriangle className="h-3.5 w-3.5" style={{ color: "var(--color-danger)" }} />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Overdue</p>
                  <p className="text-sm font-extrabold leading-none mt-0.5" style={{ color: "var(--text-primary)" }}>{overdueCount}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:block pointer-events-none"
            style={{
              width: 250,
              height: 200,
              background: "radial-gradient(ellipse at center, rgba(59,130,246,0.06) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
        </div>

        {/* Premium Search Bar */}
        <div className="mb-6 animate-fade-in relative max-w-md">
          <input
            type="text"
            placeholder="Search reminders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-default)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}
          />
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "var(--text-muted)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {error && !loading && (
          <ErrorState message={error} onRetry={() => setRefreshKey((k) => k + 1)} />
        )}

        <CalendarView reminders={filteredReminders} />
      </main>

      <FloatingActionButton />
    </div>
  );
}

export default function CalendarPage() {
  return (
    <ProtectedRoute>
      <CalendarContent />
    </ProtectedRoute>
  );
}
