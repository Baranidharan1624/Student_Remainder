"use client";

import { X } from "lucide-react";
import type { Category, Priority, ReminderFilters } from "@/types";
import { CATEGORIES, PRIORITIES, SORT_OPTIONS } from "@/types";

interface FilterPanelProps {
  filters: ReminderFilters;
  onChange: (filters: ReminderFilters) => void;
}

export default function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const hasActiveFilters =
    filters.priority || filters.category || filters.completed || filters.sort;

  const clearFilters = () => {
    onChange({
      priority: undefined,
      category: undefined,
      completed: undefined,
      sort: undefined,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Priority Filter */}
      <select
        value={filters.priority || ""}
        onChange={(e) =>
          onChange({ ...filters, priority: (e.target.value || undefined) as Priority | undefined })
        }
        className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
      >
        <option value="">All Priorities</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      {/* Category Filter */}
      <select
        value={filters.category || ""}
        onChange={(e) =>
          onChange({ ...filters, category: (e.target.value || undefined) as Category | undefined })
        }
        className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
      >
        <option value="">All Categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {/* Completed Filter */}
      <select
        value={filters.completed || ""}
        onChange={(e) =>
          onChange({ ...filters, completed: e.target.value || undefined })
        }
        className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
      >
        <option value="">All Status</option>
        <option value="true">Completed</option>
        <option value="false">Pending</option>
      </select>

      {/* Sort */}
      <select
        value={filters.sort || ""}
        onChange={(e) =>
          onChange({ ...filters, sort: e.target.value || undefined })
        }
        className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
      >
        <option value="">Sort By</option>
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
