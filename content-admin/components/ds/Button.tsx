import { cn } from "@/lib/utils";
import { Spinner } from "./Feedback";

export type DsVariant =
  | "primary"
  | "brand"
  | "accent"
  | "secondary"
  | "ghost"
  | "danger"
  | "danger-ghost"
  | "link";

export type DsSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: DsVariant;
  size?: DsSize;
  fullWidth?: boolean;
  loading?: boolean;
}

const variantClass: Record<DsVariant, string> = {
  primary: "ds-btn--primary",
  brand: "ds-btn--brand",
  accent: "ds-btn--accent",
  secondary: "ds-btn--secondary",
  ghost: "ds-btn--ghost",
  danger: "ds-btn--danger",
  "danger-ghost": "ds-btn--danger-ghost",
  link: "ds-btn--link",
};

const sizeClass: Record<DsSize, string> = {
  sm: "ds-btn--sm",
  md: "ds-btn--md",
  lg: "ds-btn--lg",
  icon: "ds-btn--icon",
};

const brandSpinnerClass: Partial<Record<DsVariant, string>> = {
  brand: "ds-btn__spinner--on-brand",
  primary: "ds-btn__spinner--on-brand",
  accent: "ds-btn__spinner--on-brand",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  loading = false,
  className,
  type = "button",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "ds-btn",
        variantClass[variant],
        variant !== "link" && sizeClass[size],
        fullWidth && "ds-btn--full",
        loading && "ds-btn--loading",
        className
      )}
      {...props}
    >
      {loading && (
        <Spinner
          size="sm"
          className={cn("ds-btn__spinner", brandSpinnerClass[variant])}
        />
      )}
      {children}
    </button>
  );
}
