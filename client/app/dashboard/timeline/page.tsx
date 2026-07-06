"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { remindersAPI } from "@/lib/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import TimelineView from "@/components/timeline/TimelineView";
import ErrorState from "@/components/ui/ErrorState";
import type { Reminder } from "@/types";

function TimelineContent() {
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
        const { data } = await remindersAPI.getAll({ limit: 200, sort: "dueDate" });
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Timeline</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Your reminders organized by date
            </p>
          </div>
          <Link
            href="/dashboard/reminders/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 transition-all"
          >
            <Plus className="h-4 w-4" />
            New Reminder
          </Link>
        </div>

        {error && !loading && (
          <ErrorState message={error} onRetry={() => setRefreshKey((k) => k + 1)} />
        )}

        <TimelineView reminders={reminders} loading={loading} />
      </main>
    </div>
  );
}

export default function TimelinePage() {
  return (
    <ProtectedRoute>
      <TimelineContent />
    </ProtectedRoute>
  );
}
