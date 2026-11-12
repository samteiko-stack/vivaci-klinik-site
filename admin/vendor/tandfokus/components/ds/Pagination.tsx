"use client";

import { ChevronLeft, ChevronRight } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className={cn("ds-pagination", className)} aria-label="Pagination">
      <Button
        variant="secondary"
        size="sm"
        disabled={page === 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        aria-label="Previous page"
      >
        <ChevronLeft className="ds-icon-xs" />
        <span className="ds-pagination__nav-label">Prev</span>
      </Button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
        const showPage =
          pageNum === 1 ||
          pageNum === totalPages ||
          Math.abs(pageNum - page) <= 1;

        const showEllipsisBefore = pageNum === page - 2 && page > 3;
        const showEllipsisAfter = pageNum === page + 2 && page < totalPages - 2;

        if (showEllipsisBefore || showEllipsisAfter) {
          return (
            <span key={pageNum} className="ds-pagination__ellipsis" aria-hidden>
              …
            </span>
          );
        }

        if (!showPage) return null;

        return (
          <button
            key={pageNum}
            type="button"
            className={cn("ds-pagination__page", pageNum === page && "ds-pagination__page--active")}
            onClick={() => onPageChange(pageNum)}
            aria-current={pageNum === page ? "page" : undefined}
          >
            {pageNum}
          </button>
        );
      })}

      <Button
        variant="secondary"
        size="sm"
        disabled={page === totalPages}
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        aria-label="Next page"
      >
        <span className="ds-pagination__nav-label">Next</span>
        <ChevronRight className="ds-icon-xs" />
      </Button>
    </nav>
  );
}
