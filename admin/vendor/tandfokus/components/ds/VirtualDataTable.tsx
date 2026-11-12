"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/utils";
import { DataTableBody, DataTableRow, DataTableTd } from "./DataTable";
import { Skeleton, Spinner } from "./Feedback";

function resolveScrollElement(
  tbody: HTMLTableSectionElement | null,
  scrollRef?: RefObject<HTMLDivElement | null>
): HTMLDivElement | null {
  const fromRef = scrollRef?.current ?? null;
  if (fromRef) return fromRef;
  const fromDom = tbody?.closest(".ds-data-table-scroll");
  return fromDom instanceof HTMLDivElement ? fromDom : null;
}

export function VirtualDataTableBody({
  scrollRef,
  rowCount,
  colSpan,
  renderRow,
  getRowProps,
  getRowKey,
  estimateRowHeight = 52,
  overscan = 10,
  loading = false,
  loadingMore = false,
  onLoadMore,
  hasMore = false,
  emptyState,
  skeletonRowCount = 8,
}: {
  scrollRef?: RefObject<HTMLDivElement | null>;
  rowCount: number;
  colSpan: number;
  renderRow: (index: number) => ReactNode;
  getRowProps?: (
    index: number
  ) => Pick<React.HTMLAttributes<HTMLTableRowElement>, "className" | "onClick">;
  getRowKey?: (index: number) => string;
  estimateRowHeight?: number;
  overscan?: number;
  loading?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  emptyState?: ReactNode;
  skeletonRowCount?: number;
}) {
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const atBottomRef = useRef(false);
  const loadRequestedRef = useRef(false);
  const loadingMoreRef = useRef(loadingMore);
  const onLoadMoreRef = useRef(onLoadMore);
  const hasMoreRef = useRef(hasMore);

  loadingMoreRef.current = loadingMore;
  onLoadMoreRef.current = onLoadMore;
  hasMoreRef.current = hasMore;

  useLayoutEffect(() => {
    const sync = () => {
      const node = resolveScrollElement(tbodyRef.current, scrollRef);
      setScrollElement(node);
      const thead = node?.querySelector("thead");
      setScrollMargin(thead instanceof HTMLElement ? thead.offsetHeight : 0);
    };

    sync();

    const node = resolveScrollElement(tbodyRef.current, scrollRef);
    if (!node) return;

    const ro = new ResizeObserver(() => sync());
    ro.observe(node);
    const thead = node.querySelector("thead");
    if (thead instanceof HTMLElement) {
      ro.observe(thead);
    }

    return () => ro.disconnect();
  }, [scrollRef, loading]);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollElement,
    estimateSize: () => estimateRowHeight,
    overscan,
    scrollMargin,
    getItemKey: getRowKey ? (index) => getRowKey(index) : undefined,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const paddingTop =
    virtualItems.length > 0
      ? Math.max(0, (virtualItems[0]?.start ?? 0) - scrollMargin)
      : 0;
  const loadBandHeight = loadingMore ? estimateRowHeight : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? virtualizer.getTotalSize() -
        (virtualItems[virtualItems.length - 1]?.end ?? 0) +
        loadBandHeight
      : loadBandHeight;

  useEffect(() => {
    if (!loadingMore) {
      loadRequestedRef.current = false;
    }
  }, [loadingMore]);

  useEffect(() => {
    const el = scrollElement;
    if (!el) return;

    const thresholdPx = Math.max(estimateRowHeight * 3, 160);

    const updateAtBottom = () => {
      atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= thresholdPx;
    };

    const maybeLoadMore = () => {
      updateAtBottom();
      if (!hasMoreRef.current || loadingMoreRef.current || loadRequestedRef.current) return;
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distance <= thresholdPx) {
        loadRequestedRef.current = true;
        onLoadMoreRef.current?.();
      }
    };

    el.addEventListener("scroll", maybeLoadMore, { passive: true });
    maybeLoadMore();
    return () => el.removeEventListener("scroll", maybeLoadMore);
  }, [scrollElement, estimateRowHeight, rowCount]);

  useLayoutEffect(() => {
    const el = scrollElement;
    if (!el || !atBottomRef.current) return;
    el.scrollTop = el.scrollHeight - el.clientHeight;
  }, [rowCount, loadingMore, scrollElement]);

  if (loading) {
    return (
      <DataTableBody ref={tbodyRef}>
        {Array.from({ length: skeletonRowCount }).map((_, i) => (
          <DataTableRow key={`sk-${i}`} className="ds-table-row--skeleton">
            <DataTableTd colSpan={colSpan} className="ds-table-skeleton-cell">
              <Skeleton className="ds-table-skeleton-line" />
            </DataTableTd>
          </DataTableRow>
        ))}
      </DataTableBody>
    );
  }

  if (rowCount === 0) {
    return (
      <DataTableBody ref={tbodyRef}>
        <DataTableRow className="ds-table-row--empty">
          <DataTableTd colSpan={colSpan}>{emptyState}</DataTableTd>
        </DataTableRow>
      </DataTableBody>
    );
  }

  return (
    <DataTableBody ref={tbodyRef}>
      {paddingTop > 0 && (
        <tr className="ds-virtual-table-spacer" aria-hidden>
          <td colSpan={colSpan} style={{ height: paddingTop }} />
        </tr>
      )}
      {virtualItems.map((virtualRow) => {
        const rowProps = getRowProps?.(virtualRow.index);
        return (
          <DataTableRow
            key={virtualRow.key}
            data-index={virtualRow.index}
            className={cn("ds-virtual-table-row", rowProps?.className)}
            onClick={rowProps?.onClick}
          >
            {renderRow(virtualRow.index)}
          </DataTableRow>
        );
      })}
      {paddingBottom > 0 && (
        <tr className="ds-virtual-table-spacer" aria-hidden={!loadingMore}>
          <td colSpan={colSpan} style={{ height: paddingBottom }} className="ds-virtual-table-spacer__cell">
            {loadingMore ? (
              <div className="ds-virtual-table-loading-cell">
                <Spinner className="ds-virtual-table-loading-spinner" />
              </div>
            ) : null}
          </td>
        </tr>
      )}
    </DataTableBody>
  );
}

export function VirtualListSentinel({
  className,
  loading,
}: {
  className?: string;
  loading?: boolean;
}) {
  return (
    <div className={cn("ds-virtual-list-sentinel", loading && "ds-virtual-list-sentinel--loading", className)}>
      {loading ? <Spinner className="ds-virtual-list-sentinel__spinner" /> : null}
    </div>
  );
}
