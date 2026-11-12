"use client";

import { useState } from "react";
import { ChevronDown } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Card, Flex, Stack } from "./Layout";
import { PageHeader } from "./Shell";
import { SettingsSectionListProvider } from "./settings-section-list-context";
import { Heading, Text } from "./Text";

export function SidePanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("ds-side-panel", className)}>{children}</div>;
}

export function SidePanelScrollArea({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("ds-side-panel-scroll-area", className)}>{children}</div>;
}

/** Files + notes drawer: one open section expands to fill remaining panel height. */
export function SidePanelDrawer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("ds-side-panel-drawer", className)}>{children}</div>;
}

export function SidePanelFields({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("ds-side-panel-fields", className)}>{children}</div>;
}

export function SidePanelHeader({
  avatar,
  title,
  meta,
  className,
}: {
  avatar: React.ReactNode;
  title: string;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("ds-side-panel-header", className)}>
      {avatar}
      <div className="ds-side-panel-header-text">
        <p className="ds-side-panel-title">{title}</p>
        {meta && <p className="ds-side-panel-meta">{meta}</p>}
      </div>
    </div>
  );
}

export function InlinePanelHeader({
  icon,
  title,
  subtitle,
  className,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("ds-inline-panel-header", className)}>
      <div className="ds-inline-panel-header__icon">{icon}</div>
      <div className="ds-inline-panel-header__text">
        <h2 className="ds-inline-panel-header__title">{title}</h2>
        {subtitle != null && subtitle !== "" && (
          <p className="ds-inline-panel-header__subtitle">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export function InlinePanelSectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <h3 className={cn("ds-inline-panel-section-label", className)}>{children}</h3>;
}

function sectionTitle(title: string, count?: number) {
  return count !== undefined ? `${title} · ${count}` : title;
}

export function SidePanelSection({
  title,
  count,
  children,
  className,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("ds-side-panel-section", className)}>
      <h2 className="ds-side-panel-section-title">{sectionTitle(title, count)}</h2>
      <div className="ds-side-panel-section-body">{children}</div>
    </section>
  );
}

export function CollapsibleSidePanelSection({
  title,
  count,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  children,
  className,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  function setOpen(next: boolean) {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  }

  return (
    <section
      className={cn(
        "ds-side-panel-section",
        "ds-side-panel-section--collapsible",
        open && "ds-side-panel-section--open",
        className
      )}
    >
      <button
        type="button"
        className="ds-side-panel-section-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="ds-side-panel-section-title">{sectionTitle(title, count)}</span>
        <ChevronDown
          className={cn("ds-side-panel-section-chevron ds-icon-sm", open && "ds-side-panel-section-chevron--open")}
          aria-hidden
        />
      </button>
      <div
        className={cn("ds-side-panel-section-collapse", open && "ds-side-panel-section-collapse--open")}
        aria-hidden={!open}
      >
        <div className="ds-side-panel-section-collapse__inner" inert={open ? undefined : true}>
          <div className="ds-side-panel-section-body">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function DetailList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <dl className={cn("ds-detail-list", className)}>{children}</dl>;
}

export function DetailItem({
  label,
  children,
  empty,
  emptyText = "—",
  align = "center",
  className,
}: {
  label: string;
  children?: React.ReactNode;
  empty?: boolean;
  emptyText?: string;
  align?: "center" | "start";
  className?: string;
}) {
  return (
    <div className={cn("ds-detail-item", align === "start" && "ds-detail-item--start", className)}>
      <dt className="ds-detail-label">{label}</dt>
      <dd className="ds-detail-value">
        {empty ? <span className="ds-detail-empty">{emptyText}</span> : children}
      </dd>
    </div>
  );
}

/**
 * Numbered step in a setup guide (integrations, voice, WhatsApp).
 * The body only gets bottom spacing when extra content follows it, so every
 * guide keeps the same rhythm regardless of who wrote the step.
 */
export function SetupStep({
  step,
  title,
  body,
  children,
  className,
}: {
  step?: number;
  title: string;
  body?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("ds-settings-step", className)}>
      <Heading level={3} className="ds-settings-step-title">
        {step != null ? `${step}. ${title}` : title}
      </Heading>
      {body != null && (
        <Text
          className={cn("ds-settings-step-body", children && "ds-settings-step-body--spaced")}
        >
          {body}
        </Text>
      )}
      {children ? <div className="ds-settings-step-content">{children}</div> : null}
    </div>
  );
}

/** Titled card used for every settings section — one rhythm across all settings tabs. */
export function SettingsSection({
  title,
  description,
  actions,
  list,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  /** CRM list (toolbar + table) nested in the card — clinic detail, form submissions, etc. */
  list?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <SettingsSectionListProvider value={!!list}>
      <Card padded className={cn("ds-settings-section", list && "ds-settings-section--list", className)}>
        {(title || description || actions) && (
          <div
            className={cn(
              "ds-settings-section-header",
              actions && "ds-settings-section-header--with-actions"
            )}
          >
            <div className="ds-settings-section-header__text">
              {title ? (
                <Heading level={3} className="ds-settings-section-title">
                  {title}
                </Heading>
              ) : null}
              {description ? (
                <Text variant="muted" className="ds-settings-section-desc">
                  {description}
                </Text>
              ) : null}
            </div>
            {actions ? <div className="ds-settings-section-header__actions">{actions}</div> : null}
          </div>
        )}
        <div className={cn("ds-settings-section-body", list && "ds-settings-section-body--list")}>
          {children}
        </div>
      </Card>
    </SettingsSectionListProvider>
  );
}

export type SettingsSubnavItem = {
  id: string;
  label: string;
};

/** Side nav for multi-section settings pages (forms editor, etc.). */
export function SettingsSubnav({
  items,
  active,
  onChange,
  ariaLabel,
}: {
  items: SettingsSubnavItem[];
  active: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}) {
  return (
    <nav className="ds-settings-subnav" aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={cn(
            "ds-settings-subnav__item",
            active === item.id && "ds-settings-subnav__item--active"
          )}
          aria-current={active === item.id ? "true" : undefined}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

/** Side nav + main panel for settings with multiple sections. */
export function SettingsLayout({
  nav,
  children,
  className,
}: {
  nav: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("ds-settings-layout", className)}>
      {nav}
      <div className="ds-settings-layout__main">{children}</div>
    </div>
  );
}

export type SettingsContentWidth = "560" | "600" | "640" | "680" | "700" | "900" | "wide";

/** Profile, clinic detail, and other single-column edit pages — shared header + width token. */
export function SettingsPageShell({
  title,
  subtitle,
  backAction,
  showPageTitle = true,
  hideHeader = false,
  width = "640",
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  backAction?: React.ReactNode;
  /** False when the entity name already lives in top nav (e.g. contact directory). */
  showPageTitle?: boolean;
  /** True when top nav owns back + title (Kepler-style entity pages). */
  hideHeader?: boolean;
  width?: SettingsContentWidth;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("ds-settings-page", className)}>
      {!hideHeader ? (
        <PageHeader
          className={cn("ds-settings-header", !showPageTitle && "ds-settings-header--nav-only")}
        >
          <Flex between className="ds-settings-header__row">
            <div className="ds-settings-header__intro">
              {showPageTitle ? (
                <Heading level={1} className="ds-settings-title">
                  {title}
                </Heading>
              ) : (
                <Heading level={1} className="ds-sr-only">
                  {title}
                </Heading>
              )}
              {subtitle ? (
                <Text variant="body-sm" className="ds-settings-subtitle">
                  {subtitle}
                </Text>
              ) : null}
            </div>
            {backAction ? <div className="ds-settings-header__actions">{backAction}</div> : null}
          </Flex>
        </PageHeader>
      ) : (
        <Heading level={1} className="ds-sr-only">
          {title}
        </Heading>
      )}
      <div className="ds-settings-page__body">
        <SettingsContent width={width}>{children}</SettingsContent>
      </div>
    </div>
  );
}

/** Scrollable settings column — same max-width tokens everywhere (forms, CRM settings). */
export function SettingsContent({
  width = "640",
  className,
  children,
}: {
  width?: SettingsContentWidth;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("ds-settings-content", `ds-settings-content--${width}`, className)}>
      {children}
    </div>
  );
}

/** Vertical stack of SettingsSection cards. */
export function SettingsStack({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <Stack className={cn("ds-settings-stack", className)}>{children}</Stack>;
}

/** Standard field stack inside a SettingsSection — spacing + label rhythm. */
export function SettingsFields({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Stack gap="md" className={cn("ds-settings-fields", className)}>
      {children}
    </Stack>
  );
}

/** Two-column field grid on settings / entity edit pages (matches settings panel rhythm). */
export function SettingsFormGrid({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("ds-settings-grid-2", className)}>{children}</div>;
}

export function StatCard({
  label,
  value,
  variant = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  variant?: "default" | "success";
  className?: string;
}) {
  return (
    <div className={cn("ds-stat-card", variant === "success" && "ds-stat-card--success", className)}>
      <span className="ds-stat-card-label">{label}</span>
      <strong className="ds-stat-card-value">{value}</strong>
    </div>
  );
}

/** Directory / record detail body (contact page, similar entity views). */
export function RecordDetailLayout({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("ds-record-detail", className)}>{children}</div>;
}

export function RecordDetailHero({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <header className={cn("ds-record-detail__hero", className)}>{children}</header>;
}

export function RecordDetailGrid({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("ds-record-detail-grid", className)}>{children}</div>;
}

/** Stacked section card for lead record columns (Close-style). */
export function RecordCard({
  title,
  count,
  description,
  action,
  children,
  className,
}: {
  title: string;
  count?: number;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("ds-record-card", className)}>
      <header className="ds-record-card__head">
        <div className="ds-record-card__head-text">
          <div className="ds-record-card__title-row">
            <h3 className="ds-record-card__title">{title}</h3>
            {count != null && count > 0 && (
              <span className="ds-record-card__count">{count}</span>
            )}
          </div>
          {description && <p className="ds-record-card__description">{description}</p>}
        </div>
        {action}
      </header>
      <div className="ds-record-card__body">{children}</div>
    </section>
  );
}
