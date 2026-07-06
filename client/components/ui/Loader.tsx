import { Loader2 } from "lucide-react";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export default function Loader({ size = "md", text }: LoaderProps) {
  const sizes = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizes[size]} animate-spin`} style={{ color: "var(--color-primary)" }} />
      {text && <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{text}</p>}
    </div>
  );
}
