"use client";

import { type ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";

interface WidgetProps {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

export default function Widget({
  title,
  icon,
  action,
  children,
  defaultOpen = true,
}: WidgetProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="bg-[var(--bg-card)] rounded-2xl border overflow-hidden"
      style={{
        borderColor: "var(--border-default)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none transition-colors hover:bg-[var(--surface-hover)]"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2.5">
          {icon && (
            <span style={{ color: "var(--color-primary)" }}>{icon}</span>
          )}
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {action && (
            <div onClick={(e) => e.stopPropagation()}>
              {action}
            </div>
          )}
          <ChevronDown
            className="h-4 w-4 transition-transform duration-200"
            style={{
              color: "var(--text-tertiary)",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </div>
      </div>
      {open && (
        <div className="px-5 pb-5" style={{ borderTop: "1px solid var(--border-light)" }}>
          <div className="pt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
