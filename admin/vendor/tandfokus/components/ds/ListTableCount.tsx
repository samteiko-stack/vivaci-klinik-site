"use client";

import { FilterSelect } from "./FilterSelect";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10" },
  { value: "15", label: "15" },
  { value: "25", label: "25" },
  { value: "50", label: "50" },
];

/** Toolbar result copy — CRM noun label (e.g. “5 behandlare”) or Kepler-style “shown of total”. */
export function ListTableCount({
  shown,
  total,
  totalLabel,
  pageSize,
  onPageSizeChange,
  className,
}: {
  shown: number;
  total: number;
  /** When set, renders this string instead of “X of Y results” (org lists, forms). */
  totalLabel?: string;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  className?: string;
}) {
  const paginated = pageSize !== undefined && onPageSizeChange !== undefined;

  if (totalLabel) {
    return (
      <span className={cn("ds-list-table-count", className)} aria-live="polite">
        {totalLabel}
      </span>
    );
  }

  return (
    <span className={cn("ds-list-table-count", className)} aria-live="polite">
      <span className="ds-list-table-count__shown">{shown}</span>
      <span className="ds-list-table-count__label">
        of {total}
        {total === 1 ? " result" : " results"}
      </span>
      {paginated ? (
        <>
          <span className="ds-list-table-count__sep" aria-hidden>
            ·
          </span>
          <span className="ds-list-table-count__label" id="list-table-page-size-label">
            Per page
          </span>
          <FilterSelect
            value={String(pageSize)}
            placeholder={String(pageSize)}
            options={PAGE_SIZE_OPTIONS}
            onChange={(value) => onPageSizeChange(Number(value))}
            className="ds-list-table-count__page-size"
            menuPortal
          />
        </>
      ) : null}
    </span>
  );
}
