import { cn } from "@/lib/utils";

export type UnreadBadgeVariant = "dot" | "count" | "nav" | "overlay" | "bell";

function formatCount(count: number, max: number): string {
  return count > max ? `${max}+` : String(count);
}

export interface UnreadBadgeProps {
  /** Omit or 0 hides count variants; dot variant ignores count. */
  count?: number;
  variant?: UnreadBadgeVariant;
  /** Cap before showing "+" suffix (overlay defaults to 9). */
  max?: number;
  className?: string;
  title?: string;
}

export function UnreadBadge({
  count = 0,
  variant = "count",
  max,
  className,
  title,
}: UnreadBadgeProps) {
  if (variant === "dot") {
    return (
      <span
        className={cn("ds-unread-badge", "ds-unread-badge--dot", className)}
        title={title}
        aria-hidden
      />
    );
  }

  if (count <= 0) return null;

  const cap = max ?? (variant === "overlay" ? 9 : 99);
  const label = formatCount(count, cap);

  return (
    <span
      className={cn("ds-unread-badge", `ds-unread-badge--${variant}`, className)}
      data-digits={label.length}
      title={title ?? `${count} unread`}
      aria-label={title ?? `${count} unread`}
    >
      {label}
    </span>
  );
}
