import { AlertCircle, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message = "Something went wrong",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div
        className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "var(--color-danger-light)" }}
      >
        <AlertCircle className="h-8 w-8" style={{ color: "var(--color-danger)" }} />
      </div>
      <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        Oops!
      </h3>
      <p className="text-sm max-w-sm mb-4" style={{ color: "var(--text-secondary)" }}>
        {message}
      </p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}
