"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";

interface CompleteConfirmDialogProps {
  open: boolean;
  title: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CompleteConfirmDialog({
  open,
  title,
  loading = false,
  onConfirm,
  onCancel,
}: CompleteConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !loading) onCancel();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onCancel, loading]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 modal-backdrop"
        onClick={loading ? undefined : onCancel}
      />
      <div
        ref={dialogRef}
        className="relative rounded-2xl shadow-xl max-w-sm w-full p-6 animate-scale-in border"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="flex flex-col items-center text-center mb-5">
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "var(--color-primary-light)" }}
          >
            <CheckCircle2 className="h-6 w-6" style={{ color: "var(--color-primary)" }} />
          </div>
          <h3 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            Complete Reminder?
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Have you finished <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{title}</span>?
            <br />
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              This action will mark the reminder as completed.
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all btn-active"
            style={{
              background: "var(--bg-tertiary)",
              color: "var(--text-secondary)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all btn-active flex items-center justify-center gap-2"
            style={{
              background: loading ? "var(--color-primary)" : "var(--color-primary)",
              opacity: loading ? 0.8 : 1,
              boxShadow: "0 2px 8px -2px rgba(37, 99, 235, 0.4)",
            }}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Completing...
              </>
            ) : (
              "Yes, Complete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
