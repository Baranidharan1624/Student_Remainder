"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Plus, LayoutGrid, List, Search } from "lucide-react";
import { remindersAPI } from "@/lib/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import ReminderCard, {
  ReminderCardSkeleton,
} from "@/components/reminder/ReminderCard";
import SearchBar from "@/components/reminder/SearchBar";
import FilterPanel from "@/components/reminder/FilterPanel";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import toast from "react-hot-toast";
import type { Reminder, ReminderFilters } from "@/types";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function RemindersContent() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ReminderFilters>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-secondary)" }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Reminders</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              {totalItems} reminder{totalItems !== 1 ? "s" : ""} total
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Per Page Selector */}
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[var(--color-primary)]"
              style={{
                borderColor: "var(--border-default)",
                background: "var(--bg-tertiary)",
                color: "var(--text-primary)",
              }}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
            {/* View Toggle */}
            <div className="flex items-center rounded-xl p-1" style={{ background: "var(--bg-tertiary)" }}>
              <button
                onClick={() => setViewMode("grid")}
                className="p-2 rounded-lg transition-all"
                style={{
                  background: viewMode === "grid" ? "var(--bg-card)" : "transparent",
                  color: viewMode === "grid" ? "var(--color-primary)" : "var(--text-tertiary)",
                  boxShadow: viewMode === "grid" ? "var(--shadow-sm)" : "none",
                }}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className="p-2 rounded-lg transition-all"
                style={{
                  background: viewMode === "list" ? "var(--bg-card)" : "transparent",
                  color: viewMode === "list" ? "var(--color-primary)" : "var(--text-tertiary)",
                  boxShadow: viewMode === "list" ? "var(--shadow-sm)" : "none",
                }}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <Link
              href="/dashboard/reminders/new"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all btn-active shadow-lg"
              style={{
                background: "var(--color-primary)",
                boxShadow: "0 4px 14px 0 rgba(37, 99, 235, 0.39)",
              }}
            >
              <Plus className="h-4 w-4" />
              New Reminder
            </Link>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 space-y-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by title, subject, or description..."
          />
          <FilterPanel filters={filters} onChange={setFilters} />
        </div>

        {/* Error State */}
        {error && !loading && (
          <ErrorState message={error} onRetry={() => setRefreshKey((k) => k + 1)} />
        )}

        {/* Loading State */}
        {loading ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-3"
            }
          >
            {Array.from({ length: limit }).map((_, i) => (
              <ReminderCardSkeleton key={i} viewMode={viewMode} />
            ))}
          </div>
        ) : reminders.length === 0 ? (
          <EmptyState
            title={search ? "No results found" : "No reminders yet"}
            description={
              search
                ? `No reminders match "${search}"`
                : "Create your first reminder to get started"
            }
            action={
              !search ? (
                <Link
                  href="/dashboard/reminders/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium shadow-lg transition-all btn-active"
                  style={{
                    background: "var(--color-primary)",
                    boxShadow: "0 4px 14px 0 rgba(37, 99, 235, 0.39)",
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Create Reminder
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-3"
              }
            >
              {reminders.map((reminder, idx) => (
                <div key={reminder._id} className="animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                  <ReminderCard
                    reminder={reminder}
                    onDelete={setDeleteId}
                    viewMode={viewMode}
                  />
                </div>
              ))}
            </div>

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
