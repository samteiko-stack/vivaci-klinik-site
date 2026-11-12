"use client";

import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type PillVariant =
  | "brand"
  | "success"
  | "danger"
  | "warning"
  | "admin"
  | "agent"
  | "purple"
  | "muted"
  | "custom";

export interface PillProps extends Omit<React.HTMLAttributes<HTMLElement>, "color"> {
  label?: string;
  variant?: PillVariant;
  color?: string;
  bg?: string;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  size?: "sm" | "md";
  dot?: boolean;
  /** Filter toggle — renders as button when set with onClick and/or selected */
  selected?: boolean;
  activeVariant?: Exclude<PillVariant, "custom" | "muted">;
  disabled?: boolean;
  onClick?: () => void;
}

const variantClass: Record<Exclude<PillVariant, "custom">, string> = {
  brand: "ds-pill-tag--brand",
  success: "ds-pill-tag--success",
  danger: "ds-pill-tag--danger",
  warning: "ds-pill-tag--warning",
  admin: "ds-pill-tag--admin",
  agent: "ds-pill-tag--agent",
  purple: "ds-pill-tag--purple",
  muted: "ds-pill-tag--muted",
};

const filterActiveClass: Record<Exclude<PillVariant, "custom" | "muted">, string> = {
  brand: "ds-pill-filter--brand",
  success: "ds-pill-filter--brand",
  danger: "ds-pill-filter--brand",
  warning: "ds-pill-filter--brand",
  admin: "ds-pill-filter--brand",
  agent: "ds-pill-filter--brand",
  purple: "ds-pill-filter--purple",
};

function usePillVars(
  ref: React.RefObject<HTMLElement | null>,
  color: string,
  bg: string,
  enabled: boolean
) {
  useLayoutEffect(() => {
    if (!enabled || !ref.current) return;
    ref.current.style.setProperty("--pill-fg", color);
    ref.current.style.setProperty("--pill-bg", bg);
  }, [color, bg, enabled]);
}

/** Single pill component for tags, statuses, sources, counts, and filter toggles */
export function Pill({
  label,
  children,
  variant = "muted",
  color,
  bg,
  icon: Icon,
  size = "sm",
  dot,
  className,
  selected,
  activeVariant = "brand",
  disabled,
  onClick,
  ...props
}: PillProps) {
  const content = label ?? children;
  const isFilter = onClick != null || selected !== undefined;
  const hasCustomColors = !!(color && bg);
  const ref = useRef<HTMLSpanElement>(null);

  usePillVars(ref, color ?? "", bg ?? "", hasCustomColors && !isFilter);

  if (isFilter) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "ds-pill-filter",
          selected ? filterActiveClass[activeVariant] : "ds-pill-filter--idle",
          className
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      ref={ref}
      className={cn(
        "ds-pill-tag",
        size === "md" && "ds-pill-tag--md",
        dot && "ds-pill-tag--dot",
        !hasCustomColors && variant !== "custom" && variantClass[variant],
        className
      )}
      {...(props as React.HTMLAttributes<HTMLSpanElement>)}
    >
      {Icon && (
        <span className="ds-pill-tag__icon">
          <Icon className="ds-icon-xs" strokeWidth={2} />
        </span>
      )}
      {content}
    </span>
  );
}

export function PillGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("ds-chip-group", className)}>{children}</div>;
}
