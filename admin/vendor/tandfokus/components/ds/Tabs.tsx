"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type TabAccent = "brand" | "success" | "purple" | "blue";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: TabAccent;
  count?: number;
  disabled?: boolean;
}

export type TabBarVariant = "nav";

type TabIndicator = {
  left: number;
  width: number;
};

/** Shared page / section tabs — one underline track pattern site-wide. */
export function TabBar({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
  /** Ignored — kept so old call sites typecheck while migrating. */
  variant?: string;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const [indicator, setIndicator] = useState<TabIndicator>({ left: 0, width: 0 });
  const [indicatorReady, setIndicatorReady] = useState(false);

  const updateIndicator = useCallback(() => {
    const bar = barRef.current;
    const tab = tabRefs.current.get(active);
    if (!bar || !tab) return;

    const barRect = bar.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    setIndicator({
      left: tabRect.left - barRect.left,
      width: tabRect.width,
    });
    setIndicatorReady(true);
  }, [active]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator, tabs]);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    const bar = barRef.current;
    if (!shell || !bar) return;

    const ro = new ResizeObserver(updateIndicator);
    ro.observe(shell);
    ro.observe(bar);
    tabs.forEach((tab) => {
      const el = tabRefs.current.get(tab.id);
      if (el) ro.observe(el);
    });

    shell.addEventListener("scroll", updateIndicator, { passive: true });
    window.addEventListener("resize", updateIndicator);

    return () => {
      ro.disconnect();
      shell.removeEventListener("scroll", updateIndicator);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [tabs, updateIndicator]);

  return (
    <div className="ds-tab-bar-shell" ref={shellRef}>
      <div className={cn("ds-tab-bar", className)} ref={barRef} role="tablist">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                if (node) tabRefs.current.set(tab.id, node);
                else tabRefs.current.delete(tab.id);
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              className={cn(
                "ds-tab",
                isActive && "ds-tab--active",
                isActive && tab.accent && tab.accent !== "brand" && `ds-tab--accent-${tab.accent}`,
                tab.disabled && "ds-tab--disabled"
              )}
              onClick={() => !tab.disabled && onChange(tab.id)}
            >
              {Icon && <Icon className="ds-tab__icon" />}
              <span className="ds-tab__label">
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ds-tab__count">{tab.count}</span>
                )}
              </span>
            </button>
          );
        })}
        <span
          className={cn(
            "ds-tab-bar__indicator",
            indicatorReady && "ds-tab-bar__indicator--ready"
          )}
          aria-hidden
          style={{
            width: indicator.width,
            transform: `translateX(${indicator.left}px)`,
          }}
        />
      </div>
    </div>
  );
}

/** Bottom tab bar shown on mobile only — icon over label, one row of equal-width tabs. */
export function MobileTabBar({
  tabs,
  active,
  onChange,
  label,
  className,
}: {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  label?: string;
  className?: string;
}) {
  return (
    <nav className={cn("ds-mobile-tab-bar", className)} aria-label={label} role="tablist">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? "page" : undefined}
            className={cn("ds-mobile-tab", isActive && "ds-mobile-tab--active")}
            onClick={() => onChange(tab.id)}
          >
            {Icon && <Icon className="ds-mobile-tab__icon" />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
