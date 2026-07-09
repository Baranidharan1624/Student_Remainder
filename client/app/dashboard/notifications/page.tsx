"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import { useNotifications, type NotificationType } from "@/contexts/NotificationContext";
import { formatDateTime, cn } from "@/lib/utils";
import { 
  Bell, Check, Trash2, AlertTriangle, Calendar, Clock, CheckCircle, Edit3, PlusCircle 
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const typeConfig: Record<NotificationType, { color: string; bg: string; Icon: any }> = {
  overdue: { color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", Icon: AlertTriangle },
  due_today: { color: "#f97316", bg: "rgba(249, 115, 22, 0.1)", Icon: Calendar },
  due_soon: { color: "#eab308", bg: "rgba(234, 179, 8, 0.1)", Icon: Clock },
  completed: { color: "#22c55e", bg: "rgba(34, 197, 94, 0.1)", Icon: CheckCircle },
  updated: { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", Icon: Edit3 },
  created: { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", Icon: PlusCircle },
};

function NotificationsContent() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-secondary)" }}>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 animate-fade-in">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "var(--text-muted)" }}>
              Inbox
            </p>
            <h1 className="text-[32px] sm:text-[40px] font-extrabold tracking-tight mb-2" style={{ color: "var(--text-primary)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
              Notifications
            </h1>
            <p className="text-[15px]" style={{ color: "var(--text-secondary)", fontWeight: 400 }}>
              You have <span className="font-bold" style={{ color: "var(--color-primary)" }}>{unreadCount} unread</span> alerts.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-light)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}
              >
                <Check className="h-4 w-4" /> Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearNotifications}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}
              >
                <Trash2 className="h-4 w-4" /> Clear all
              </button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="py-24 text-center animate-fade-in">
            <div className="mx-auto w-16 h-16 rounded-[20px] flex items-center justify-center mb-6" style={{ background: "var(--bg-card)", boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
              <Bell className="h-6 w-6" style={{ color: "var(--text-muted)" }} />
            </div>
            <h2 className="text-[20px] font-extrabold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>No new notifications</h2>
            <p className="text-[15px]" style={{ color: "var(--text-secondary)" }}>
              You're all caught up! New alerts will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n, i) => {
              const config = typeConfig[n.type] || { color: "var(--text-muted)", bg: "var(--bg-tertiary)", Icon: Bell };
              const Icon = config.Icon;
              
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.02 }}
                >
                  <Link
                    href={`/dashboard/reminders/${n.reminderId}`}
                    onClick={() => markAsRead(n.id)}
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-[20px] transition-all hover:-translate-y-0.5 relative overflow-hidden group",
                      !n.read ? "bg-[var(--bg-card)] shadow-sm" : "bg-[var(--bg-card)] opacity-70 hover:opacity-100"
                    )}
                    style={{ border: "1px solid var(--border-light)" }}
                  >
                    {!n.read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: "var(--color-primary)" }} />
                    )}
                    
                    <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                      <div 
                        className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: config.bg }}
                      >
                        <Icon className="h-5 w-5" style={{ color: config.color }} />
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-4">
                        <p className={cn("text-[16px] mb-1 leading-snug", !n.read ? "font-extrabold" : "font-semibold")} style={{ color: "var(--text-primary)" }}>
                          {n.title}
                        </p>
                        <p className="text-[14px]" style={{ color: "var(--text-secondary)" }}>{n.message}</p>
                      </div>
                    </div>
                    
                    <div className="sm:text-right mt-2 sm:mt-0 pl-16 sm:pl-0 flex-shrink-0">
                      <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                        {formatDateTime(n.createdAt)}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsContent />
    </ProtectedRoute>
  );
}
