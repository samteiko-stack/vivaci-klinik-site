"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  sidebarCommandClassName,
  sidebarCommandInputClassName,
  sidebarCommandItemActiveClassName,
  sidebarCommandListClassName,
} from "@/lib/sidebar-command-styles";
import { cn } from "@/lib/utils";

export type SidebarPickerPage = {
  id: string;
  title: string;
  group?: string;
};

type Props = {
  pages: SidebarPickerPage[];
  query: string;
  onQueryChange: (value: string) => void;
  activeId: string;
  onSelect: (id: string) => void;
  searchPlaceholder?: string;
  emptyLabel?: string;
  className?: string;
};

export function SidebarPagePicker({
  pages,
  query,
  onQueryChange,
  activeId,
  onSelect,
  searchPlaceholder = "Sök…",
  emptyLabel = "Ingen träff.",
  className,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? pages.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q)
        )
      : pages;
    const groups = new Map<string, SidebarPickerPage[]>();
    for (const page of list) {
      const key = page.group ?? "Sidor";
      const bucket = groups.get(key) ?? [];
      bucket.push(page);
      groups.set(key, bucket);
    }
    const order = ["Översikt", "Sidor", "Behandlingar", "Problem", "Plastikkirurgi"];
    const keys = [...groups.keys()].sort(
      (a, b) => order.indexOf(a) - order.indexOf(b) || a.localeCompare(b, "sv")
    );
    return keys.map((key) => ({ key, items: groups.get(key) ?? [] }));
  }, [pages, query]);

  const updateScrollHint = useCallback(() => {
    const list = listRef.current;
    setHasMoreBelow(
      Boolean(list && list.scrollTop + list.clientHeight < list.scrollHeight - 8)
    );
  }, []);

  useEffect(() => {
    updateScrollHint();
  }, [pages, query, updateScrollHint]);

  return (
    <Command shouldFilter={false} className={sidebarCommandClassName(className)}>
      <CommandInput
        placeholder={searchPlaceholder}
        value={query}
        onValueChange={onQueryChange}
        className={sidebarCommandInputClassName}
      />
      <CommandList
        ref={listRef}
        onScroll={updateScrollHint}
        className={sidebarCommandListClassName}
      >
        <CommandEmpty className="text-sidebar-foreground/60">{emptyLabel}</CommandEmpty>
        {filtered.map((group) => (
          <CommandGroup
            key={group.key}
            heading={group.key}
            className="text-sidebar-foreground **:[[cmdk-group-heading]]:text-sidebar-foreground/50"
          >
            {group.items.map((page) => {
              const active = page.id === activeId;
              return (
                <CommandItem
                  key={page.id}
                  value={page.id}
                  aria-current={active ? "page" : undefined}
                  onSelect={() => onSelect(page.id)}
                  className={cn(sidebarCommandItemActiveClassName(active))}
                >
                  <span className="truncate font-medium">{page.title}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
      {hasMoreBelow ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-1 bottom-0 flex h-10 items-end justify-center gap-1 bg-gradient-to-t from-sidebar via-sidebar/90 to-transparent pb-1 text-[0.65rem] text-sidebar-foreground/55"
        >
          <ChevronDown className="size-3" />
          <span>Scrolla för fler</span>
        </div>
      ) : null}
    </Command>
  );
}
