import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-2xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed btn-active";

    const variants = {
      primary:
        "text-white shadow-lg hover:shadow-xl focus-visible:ring-[var(--color-primary)]",
      secondary:
        "border focus-visible:ring-gray-400",
      ghost:
        "hover:bg-[var(--surface-hover)] focus-visible:ring-gray-400",
      danger:
        "text-white shadow-lg hover:shadow-xl focus-visible:ring-red-500",
      outline:
        "border bg-transparent hover:bg-[var(--surface-hover)] focus-visible:ring-[var(--color-primary)]",
    };

    const sizes = {
      sm: "px-3.5 py-1.5 text-sm gap-1.5",
      md: "px-5 py-2.5 text-sm gap-2",
      lg: "px-6 py-3 text-base gap-2",
      icon: "p-2.5",
    };

    const variantStyles = {
      primary: "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-[var(--shadow-md)]",
      secondary: "bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-[var(--border-default)] hover:bg-[var(--surface-hover)]",
      ghost: "text-[var(--text-secondary)]",
      danger: "bg-[var(--color-danger)] hover:bg-red-600 text-white shadow-[var(--shadow-md)]",
      outline: "border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${variants[variant]} ${variantStyles[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
