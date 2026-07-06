import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg" | "none";
  hover?: boolean;
}

export default function Card({
  children,
  className = "",
  padding = "md",
  hover = false,
}: CardProps) {
  const paddings = {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`
        bg-[var(--bg-card)] rounded-2xl border border-[var(--border-default)]
        shadow-[var(--shadow-sm)] transition-all duration-200
        ${hover ? "card-hover" : ""}
        ${paddings[padding]} ${className}
      `}
    >
      {children}
    </div>
  );
}
