"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Reminder } from "@/types";

interface BrowserNotificationState {
  permission: NotificationPermission;
  requestPermission: () => Promise<void>;
}

export function useBrowserNotifications(): BrowserNotificationState {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  }, []);

  return { permission, requestPermission };
}

const notifiedIds = new Set<string>();

export function useReminderNotifications(reminders: Reminder[]) {
  const { permission } = useBrowserNotifications();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkAndNotify = useCallback(() => {
    if (permission !== "granted") return;
    const now = new Date();

    reminders.forEach((r) => {
      if (r.completed) return;
      const due = new Date(r.dueDate);
      const diffMs = due.getTime() - now.getTime();
      const diffMin = diffMs / (1000 * 60);

      const notifyKey = (type: string) => `${r._id}_${type}`;

      if (diffMin > 0 && diffMin <= 30 && !notifiedIds.has(notifyKey("30m"))) {
        notifiedIds.add(notifyKey("30m"));
        new Notification(`🔔 ${r.title}`, {
          body: `Due in 30 minutes`,
          icon: "/bell.png",
          tag: notifyKey("30m"),
        });
      }

      if (diffMin > 0 && diffMin <= 60 && diffMin > 30 && !notifiedIds.has(notifyKey("1h"))) {
        notifiedIds.add(notifyKey("1h"));
        new Notification(`🔔 ${r.title}`, {
          body: `Due in 1 hour`,
          icon: "/bell.png",
          tag: notifyKey("1h"),
        });
      }

      if (diffMs <= 0 && diffMs > -(1000 * 60) && !notifiedIds.has(notifyKey("now"))) {
        notifiedIds.add(notifyKey("now"));
        new Notification(`🔔 ${r.title}`, {
          body: `Due now!`,
          icon: "/bell.png",
          tag: notifyKey("now"),
        });
      }
    });
  }, [reminders, permission]);

  useEffect(() => {
    checkAndNotify();
    intervalRef.current = setInterval(checkAndNotify, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkAndNotify]);
}
