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

  const selectStyle = {
    borderColor: "var(--border-default)",
    background: "var(--bg-card)",
    color: "var(--text-primary)",
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={filters.priority || ""}
        onChange={(e) =>
          onChange({ ...filters, priority: (e.target.value || undefined) as Priority | undefined })
        }
        className="px-3 py-2 rounded-2xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
        style={selectStyle}
      >
        <option value="">All Priorities</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <select
        value={filters.category || ""}
        onChange={(e) =>
          onChange({ ...filters, category: (e.target.value || undefined) as Category | undefined })
        }
        className="px-3 py-2 rounded-2xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
        style={selectStyle}
      >
        <option value="">All Categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        value={filters.completed || ""}
        onChange={(e) =>
          onChange({ ...filters, completed: e.target.value || undefined })
        }
        className="px-3 py-2 rounded-2xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
        style={selectStyle}
      >
        <option value="">All Status</option>
        <option value="true">Completed</option>
        <option value="false">Pending</option>
      </select>

      <select
        value={filters.sort || ""}
        onChange={(e) =>
          onChange({ ...filters, sort: e.target.value || undefined })
        }
        className="px-3 py-2 rounded-2xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
        style={selectStyle}
      >
        <option value="">Sort By</option>
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-medium transition-colors hover:bg-[var(--color-danger-light)]"
          style={{ color: "var(--color-danger)" }}
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
