"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Check, Loader2, Plus, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Reminder, Priority } from "@/types";
import { formatTime } from "@/lib/utils";
import { useSmartStatus } from "@/hooks/useSmartStatus";
import ReminderStatusBadge from "./ReminderStatusBadge";
import CompleteConfirmDialog from "@/components/ui/CompleteConfirmDialog";

interface TodayFocusProps {
  reminders: Reminder[];
  todayCount: number;
  completedToday: number;
  loading?: boolean;
  onComplete?: (id: string) => Promise<void>;
}

const PRIORITY_COLORS: Record<Priority, { bg: string; color: string; label: string }> = {
  High: { bg: "var(--color-danger-light)", color: "var(--color-danger)", label: "🔴 High" },
  Medium: { bg: "var(--color-warning-light)", color: "var(--color-warning)", label: "🟠 Medium" },
  Low: { bg: "var(--color-success-light)", color: "var(--color-success)", label: "🟢 Low" },
};

function FocusReminderRow({
  reminder,
  onConfirm,
  isConfirming,
}: {
  reminder: Reminder;
  onConfirm: (id: string) => void;
  isConfirming: boolean;
}) {
  const status = useSmartStatus(reminder.dueDate, reminder.dueTime, reminder.completed);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, height: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      <div
        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:shadow-sm"
        style={{
          background: reminder.completed ? "var(--color-success-light)" : "var(--bg-tertiary)",
          border: `1px solid ${reminder.completed ? "rgba(34,197,94,0.2)" : "var(--border-light)"}`,
        }}
      >
        <Circle
          className="h-2 w-2 flex-shrink-0"
          style={{
            fill: reminder.completed ? "var(--color-success)" : PRIORITY_COLORS[reminder.priority].color,
            color: "transparent",
          }}
        />

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold truncate leading-snug ${
              reminder.completed ? "line-through" : ""
            }`}
            style={{ color: reminder.completed ? "var(--text-tertiary)" : "var(--text-primary)" }}
          >
            {reminder.title}
          </p>
          {reminder.subject && (
            <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {reminder.subject}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {reminder.dueTime && !reminder.completed && (
            <span className="text-[11px] font-medium tabular-nums hidden sm:inline" style={{ color: "var(--text-tertiary)" }}>
              {formatTime(reminder.dueTime)}
            </span>
          )}

          <ReminderStatusBadge text={status.text} type={status.type} compact />

          {!reminder.completed && (
            isConfirming ? (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white"
                style={{ background: "var(--color-primary)", opacity: 0.7 }}
              >
                <Loader2 className="h-3 w-3 animate-spin" />
              </div>
            ) : (
              <button
                onClick={() => onConfirm(reminder._id)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white transition-all btn-active opacity-0 group-hover:opacity-100"
                style={{
                  background: "var(--color-primary)",
                  boxShadow: "0 1px 4px -1px rgba(37, 99, 235, 0.3)",
                }}
              >
                <Check className="h-3 w-3" />
                Complete
              </button>
            )
          )}

          {reminder.completed && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "var(--color-success-light)", color: "var(--color-success)" }}
            >
              ✓
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function TodayFocus({ reminders, todayCount, completedToday, loading, onComplete }: TodayFocusProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());

  const confirmingReminder = reminders.find((r) => r._id === confirmId);

  const { incompleteByPriority, completedReminders } = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayAll = reminders.filter((r) => {
      const rDate = new Date(r.dueDate).toISOString().split("T")[0];
      return rDate === today;
    });

    const incomplete = todayAll.filter((r) => !r.completed);
    const completed = todayAll.filter((r) => r.completed);

    const grouped: Record<Priority, Reminder[]> = { High: [], Medium: [], Low: [] };
    for (const r of incomplete) {
      grouped[r.priority].push(r);
    }
    for (const key of Object.keys(grouped) as Priority[]) {
      grouped[key].sort((a, b) => (a.dueTime || "99:99").localeCompare(b.dueTime || "99:99"));
    }

    return { incompleteByPriority: grouped, completedReminders: completed };
  }, [reminders]);

  const remaining = todayCount - completedToday;
  const allCompleted = todayCount > 0 && completedToday >= todayCount;
  const hasAny = todayCount > 0;

  const handleComplete = async (id: string) => {
    setConfirmId(null);
    setCompletingIds((prev) => new Set(prev).add(id));

    try {
      await onComplete?.(id);
    } catch {
      // handled by parent
    } finally {
      setCompletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl p-6 animate-pulse" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
        <div className="h-3.5 w-24 rounded skeleton mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-xl skeleton" />
          ))}
        </div>
      </div>
    );
  }

  /* ── Empty state: no tasks for today ── */
  if (!hasAny) {
    return (
      <div
        className="rounded-2xl p-6"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-4" style={{ color: "var(--text-tertiary)" }}>
          Today&apos;s Focus
        </p>
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: "var(--bg-tertiary)" }}>
            <span className="text-xl">🎯</span>
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            No tasks for today
          </p>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Enjoy your free time!
          </p>
        </div>
      </div>
    );
  }

  /* ── Celebration state: all today's reminders completed ── */
  if (allCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="rounded-2xl p-6 text-center"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.15 }}
          className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: "var(--color-success-light)" }}
        >
          <span className="text-2xl">🎉</span>
        </motion.div>
        <h3 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          Great Work!
        </h3>
        <p className="text-sm mb-5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          You completed everything scheduled for today.
          <br />
          Take a break or plan tomorrow&apos;s tasks.
        </p>
        <Link
          href="/dashboard/reminders"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all btn-active"
          style={{
            background: "var(--color-primary)",
            boxShadow: "0 2px 8px -2px rgba(37, 99, 235, 0.4)",
          }}
        >
          <Plus className="h-4 w-4" />
          Create New Reminder
        </Link>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        layout
        className="rounded-2xl p-6"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--text-tertiary)" }}>
            Today&apos;s Focus
          </p>
          {remaining > 0 && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}
            >
              {remaining} remaining
            </span>
          )}
        </div>

        <div className="space-y-5">
          {(["High", "Medium", "Low"] as Priority[]).map((priority) => {
            const items = incompleteByPriority[priority];
            if (items.length === 0) return null;
            const config = PRIORITY_COLORS[priority];

            return (
              <motion.div
                key={priority}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: priority === "High" ? 0 : priority === "Medium" ? 0.08 : 0.16 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold" style={{ color: config.color }}>
                    {config.label}
                  </span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{ background: config.bg, color: config.color }}
                  >
                    {items.length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <AnimatePresence mode="popLayout">
                    {items.map((r) => (
                      <FocusReminderRow
                        key={r._id}
                        reminder={r}
                        onConfirm={setConfirmId}
                        isConfirming={completingIds.has(r._id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Completed section */}
        {completedReminders.length > 0 && (
          <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--border-light)" }}>
            <p className="text-[11px] font-semibold mb-2" style={{ color: "var(--color-success)" }}>
              ✅ Completed ({completedReminders.length})
            </p>
            <div className="space-y-1">
              {completedReminders.map((r) => (
                <FocusReminderRow
                  key={r._id}
                  reminder={r}
                  onConfirm={setConfirmId}
                  isConfirming={completingIds.has(r._id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Summary footer */}
        <motion.div
          layout
          className="flex items-center gap-3 p-3 rounded-xl mt-5"
          style={{ background: "var(--bg-tertiary)" }}
        >
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--bg-card)" }}
          >
            <span className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>
              {remaining}
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
              Remaining Today
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              {remaining} reminder{remaining !== 1 ? "s" : ""} left
            </p>
          </div>
        </motion.div>
      </motion.div>

      <CompleteConfirmDialog
        open={!!confirmId}
        title={confirmingReminder?.title || ""}
        loading={!!confirmId && completingIds.has(confirmId)}
        onConfirm={() => confirmId && handleComplete(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </>
  );
}
