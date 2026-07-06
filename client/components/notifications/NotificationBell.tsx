"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, Check, Trash2 } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { formatDateTime, cn } from "@/lib/utils";

const typeColors: Record<string, string> = {
  due_today: "bg-amber-100 text-amber-600",
  due_tomorrow: "bg-blue-100 text-blue-600",
  overdue: "bg-red-100 text-red-600",
  due_soon: "bg-indigo-100 text-indigo-600",
};

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-xl transition-colors hover:bg-[var(--surface-hover)]"
        style={{ color: "var(--text-secondary)" }}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-[var(--color-danger)] text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px] px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-2xl shadow-xl border z-50 max-h-[70vh] flex flex-col animate-scale-in"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-default)",
          }}
        >
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-light)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs" style={{ color: "var(--color-primary)" }}>
                  ({unreadCount} unread)
                </span>
              )}
            </h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-hover)]"
                  style={{ color: "var(--text-tertiary)" }}
                  title="Mark all as read"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-danger-light)]"
                  style={{ color: "var(--text-tertiary)" }}
                  title="Clear all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--text-tertiary)" }} />
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No notifications</p>
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <Link
                  key={n.id}
                  href={`/dashboard/reminders/${n.reminderId}`}
                  onClick={() => {
                    markAsRead(n.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-start gap-3 p-3 transition-colors border-b last:border-0 hover:bg-[var(--surface-hover)]",
                    !n.read && "bg-[var(--color-primary-light)]"
                  )}
                  style={{ borderColor: "var(--border-light)" }}
                >
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs", typeColors[n.type])}>
                    {n.type === "overdue" ? "!" : n.type === "due_today" ? "+" : "~"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm", !n.read && "font-medium")} style={{ color: "var(--text-primary)" }}>
                      {n.title}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{n.message}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{formatDateTime(n.createdAt)}</p>
                  </div>
                  {!n.read && <div className="h-2 w-2 rounded-full flex-shrink-0 mt-2" style={{ background: "var(--color-primary)" }} />}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
