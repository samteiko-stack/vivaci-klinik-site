"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, X } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Children, cloneElement, isValidElement, forwardRef, useCallback, useEffect, useRef } from "react";
import { tableColumnLayout } from "./tableColumnLayout";

export function DataTableCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("ds-data-table", className)}>{children}</div>;
}

export function DataTableToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("ds-data-table-toolbar", className)}>{children}</div>;
}

export function DataTableToolbarGroup({
  children,
  className,
  align = "start",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "end";
}) {
  return (
    <div
      className={cn(
        "ds-data-table-toolbar-group",
        align === "end" && "ds-data-table-toolbar-group--end",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DataTableSearch({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("ds-data-table-search", className)}>{children}</div>;
}

export function DataTableBulkBar({
  visible,
  count,
  onClear,
  children,
  className,
}: {
  visible: boolean;
  count?: number;
  onClear?: () => void;
  children?: React.ReactNode;
  className?: string;
}) {
  const t = useTranslations("common");

  return (
    <div
      className={cn("ds-data-table-bulk", visible && "ds-data-table-bulk--visible", className)}
      role="toolbar"
      aria-label={t("bulkActions")}
      aria-hidden={!visible}
    >
      <div className="ds-data-table-bulk-inner">
        <div className="ds-data-table-bulk-meta">
          <span className="ds-data-table-bulk-label">
            {t("selectionCount", { count: count ?? 0 })}
          </span>
          {onClear && (
            <button
              type="button"
              className="ds-data-table-bulk-clear"
              onClick={onClear}
              aria-label={t("clearSelection")}
            >
              <X className="ds-icon-2xs" aria-hidden />
            </button>
          )}
        </div>
        {children ? (
          <>
            <span className="ds-data-table-bulk-divider" aria-hidden />
            <div className="ds-data-table-bulk-actions">{children}</div>
          </>
        ) : null}
      </div>
    </div>
  );
}

/** Action button inside DataTableBulkBar — sized and coloured for the dark bulk bar. */
export function DataTableBulkAction({
  children,
  icon: Icon,
  onClick,
  disabled,
  danger,
  className,
}: {
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn("ds-bulk-action", danger && "ds-bulk-action--danger", className)}
      onClick={onClick}
      disabled={disabled}
      aria-busy={disabled || undefined}
    >
      {Icon && <Icon className="ds-icon-2xs" aria-hidden />}
      {children}
    </button>
  );
}

export function DataTableFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  if (!children) return null;

  return <div className={cn("ds-data-table-footer", className)}>{children}</div>;
}

export function DataTableEmpty({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("ds-data-table-empty", className)}>{children}</div>;
}

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (value: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(value);
      else (ref as React.MutableRefObject<T | null>).current = value;
    }
  };
}

type ScrollEdgeState = {
  overflowY: boolean;
  overflowX: boolean;
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
};

const SCROLL_EDGE_DEFAULT: ScrollEdgeState = {
  overflowY: false,
  overflowX: false,
  top: true,
  bottom: true,
  left: true,
  right: true,
};

/** Hysteresis so virtual list height tweaks do not flicker edge chrome. */
const SCROLL_EDGE_ENTER_PX = 10;
const SCROLL_EDGE_LEAVE_PX = 36;

function nextScrollEdges(
  el: HTMLDivElement,
  prev: ScrollEdgeState
): ScrollEdgeState {
  const overflowY = el.scrollHeight - el.clientHeight > 2;
  const overflowX = el.scrollWidth - el.clientWidth > 2;
  const distTop = el.scrollTop;
  const distBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
  const distLeft = el.scrollLeft;
  const distRight = el.scrollWidth - el.scrollLeft - el.clientWidth;

  const top = prev.top
    ? distTop <= SCROLL_EDGE_LEAVE_PX
    : distTop <= SCROLL_EDGE_ENTER_PX;
  const bottom = prev.bottom
    ? distBottom <= SCROLL_EDGE_LEAVE_PX
    : distBottom <= SCROLL_EDGE_ENTER_PX;
  const left = prev.left
    ? distLeft <= SCROLL_EDGE_LEAVE_PX
    : distLeft <= SCROLL_EDGE_ENTER_PX;
  const right = prev.right
    ? distRight <= SCROLL_EDGE_LEAVE_PX
    : distRight <= SCROLL_EDGE_ENTER_PX;

  return { overflowY, overflowX, top, bottom, left, right };
}

export const DataTableScroll = forwardRef<
  HTMLDivElement,
  {
    children: React.ReactNode;
    className?: string;
  }
>(function DataTableScroll({ children, className }, ref) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const edgeRef = useRef<ScrollEdgeState>(SCROLL_EDGE_DEFAULT);

  const sync = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const prev = edgeRef.current;
    const next = nextScrollEdges(el, prev);
    if (
      prev.overflowY === next.overflowY &&
      prev.overflowX === next.overflowX &&
      prev.top === next.top &&
      prev.bottom === next.bottom &&
      prev.left === next.left &&
      prev.right === next.right
    ) {
      return;
    }

    edgeRef.current = next;
    const wrap = el.parentElement;
    if (!wrap?.classList.contains("ds-data-table-scroll-wrap")) return;

    wrap.dataset.overflowY = next.overflowY ? "true" : "false";
    wrap.dataset.overflowX = next.overflowX ? "true" : "false";
    wrap.dataset.atTop = next.top ? "true" : "false";
    wrap.dataset.atBottom = next.bottom ? "true" : "false";
    wrap.dataset.atLeft = next.left ? "true" : "false";
    wrap.dataset.atRight = next.right ? "true" : "false";
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let raf = 0;
    const scheduleSync = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => sync());
    };

    scheduleSync();
    el.addEventListener("scroll", scheduleSync, { passive: true });
    const ro = new ResizeObserver(scheduleSync);
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", scheduleSync);
      ro.disconnect();
    };
  }, [sync, children]);

  const isList = className?.includes("ds-data-table-scroll--list");
  const isPipeline = className?.includes("ds-data-table-scroll--pipeline");
  const isEmpty = className?.includes("ds-data-table-scroll--empty");
  /** Nested lists (settings, clinic detail) — grow with rows, not viewport-fill flex. */
  const contentSized = className?.includes("ds-data-table-scroll--content-sized");

  return (
    <div
      className={cn(
        "ds-data-table-scroll-wrap",
        isList && !isEmpty && !contentSized && "ds-data-table-scroll-wrap--fill",
        isPipeline && "ds-data-table-scroll-wrap--fill"
      )}
      data-overflow-y="false"
      data-overflow-x="false"
      data-at-top="true"
      data-at-bottom="true"
      data-at-left="true"
      data-at-right="true"
    >
      <div ref={mergeRefs(ref, scrollRef)} className={cn("ds-data-table-scroll", className)}>
        {children}
      </div>
      <div className="ds-data-table-scroll-hint ds-data-table-scroll-hint--bottom" aria-hidden>
        <ChevronDown className="ds-icon-xs" />
      </div>
      <div className="ds-data-table-scroll-hint ds-data-table-scroll-hint--top" aria-hidden>
        <ChevronUp className="ds-icon-xs" />
      </div>
      <div className="ds-data-table-scroll-hint ds-data-table-scroll-hint--end" aria-hidden>
        <ChevronRight className="ds-icon-xs" />
      </div>
      <div className="ds-data-table-scroll-hint ds-data-table-scroll-hint--start" aria-hidden>
        <ChevronLeft className="ds-icon-xs" />
      </div>
    </div>
  );
});

export function DataTableGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const columns: string[] = [];
  function collectColumns(nodes: React.ReactNode) {
    Children.forEach(nodes, (child) => {
      if (!isValidElement<{ className?: string; children?: React.ReactNode }>(child)) return;
      if (child.type === "col") {
        columns.push(child.props.className ?? "");
      } else if (child.props.children) {
        collectColumns(child.props.children);
      }
    });
  }
  if (className?.includes("ds-data-table-grid--fixed")) collectColumns(children);
  const layout = columns.length ? tableColumnLayout(columns) : null;
  let index = 0;
  function sizeColumns(nodes: React.ReactNode): React.ReactNode {
    return Children.map(nodes, (child) => {
      if (!isValidElement<{ children?: React.ReactNode; style?: React.CSSProperties }>(child)) return child;
      if (child.type === "col") return cloneElement(child, { style: { ...child.props.style, width: layout!.widths[index++] } });
      // Only traverse column declarations; leave row rendering and virtualization untouched.
      if (child.props.children && (child.type === "colgroup" || typeof child.type === "symbol")) {
        return cloneElement(child, { children: sizeColumns(child.props.children) });
      }
      return child;
    });
  }
  return (
    <table
      className={cn("ds-data-table-grid", className)}
      style={layout ? { minWidth: layout.minWidth } : undefined}
    >
      {layout ? sizeColumns(children) : children}
    </table>
  );
}

export function DataTableHead({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <thead className={className}>{children}</thead>;
}

export const DataTableBody = forwardRef<
  HTMLTableSectionElement,
  {
    children: React.ReactNode;
    className?: string;
  }
>(function DataTableBody({ children, className }, ref) {
  return (
    <tbody ref={ref} className={className}>
      {children}
    </tbody>
  );
});

export const DataTableRow = forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(function DataTableRow({ children, className, ...props }, ref) {
  return (
    <tr ref={ref} className={cn("ds-table-row", className)} {...props}>
      {children}
    </tr>
  );
});

export function DataTableTh({
  children,
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={className} {...props}>
      {children}
    </th>
  );
}

export function DataTableTd({
  children,
  className,
  variant,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & {
  variant?: "primary" | "sub" | "date";
}) {
  return (
    <td
      className={cn(
        variant === "primary" && "ds-tcell-primary",
        variant === "sub" && "ds-tcell-sub",
        variant === "date" && "ds-tcell-date",
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}
