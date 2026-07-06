"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, Check, Trash2 } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { formatDateTime, cn } from "@/lib/utils";

const typeColors = {
  due_today: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  due_tomorrow: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  overdue: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  due_soon: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
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
        className="relative p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 max-h-[70vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                  ({unreadCount} unread)
                </span>
              )}
            </h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  title="Mark all as read"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
                <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No notifications</p>
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
                    "flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0",
                    !n.read && "bg-blue-50/50 dark:bg-blue-900/10"
                  )}
                >
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs", typeColors[n.type])}>
                    {n.type === "overdue" ? "❌" : n.type === "due_today" ? "🔔" : "📅"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm", n.read ? "text-gray-600 dark:text-gray-400" : "font-medium text-gray-900 dark:text-gray-100")}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{n.message}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{formatDateTime(n.createdAt)}</p>
                  </div>
                  {!n.read && <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
