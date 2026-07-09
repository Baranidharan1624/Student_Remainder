"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { remindersAPI } from "@/lib/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import FloatingActionButton from "@/components/layout/FloatingActionButton";
import ReminderCard, {
  ReminderCardSkeleton,
} from "@/components/reminder/ReminderCard";
import SearchBar from "@/components/reminder/SearchBar";
import FilterPanel from "@/components/reminder/FilterPanel";
import Pagination from "@/components/ui/Pagination";
import ErrorState from "@/components/ui/ErrorState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import toast from "react-hot-toast";
import type { Reminder, ReminderFilters } from "@/types";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const QUICK_FILTERS = [
  { label: "All", value: undefined },
  { label: "Pending", value: "false" },
  { label: "Completed", value: "true" },
  { label: "Overdue", value: "overdue" },
] as const;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getGreetingEmoji() {
  const h = new Date().getHours();
  if (h < 12) return "\u2600\uFE0F";
  if (h < 17) return "\u26C5";
  return "\uD83C\uDF19";
}

function RemindersContent() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ReminderFilters>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        if (search.trim()) {
          const { data } = await remindersAPI.search(search);
          if (!cancelled) {
            setReminders(data.reminders);
            setTotalPages(1);
            setTotalItems(data.count);
          }
        } else {
          const { data } = await remindersAPI.getAll({
            ...filters,
            page,
            limit,
          });
          if (!cancelled) {
            setReminders(data.reminders);
            setTotalPages(data.totalPages);
            setTotalItems(data.totalItems);
          }
        }
      } catch {
        if (!cancelled) setError("Failed to load reminders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [filters, page, limit, search, refreshKey]);

  const prevSearchRef = useRef(search);
  const prevFiltersRef = useRef(filters);
  const prevLimitRef = useRef(limit);
  useEffect(() => {
    if (
      prevSearchRef.current !== search ||
      JSON.stringify(prevFiltersRef.current) !== JSON.stringify(filters) ||
      prevLimitRef.current !== limit
    ) {
      setPage(1);
    }
    prevSearchRef.current = search;
    prevFiltersRef.current = filters;
    prevLimitRef.current = limit;
  }, [search, filters, limit]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await remindersAPI.delete(deleteId);
      toast.success("Reminder deleted successfully");
      setDeleteId(null);
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error("Failed to delete reminder");
    } finally {
      setDeleting(false);
    }
  };

  const overdueCount = useMemo(() => {
    return reminders.filter((r) => {
      if (r.completed) return false;
      const d = new Date(r.dueDate);
      const now = new Date();
      if (r.dueTime) {
        const [h, m] = r.dueTime.split(":").map(Number);
        d.setHours(h, m, 0, 0);
      } else {
        d.setHours(23, 59, 59, 999);
      }
      return d.getTime() < now.getTime();
    }).length;
  }, [reminders]);

  const quickFilter = QUICK_FILTERS.find(
    (f) => f.value === (filters.completed ?? undefined)
  );

  const setQuickFilter = (value: string | undefined) => {
    setFilters((prev) => ({ ...prev, completed: value }));
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-secondary)" }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-24">
        {/* Hero Header — compact */}
        <div
          className="hero-gradient rounded-3xl px-6 sm:px-8 py-5 sm:py-6 mb-5 hero-card-shadow animate-fade-in"
        >
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: "var(--color-primary-light)" }}
            >
              {getGreetingEmoji()}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {getGreeting()}, <span style={{ color: "var(--color-primary)" }}>Reminders</span>
              </h1>
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Manage your reminders
                <span className="mx-1.5" style={{ color: "var(--text-tertiary)" }}>·</span>
                {totalItems} total
                {overdueCount > 0 && (
                  <span className="ml-1.5 text-[var(--color-danger)] font-medium">
                    {overdueCount} overdue
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Search & Quick Filters */}
        <div className="space-y-3 mb-5 animate-fade-in" style={{ animationDelay: "60ms" }}>
          {/* Search Row */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search by title, subject, or description..."
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-medium transition-all"
              style={{
                borderColor: showFilters ? "var(--color-primary)" : "var(--border-default)",
                background: showFilters ? "var(--color-primary-light)" : "var(--bg-card)",
                color: showFilters ? "var(--color-primary)" : "var(--text-secondary)",
              }}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {/* Quick Filter Chips + View Toggle */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {QUICK_FILTERS.map((f) => (
                <button
                  key={f.label}
                  onClick={() => setQuickFilter(f.value)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background:
                      quickFilter?.label === f.label
                        ? "var(--color-primary)"
                        : "var(--bg-tertiary)",
                    color:
                      quickFilter?.label === f.label
                        ? "white"
                        : "var(--text-secondary)",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {/* Per Page */}
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="px-2 py-1.5 rounded-xl border text-xs transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[var(--color-primary)]"
                style={{
                  borderColor: "var(--border-default)",
                  background: "var(--bg-tertiary)",
                  color: "var(--text-secondary)",
                }}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>{size} / page</option>
                ))}
              </select>
              {/* View Toggle */}
              <div className="flex items-center rounded-xl p-0.5" style={{ background: "var(--bg-tertiary)" }}>
                <button
                  onClick={() => setViewMode("grid")}
                  className="p-1.5 rounded-lg transition-all"
                  style={{
                    background: viewMode === "grid" ? "var(--bg-card)" : "transparent",
                    color: viewMode === "grid" ? "var(--color-primary)" : "var(--text-tertiary)",
                    boxShadow: viewMode === "grid" ? "var(--shadow-sm)" : "none",
                  }}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className="p-1.5 rounded-lg transition-all"
                  style={{
                    background: viewMode === "list" ? "var(--bg-card)" : "transparent",
                    color: viewMode === "list" ? "var(--color-primary)" : "var(--text-tertiary)",
                    boxShadow: viewMode === "list" ? "var(--shadow-sm)" : "none",
                  }}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Expandable Filter Panel */}
          {showFilters && (
            <div
              className="rounded-2xl border p-4 animate-slide-up"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-default)",
              }}
            >
              <FilterPanel filters={filters} onChange={setFilters} />
            </div>
          )}
        </div>

        {/* Error State */}
        {error && !loading && (
          <ErrorState message={error} onRetry={() => setRefreshKey((k) => k + 1)} />
        )}

        {/* Loading Skeleton */}
        {loading ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-3"
            }
          >
            {Array.from({ length: Math.min(limit, 6) }).map((_, i) => (
              <ReminderCardSkeleton key={i} viewMode={viewMode} />
            ))}
          </div>
        ) : reminders.length === 0 ? (
          /* Empty State */
          <div
            className="rounded-3xl border p-12 text-center animate-fade-in"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-default)",
            }}
          >
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--bg-tertiary)" }}
            >
              {search ? (
                <Search className="h-8 w-8" style={{ color: "var(--text-tertiary)" }} />
              ) : (
                <Sparkles className="h-8 w-8" style={{ color: "var(--text-tertiary)" }} />
              )}
            </div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              {search ? "No results found" : "No reminders yet"}
            </h3>
            <p className="text-sm max-w-sm mx-auto" style={{ color: "var(--text-secondary)" }}>
              {search
                ? `No reminders match "${search}". Try a different search term.`
                : "Tap the + button to create your first reminder."}
            </p>
          </div>
        ) : (
          <>
            {/* Reminder Grid / List */}
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-3"
              }
            >
              {reminders.map((reminder, idx) => (
                <div
                  key={reminder._id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <ReminderCard
                    reminder={reminder}
                    onDelete={setDeleteId}
                    viewMode={viewMode}
                  />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Reminder"
        message="Are you sure you want to delete this reminder? This action cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

export default function RemindersPage() {
  return (
    <ProtectedRoute>
      <RemindersContent />
    </ProtectedRoute>
  );
}
