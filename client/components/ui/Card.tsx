import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

export default function Card({
  children,
  className = "",
  padding = "md",
}: CardProps) {
  const paddings = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`
        bg-white rounded-2xl shadow-sm border border-gray-100
        transition-all duration-200 hover:shadow-md
        ${paddings[padding]} ${className}
      `}
    >
      {children}
    </div>
  );
}
