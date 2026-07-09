import { useMemo } from "react";
import { useCountdown } from "./useCountdown";

export type SmartStatusType = "completed" | "overdue" | "due-soon" | "due-30min" | "due-today";

export interface SmartStatus {
  text: string;
  type: SmartStatusType;
}

export function useSmartStatus(
  dueDate: string,
  dueTime: string | undefined,
  completed: boolean
): SmartStatus {
  const tick = useCountdown();

  return useMemo(() => {
    if (completed) {
      return { text: "Completed", type: "completed" as SmartStatusType };
    }

    const now = new Date();
    const datePart = new Date(dueDate);
    let dueDateTime: Date;

    if (dueTime) {
      const [h, m] = dueTime.split(":").map(Number);
      dueDateTime = new Date(datePart);
      dueDateTime.setHours(h, m, 0, 0);
    } else {
      dueDateTime = new Date(datePart);
      dueDateTime.setHours(23, 59, 59, 999);
    }

    const diffMs = dueDateTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) {
      const absMins = Math.abs(diffMins);
      if (absMins >= 1440) {
        const days = Math.floor(absMins / 1440);
        return { text: `${days}d overdue`, type: "overdue" as SmartStatusType };
      }
      const hrs = Math.floor(absMins / 60);
      const mins = absMins % 60;
      if (hrs > 0) {
        return { text: `${hrs}h ${mins}m overdue`, type: "overdue" as SmartStatusType };
      }
      return { text: `${mins}m overdue`, type: "overdue" as SmartStatusType };
    }

    if (diffMins === 0) {
      return { text: "Due now", type: "due-soon" as SmartStatusType };
    }

    if (diffMins <= 30) {
      return { text: `Due in ${diffMins} min`, type: "due-30min" as SmartStatusType };
    }

    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hrs < 12) {
      return { text: `Due in ${hrs}h ${mins}m`, type: "due-today" as SmartStatusType };
    }

    return { text: "Due today", type: "due-today" as SmartStatusType };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, dueDate, dueTime, completed]);
}
