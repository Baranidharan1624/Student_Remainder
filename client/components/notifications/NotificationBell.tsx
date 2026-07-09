"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, Check, Trash2, AlertTriangle, Calendar, Clock, CheckCircle, Edit3, PlusCircle } from "lucide-react";
import { useNotifications, type NotificationType } from "@/contexts/NotificationContext";
import { formatDateTime, cn } from "@/lib/utils";

const typeConfig: Record<NotificationType, { color: string; bg: string; Icon: any }> = {
  overdue: { color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", Icon: AlertTriangle },
  due_today: { color: "#f97316", bg: "rgba(249, 115, 22, 0.1)", Icon: Calendar },
  due_soon: { color: "#eab308", bg: "rgba(234, 179, 8, 0.1)", Icon: Clock },
  completed: { color: "#22c55e", bg: "rgba(34, 197, 94, 0.1)", Icon: CheckCircle },
  updated: { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", Icon: Edit3 },
  created: { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", Icon: PlusCircle },
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
          className="absolute right-0 mt-2 w-[340px] rounded-[20px] shadow-xl border z-50 max-h-[75vh] flex flex-col animate-scale-in overflow-hidden"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-default)",
          }}
        >
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-light)" }}>
            <h3 className="text-sm font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary-light)]" style={{ color: "var(--color-primary)" }}>
                  {unreadCount} new
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
              <div className="text-center py-12 px-4">
                <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: "var(--bg-tertiary)" }}>
                  <Bell className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
                </div>
                <h4 className="text-[15px] font-bold mb-1" style={{ color: "var(--text-primary)" }}>No new notifications</h4>
                <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>You're all caught up!</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => {
                const config = typeConfig[n.type] || { color: "var(--text-muted)", bg: "var(--bg-tertiary)", Icon: Bell };
                const Icon = config.Icon;
                return (
                  <Link
                    key={n.id}
                    href={`/dashboard/reminders/${n.reminderId}`}
                    onClick={() => {
                      markAsRead(n.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex items-start gap-3 p-4 transition-all border-b last:border-0 hover:bg-[var(--surface-hover)] relative",
                      !n.read && "bg-[var(--color-primary-light)]"
                    )}
                    style={{ borderColor: "var(--border-light)" }}
                  >
                    <div 
                      className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: config.bg }}
                    >
                      <Icon className="h-4 w-4" style={{ color: config.color }} />
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-4">
                      <p className={cn("text-[14px] leading-snug", !n.read ? "font-bold" : "font-medium")} style={{ color: "var(--text-primary)" }}>
                        {n.title}
                      </p>
                      <p className="text-[12px] mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>{n.message}</p>
                      <p className="text-[10px] mt-1.5 font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{formatDateTime(n.createdAt)}</p>
                    </div>
                    
                    {!n.read && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full" style={{ background: "var(--color-primary)" }} />
                    )}
                  </Link>
                );
              })
            )}
          </div>
          
          <div className="p-3 border-t" style={{ borderColor: "var(--border-light)", background: "var(--bg-tertiary)" }}>
            <Link 
              href="/dashboard/notifications" 
              onClick={() => setOpen(false)}
              className="block w-full py-2 text-center text-[13px] font-bold rounded-lg transition-colors hover:bg-[var(--surface-hover)]"
              style={{ color: "var(--color-primary)" }}
            >
              View All Notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
