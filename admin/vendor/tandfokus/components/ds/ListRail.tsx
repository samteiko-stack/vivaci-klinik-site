"use client";

import { cn } from "@/lib/utils";
import { ListRailNavButton, NavSection } from "./Nav";

export interface ListRailItem {
  id: string;
  label: string;
  count?: number;
}

interface Props {
  items: ListRailItem[];
  activeId: string;
  onSelect: (id: string) => void;
  allLabel?: string;
  allId?: string;
  sectionLabel?: string;
  className?: string;
}

export function ListRail({
  items,
  activeId,
  onSelect,
  allLabel = "All",
  allId = "all",
  sectionLabel,
  className,
}: Props) {
  return (
    <nav className={cn("ds-list-rail", className)} aria-label="Filter list">
      <NavSection label={sectionLabel} className="ds-list-rail-section">
        <ListRailNavButton
          label={allLabel}
          active={activeId === allId}
          onClick={() => onSelect(allId)}
        />
        {items.map((item) => (
          <ListRailNavButton
            key={item.id}
            label={item.label}
            count={item.count}
            active={activeId === item.id}
            onClick={() => onSelect(item.id)}
          />
        ))}
      </NavSection>
    </nav>
  );
}
