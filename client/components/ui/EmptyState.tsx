import { ClipboardList } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div
        className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "var(--bg-tertiary)" }}
      >
        {icon || <ClipboardList className="h-8 w-8" style={{ color: "var(--text-tertiary)" }} />}
      </div>
      <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      <p className="text-sm max-w-sm mb-4" style={{ color: "var(--text-secondary)" }}>
        {description}
      </p>
      {action}
    </div>
  );
}
