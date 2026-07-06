"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Reminder } from "@/types";

export interface Notification {
  id: string;
  title: string;
  message: string;
  reminderId: string;
  dueDate: string;
  read: boolean;
  createdAt: string;
  type: "due_today" | "due_tomorrow" | "overdue" | "due_soon";
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, "id" | "read" | "createdAt">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  generateFromReminders: (reminders: Reminder[]) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("notifications");
    if (stored) {
      try {
        setNotifications(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = useCallback(
    (n: Omit<Notification, "id" | "read" | "createdAt">) => {
      setNotifications((prev) => {
        const exists = prev.some(
          (p) => p.reminderId === n.reminderId && p.type === n.type
        );
        if (exists) return prev;
        const newNotif: Notification = {
          ...n,
          id: crypto.randomUUID(),
          read: false,
          createdAt: new Date().toISOString(),
        };
        return [newNotif, ...prev].slice(0, 50);
      });
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const generateFromReminders = useCallback(
    (reminders: Reminder[]) => {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      reminders.forEach((r) => {
        if (r.completed) return;
        const due = new Date(r.dueDate);
        const dueStr = due.toISOString().split("T")[0];

        if (dueStr === todayStr) {
          addNotification({
            title: r.title,
            message: `${r.title} is due today`,
            reminderId: r._id,
            dueDate: r.dueDate,
            type: "due_today",
          });
        } else if (dueStr === tomorrowStr) {
          addNotification({
            title: r.title,
            message: `${r.title} is due tomorrow`,
            reminderId: r._id,
            dueDate: r.dueDate,
            type: "due_tomorrow",
          });
        } else if (due < now) {
          const daysAgo = Math.ceil(
            (now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
          );
          addNotification({
            title: r.title,
            message: `${r.title} is overdue by ${daysAgo} day${daysAgo > 1 ? "s" : ""}`,
            reminderId: r._id,
            dueDate: r.dueDate,
            type: "overdue",
          });
        } else {
          const daysUntil = Math.ceil(
            (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysUntil <= 7) {
            addNotification({
              title: r.title,
              message: `${r.title} is due in ${daysUntil} day${daysUntil > 1 ? "s" : ""}`,
              reminderId: r._id,
              dueDate: r.dueDate,
              type: "due_soon",
            });
          }
        }
      });
    },
    [addNotification]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        generateFromReminders,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  return ctx;
}
