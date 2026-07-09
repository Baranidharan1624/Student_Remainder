"use client";

import { useState, useMemo } from "react";
import { CheckCircle2, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Reminder } from "@/types";
import { formatTime, getPriorityBg } from "@/lib/utils";
import { useSmartStatus } from "@/hooks/useSmartStatus";
import ReminderStatusBadge from "./ReminderStatusBadge";
import CompleteConfirmDialog from "@/components/ui/CompleteConfirmDialog";

interface TodaysScheduleProps {
  reminders: Reminder[];
  loading?: boolean;
  onComplete?: (id: string) => Promise<void>;
}

type CompletionState = "idle" | "confirming" | "loading" | "completed" | "removing";

function ScheduleRow({
  reminder,
  isCompleted,
  isLoading,
  onConfirm,
}: {
  reminder: Reminder;
  isCompleted: boolean;
  isLoading: boolean;
  onConfirm: (id: string) => void;
}) {
  const status = useSmartStatus(reminder.dueDate, reminder.dueTime, isCompleted);

  return (
    <div
      className={`relative flex items-stretch gap-3 sm:gap-4 group py-3 rounded-xl hover:bg-[var(--surface-hover)] transition-colors px-1 -mx-1 ${
        isCompleted ? "pointer-events-none" : ""
      }`}
    >
      {/* Time column — desktop */}
      <div className="w-14 flex-shrink-0 hidden sm:flex items-start pt-1.5 relative z-10">
        <p className="text-xs font-semibold tabular-nums" style={{ color: "var(--color-primary)" }}>
          {reminder.dueTime ? formatTime(reminder.dueTime) : ""}
        </p>
      </div>

      {/* Timeline dot */}
      <div className="relative flex-shrink-0 hidden sm:flex items-start pt-2">
        <motion.div
          animate={isCompleted ? { scale: [1, 1.4, 1], background: "#22C55E" } : {}}
          transition={{ duration: 0.3 }}
          className="h-2.5 w-2.5 rounded-full"
          style={{
            background: isCompleted
              ? "#22C55E"
              : status.type === "overdue"
              ? "var(--color-danger)"
              : "var(--color-primary)",
            boxShadow: isCompleted
              ? "0 0 0 3px rgba(34,197,94,0.2)"
              : status.type === "overdue"
              ? "0 0 0 3px rgba(239,68,68,0.2)"
              : "0 0 0 3px rgba(37,99,235,0.12)",
          }}
        />
      </div>

      {/* Content card */}
      <div
        className={`flex-1 rounded-xl px-4 py-3 transition-all ${
          isCompleted ? "" : "group-hover:shadow-sm"
        }`}
        style={{
          background: isCompleted
            ? "var(--color-success-light)"
            : status.type === "overdue"
            ? "var(--color-danger-light)"
            : "var(--bg-card)",
          border: `1px solid ${
            isCompleted
              ? "rgba(34,197,94,0.2)"
              : status.type === "overdue"
              ? "rgba(239,68,68,0.2)"
              : "var(--border-default)"
          }`,
        }}
      >
        <div className="flex items-center gap-3">
          {/* Mobile time */}
          <p className="text-xs font-semibold sm:hidden flex-shrink-0" style={{ color: "var(--color-primary)" }}>
            {reminder.dueTime ? formatTime(reminder.dueTime) : ""}
          </p>

          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-semibold truncate leading-snug ${
                isCompleted ? "line-through" : ""
              }`}
              style={{ color: isCompleted ? "var(--text-tertiary)" : "var(--text-primary)" }}
            >
              {reminder.title}
            </p>
            {reminder.subject && (
              <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
                {reminder.subject}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium leading-none ${getPriorityBg(reminder.priority)}`}>
              {reminder.priority}
            </span>

            <ReminderStatusBadge text={status.text} type={status.type} compact />

            {/* Complete button */}
            {!isCompleted && !isLoading && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onConfirm(reminder._id);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white transition-all btn-active opacity-0 group-hover:opacity-100"
                style={{
                  background: "var(--color-primary)",
                  boxShadow: "0 1px 4px -1px rgba(37, 99, 235, 0.3)",
                }}
              >
                <Check className="h-3 w-3" />
                Complete
              </button>
            )}

            {/* Loading spinner */}
            {isLoading && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white"
                style={{ background: "var(--color-primary)", opacity: 0.7 }}
              >
                <Loader2 className="h-3 w-3 animate-spin" />
                Completing
              </div>
            )}

            {/* Completed badge */}
            {isCompleted && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                style={{
                  background: "var(--color-success-light)",
                  color: "var(--color-success)",
                }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Completed
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TodaysSchedule({ reminders, loading, onComplete }: TodaysScheduleProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [completionStates, setCompletionStates] = useState<Record<string, CompletionState>>({});

  const confirmingReminder = reminders.find((r) => r._id === confirmId);

  const handleComplete = async (id: string) => {
    setConfirmId(null);
    setCompletionStates((prev) => ({ ...prev, [id]: "loading" }));

    try {
      await onComplete?.(id);
      setCompletionStates((prev) => ({ ...prev, [id]: "completed" }));
      setTimeout(() => {
        setCompletionStates((prev) => ({ ...prev, [id]: "removing" }));
      }, 1200);
    } catch {
      setCompletionStates((prev) => ({ ...prev, [id]: "idle" }));
    }
  };

  const { activeReminders, completedReminders } = useMemo(() => {
    const active = reminders.filter((r) => !r.completed);
    const completed = reminders.filter((r) => r.completed);
    return { activeReminders: active, completedReminders: completed };
  }, [reminders]);

  const sorted = useMemo(() => {
    return [...activeReminders].sort((a, b) => {
      const timeA = a.dueTime || "99:99";
      const timeB = b.dueTime || "99:99";
      return timeA.localeCompare(timeB);
    });
  }, [activeReminders]);

  if (loading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-stretch gap-4 animate-pulse py-3">
            <div className="w-16 flex flex-col items-center flex-shrink-0">
              <div className="h-3.5 w-12 rounded skeleton" />
            </div>
            <div className="w-3 flex flex-col items-center flex-shrink-0 pt-1.5">
              <div className="h-2.5 w-2.5 rounded-full skeleton" />
              <div className="flex-1 w-px my-1.5 skeleton" />
            </div>
            <div className="flex-1 rounded-xl p-3 skeleton min-h-[52px]" />
          </div>
        ))}
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: "var(--bg-tertiary)" }}>
          <span className="text-xl">🎉</span>
        </div>
        <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>
          All clear for today!
        </p>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          No reminders due today. Enjoy your day.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        {/* Timeline line */}
        <div
          className="absolute left-[59px] top-3 bottom-3 w-px hidden sm:block"
          style={{ background: "var(--border-light)" }}
        />

        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {sorted.map((r) => {
              const state = completionStates[r._id] || "idle";
              const isRemoving = state === "removing";
              const isCompleted = state === "completed";
              const isLoading = state === "loading";

              return (
                <motion.div
                  key={r._id}
                  layout
                  initial={false}
                  animate={
                    isRemoving
                      ? { opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }
                      : { opacity: 1, scale: 1 }
                  }
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <ScheduleRow
                    reminder={r}
                    isCompleted={isCompleted}
                    isLoading={isLoading}
                    onConfirm={setConfirmId}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Completed section */}
        {completedReminders.length > 0 && (
          <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border-light)" }}>
            <p className="text-[11px] font-semibold mb-2 px-1" style={{ color: "var(--color-success)" }}>
              ✅ Completed ({completedReminders.length})
            </p>
            <div className="space-y-1">
              {completedReminders.map((r) => {
                const state = completionStates[r._id];
                if (state === "removing") return null;
                return (
                  <ScheduleRow
                    key={r._id}
                    reminder={r}
                    isCompleted={true}
                    isLoading={false}
                    onConfirm={setConfirmId}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      <CompleteConfirmDialog
        open={!!confirmId}
        title={confirmingReminder?.title || ""}
        loading={!!confirmId && completionStates[confirmId] === "loading"}
        onConfirm={() => confirmId && handleComplete(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </>
  );
}
