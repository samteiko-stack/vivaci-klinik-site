import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DsSize, DsVariant } from "./Button";

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

export interface ButtonLinkProps extends React.ComponentProps<typeof Link> {
  variant?: DsVariant;
  size?: DsSize;
  fullWidth?: boolean;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "ds-btn",
        variantClass[variant],
        variant !== "link" && sizeClass[size],
        fullWidth && "ds-btn--full",
        className
      )}
      {...props}
    />
  );
}
