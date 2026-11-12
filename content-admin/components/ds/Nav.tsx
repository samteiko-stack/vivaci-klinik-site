"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Text } from "./Text";
import { UnreadBadge } from "./UnreadBadge";

export function NavSection({
  label,
  children,
  className,
  divided,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
  divided?: boolean;
}) {
  return (
    <div className={cn("ds-nav-section", divided && "ds-nav-section--divided", className)}>
      {label && (
        <div className="ds-nav-section-label">
          <Text variant="overline" as="div">
            {label}
          </Text>
        </div>
      )}
      {children}
    </div>
  );
}

export function NavItem({
  href,
  label,
  icon: Icon,
  active,
  disabled,
  disabledTitle,
  badge,
  onPrefetch,
  className,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  active?: boolean;
  disabled?: boolean;
  disabledTitle?: string;
  badge?: number;
  onPrefetch?: () => void;
  className?: string;
}) {
  const itemClassName = cn(
    "ds-nav-item",
    active && "ds-nav-item--active",
    disabled && "ds-nav-item--disabled",
    className
  );

  const content = (
    <>
      <span className="ds-nav-item__icon-slot" aria-hidden>
        <Icon
          className={cn(
            "ds-nav-item__icon",
            active ? "ds-nav-item__icon--active" : "ds-nav-item__icon--idle",
            disabled && "ds-nav-item__icon--disabled"
          )}
          strokeWidth={1.75}
        />
      </span>
      <span className="ds-nav-item__label">{label}</span>
      {badge != null && badge > 0 && <UnreadBadge count={badge} variant="nav" />}
      {active && <span className="ds-nav-dot" aria-hidden />}
    </>
  );

  if (disabled) {
    return (
      <span
        className={itemClassName}
        aria-disabled="true"
        title={disabledTitle}
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
      className={itemClassName}
    >
      {content}
    </Link>
  );
}

export function NavExternalItem({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="ds-nav-item"
    >
      <span className="ds-nav-item__icon-slot" aria-hidden>
        <Icon className="ds-nav-item__icon ds-nav-item__icon--idle" strokeWidth={1.75} />
      </span>
      <span className="ds-nav-item__label">{label}</span>
    </a>
  );
}

export function NavScopeItem({
  href,
  label,
  active,
  count,
  onNavigate,
  onPrefetch,
}: {
  href: string;
  label: string;
  active?: boolean;
  count?: number;
  onNavigate?: () => void;
  onPrefetch?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
      className={cn("ds-nav-item", "ds-nav-item--scope", active && "ds-nav-item--active")}
    >
      <span className="ds-nav-item__label">{label}</span>
      {count !== undefined && (
        <span className="ds-nav-scope-count" aria-label={`${count} items`}>
          {count}
        </span>
      )}
    </Link>
  );
}

export function ListRailNavButton({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active?: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("ds-nav-item", "ds-list-rail-nav-item", active && "ds-nav-item--active")}
    >
      <span className="ds-nav-item__label">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="ds-list-rail-count" aria-label={`${count} items`}>
          {count}
        </span>
      )}
      {active && <span className="ds-nav-dot" aria-hidden />}
    </button>
  );
}

export function NavItemPreview({
  label,
  icon: Icon,
  active,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  active?: boolean;
}) {
  return (
    <div className={cn("ds-nav-item", active && "ds-nav-item--active", "ds-nav-item--preview")}>
      <span className="ds-nav-item__icon-slot" aria-hidden>
        <Icon
          className={cn("ds-nav-item__icon", active ? "ds-nav-item__icon--active" : "ds-nav-item__icon--idle")}
          strokeWidth={1.75}
        />
      </span>
      <span className="ds-nav-item__label">{label}</span>
      {active && <span className="ds-nav-dot" aria-hidden />}
    </div>
  );
}
