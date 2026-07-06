"use client";

import { useState, useEffect } from "react";
import { remindersAPI } from "@/lib/api";
import type { Reminder, ReminderFilters } from "@/types";

interface UseRemindersResult {
  reminders: Reminder[];
  loading: boolean;
  error: string | null;
  totalItems: number;
  totalPages: number;
  refresh: () => void;
}

export function useReminders(filters?: ReminderFilters): UseRemindersResult {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const { data } = await remindersAPI.getAll(filters);
        if (!cancelled) {
          setReminders(data.reminders);
          setTotalPages(data.totalPages);
          setTotalItems(data.totalItems);
        }
      } catch {
        if (!cancelled) setError("Failed to load reminders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [filters, refreshKey]);

  return {
    reminders,
    loading,
    error,
    totalItems,
    totalPages,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}

export function useReminderById(id: string) {
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const { data } = await remindersAPI.getById(id);
        if (!cancelled) {
          if (data.success) setReminder(data.reminder);
          else setError("Reminder not found");
        }
      } catch {
        if (!cancelled) setError("Failed to load reminder");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { reminder, loading, error };
}
