import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: "var(--text-tertiary)" }}>
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full rounded-2xl border px-4 py-2.5 text-sm
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-0
              ${icon ? "pl-10" : ""}
              ${error
                ? "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/20"
                : "border-[var(--border-default)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
              }
              ${className}
            `}
            style={{
              background: "var(--bg-tertiary)",
              color: "var(--text-primary)",
            }}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs font-medium" style={{ color: "var(--color-danger)" }}>{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
