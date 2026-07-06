"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Plus, LayoutGrid, List } from "lucide-react";
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

  // Reset to page 1 when search, filters, or limit change
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
            <p className="text-sm text-gray-500 mt-1">
              {totalItems} reminder{totalItems !== 1 ? "s" : ""} total
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Per Page Selector */}
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-white shadow-sm text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-white shadow-sm text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <Link
              href="/dashboard/reminders/new"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 transition-all"
            >
              <Plus className="h-4 w-4" />
              New Reminder
            </Link>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 space-y-4">
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-blue-800 transition-all"
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
              {reminders.map((reminder) => (
                <ReminderCard
                  key={reminder._id}
                  reminder={reminder}
                  onDelete={setDeleteId}
                  viewMode={viewMode}
                />
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
