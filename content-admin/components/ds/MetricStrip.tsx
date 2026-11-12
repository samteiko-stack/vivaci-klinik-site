"use client";

import {
  CalendarCheck,
  CheckCircle2,
  Inbox,
  LayoutList,
  MessageCircle,
  MinusCircle,
  Sparkles,
  TrendingDown,
  TrendingUp,
  type AppIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Flex } from "./Layout";

export type MetricIcon =
  | "total"
  | "new"
  | "contacted"
  | "booked"
  | "won"
  | "lost"
  | "inbox";

const ICON_MAP: Record<MetricIcon, AppIcon> = {
  total: LayoutList,
  inbox: Inbox,
  new: Sparkles,
  contacted: MessageCircle,
  booked: CalendarCheck,
  won: CheckCircle2,
  lost: MinusCircle,
};

export interface MetricItem {
  label: string;
  value: number | string;
  icon?: MetricIcon;
}

/**
 * Metric card with an optional period-over-period delta.
 * Use for dashboard/analytics KPIs; use PipelineStats for the compact inline strip.
 */
export function MetricCard({
  label,
  value,
  trend,
  compareLabel,
  footnote,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  trend?: number | null;
  compareLabel?: string;
  footnote?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  className?: string;
}) {
  const isUp = typeof trend === "number" && trend > 0;
  const isDown = typeof trend === "number" && trend < 0;

  return (
    <div className={cn("ds-analytics-stat", className)}>
      <Flex between className="ds-analytics-stat__head">
        <span className="ds-analytics-stat__label">{label}</span>
        <span className="ds-analytics-stat__icon-wrap">
          <Icon className="ds-analytics-stat__icon" strokeWidth={1.75} />
        </span>
      </Flex>
      <span className="ds-analytics-stat__value">{value}</span>
      {typeof trend === "number" && compareLabel ? (
        <span
          className={cn(
            "ds-analytics-stat__delta",
            isUp && "ds-analytics-stat__delta--up",
            isDown && "ds-analytics-stat__delta--down"
          )}
        >
          {isUp ? (
            <TrendingUp className="ds-icon-2xs" />
          ) : isDown ? (
            <TrendingDown className="ds-icon-2xs" />
          ) : null}
          {Math.abs(trend).toFixed(0)}% vs {compareLabel}
        </span>
      ) : footnote ? (
        <span className="ds-analytics-stat__footnote">{footnote}</span>
      ) : null}
    </div>
  );
}

export function PipelineStats({ items }: { items: MetricItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="ds-metric-strip" role="list">
      {items.map((item) => {
        const Icon = ICON_MAP[item.icon ?? "inbox"];
        return (
          <div key={item.label} className="ds-metric-item" role="listitem">
            <Icon className="ds-metric-item__icon" strokeWidth={1.75} aria-hidden />
            <span className="ds-metric-item__value">{item.value}</span>
            <span className="ds-metric-item__label">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
