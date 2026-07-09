"use client";

import { Clock, AlertTriangle, CheckCircle2, Timer } from "lucide-react";
import type { SmartStatusType } from "@/hooks/useSmartStatus";

interface ReminderStatusBadgeProps {
  text: string;
  type: SmartStatusType;
  compact?: boolean;
}

const STATUS_CONFIG: Record<
  SmartStatusType,
  { bg: string; color: string; icon: React.ReactNode; pulse?: boolean }
> = {
  completed: {
    bg: "var(--color-success-light)",
    color: "var(--color-success)",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  overdue: {
    bg: "var(--color-danger-light)",
    color: "var(--color-danger)",
    icon: <AlertTriangle className="h-3 w-3" />,
    pulse: true,
  },
  "due-soon": {
    bg: "#FFF7ED",
    color: "#F97316",
    icon: <Timer className="h-3 w-3" />,
    pulse: true,
  },
  "due-30min": {
    bg: "var(--color-warning-light)",
    color: "var(--color-warning)",
    icon: <Timer className="h-3 w-3" />,
  },
  "due-today": {
    bg: "var(--color-primary-light)",
    color: "var(--color-primary)",
    icon: <Clock className="h-3 w-3" />,
  },
};

export default function ReminderStatusBadge({ text, type, compact = false }: ReminderStatusBadgeProps) {
  const config = STATUS_CONFIG[type];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold leading-none ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
      } ${config.pulse ? "status-pulse" : ""}`}
      style={{
        background: config.bg,
        color: config.color,
      }}
    >
      {config.icon}
      {text}
    </span>
  );
}
