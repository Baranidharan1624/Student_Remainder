"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { Reminder } from "@/types";
import { isSameDay } from "@/lib/utils";

export type NotificationType = 
  | "overdue" 
  | "due_today" 
  | "due_soon" 
  | "completed" 
  | "updated" 
  | "created"
  | "delivery_success"
  | "delivery_failed";

export interface Notification {
  id: string;
  title: string;
  message: string;
  reminderId: string;
  dueDate: string;
  read: boolean;
  createdAt: string;
  type: NotificationType;
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
  const previousRemindersRef = useRef<Map<string, Reminder>>(new Map());
  const initialLoadRef = useRef(true);

  // Load from local storage
  useEffect(() => {
    const stored = localStorage.getItem("notifications");
    if (stored) {
      try {
        const parsed: Notification[] = JSON.parse(stored);
        
        // Clean up expired notifications
        const now = new Date().getTime();
        const validNotifications = parsed.filter((n) => {
          const ageHours = (now - new Date(n.createdAt).getTime()) / (1000 * 60 * 60);
          const ageDays = ageHours / 24;
          
          // Remove read notifications older than 7 days
          if (n.read && ageDays > 7) return false;
          // Remove completed/updated/created notifications older than 24 hours
          if (["completed", "updated", "created"].includes(n.type) && ageHours > 24) return false;
          
          return true;
        });

        // Sort by newest first
        validNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(validNotifications);
      } catch {
        // ignore
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = useCallback(
    (n: Omit<Notification, "id" | "read" | "createdAt">) => {
      setNotifications((prev) => {
        // Prevent duplicate events for the same reminder of the same type
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

        const updated = [newNotif, ...prev];
        // Sort newest first just in case
        updated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return updated.slice(0, 100); // Keep max 100 in memory
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
      const prevMap = previousRemindersRef.current;
      const currentMap = new Map<string, Reminder>();
      const isInitial = initialLoadRef.current;
      
      reminders.forEach((r) => {
        currentMap.set(r._id, r);
        const prev = prevMap.get(r._id);
        const due = new Date(r.dueDate);
        const isCompleted = r.completed;

        // Skip generating state-change events on initial load to avoid spamming the user on page refresh
        if (!isInitial) {
          if (!prev) {
            // New reminder created
            addNotification({
              title: "New Reminder",
              message: `"${r.title}" was created`,
              reminderId: r._id,
              dueDate: r.dueDate,
              type: "created",
            });
          } else {
            // Check completed status flip
            if (!prev.completed && r.completed) {
              addNotification({
                title: "Task Completed",
                message: `"${r.title}" was marked as completed`,
                reminderId: r._id,
                dueDate: r.dueDate,
                type: "completed",
              });
            }
            // Check updated (but not completed flip)
            else if (prev.updatedAt !== r.updatedAt && r.completed === prev.completed && !r.completed) {
              addNotification({
                title: "Reminder Updated",
                message: `"${r.title}" was updated`,
                reminderId: r._id,
                dueDate: r.dueDate,
                type: "updated",
              });
            }

            // Check delivery status changes
            if (r.deliveryStatus && prev.deliveryStatus) {
              // WhatsApp Status
              if (prev.deliveryStatus.whatsappStatus !== "Sent" && r.deliveryStatus.whatsappStatus === "Sent") {
                addNotification({
                  title: "WhatsApp Sent",
                  message: `WhatsApp reminder sent for "${r.title}"`,
                  reminderId: r._id,
                  dueDate: r.dueDate,
                  type: "delivery_success",
                });
              } else if (prev.deliveryStatus.whatsappStatus !== "Failed" && r.deliveryStatus.whatsappStatus === "Failed") {
                addNotification({
                  title: "WhatsApp Failed",
                  message: `Failed to send WhatsApp reminder for "${r.title}"`,
                  reminderId: r._id,
                  dueDate: r.dueDate,
                  type: "delivery_failed",
                });
              }

              // Email Status
              if (prev.deliveryStatus.emailStatus !== "Sent" && r.deliveryStatus.emailStatus === "Sent") {
                addNotification({
                  title: "Email Sent",
                  message: `Email reminder sent for "${r.title}"`,
                  reminderId: r._id,
                  dueDate: r.dueDate,
                  type: "delivery_success",
                });
              } else if (prev.deliveryStatus.emailStatus !== "Failed" && r.deliveryStatus.emailStatus === "Failed") {
                addNotification({
                  title: "Email Failed",
                  message: `Failed to send email reminder for "${r.title}"`,
                  reminderId: r._id,
                  dueDate: r.dueDate,
                  type: "delivery_failed",
                });
              }
            }
          }
        }

        // --- Time-based events (evaluate regardless of initial load) ---
        if (!isCompleted) {
          const hoursUntil = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
          
          if (due < now) {
            // Overdue
            addNotification({
              title: "Overdue Reminder",
              message: `"${r.title}" is overdue`,
              reminderId: r._id,
              dueDate: r.dueDate,
              type: "overdue",
            });
          } else if (hoursUntil <= 0.5) {
            // Due within 30 minutes
            addNotification({
              title: "Due Very Soon",
              message: `"${r.title}" is due in less than 30 minutes`,
              reminderId: r._id,
              dueDate: r.dueDate,
              type: "due_soon",
            });
          } else if (isSameDay(due, now)) {
            // Due Today (but more than 30 mins away)
            addNotification({
              title: "Due Today",
              message: `"${r.title}" is due later today`,
              reminderId: r._id,
              dueDate: r.dueDate,
              type: "due_today",
            });
          }
        }
      });

      previousRemindersRef.current = currentMap;
      initialLoadRef.current = false;
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
