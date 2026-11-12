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
import { cn } from "@/lib/utils";

export type TreatmentPageMeta = {
  category: string;
  slug: string;
  title: string;
  path: string;
};

const CATEGORY_LABEL: Record<string, string> = {
  behandlingar: "Behandlingar",
  problem: "Problem",
  plastikkirurgi: "Plastikkirurgi",
};

interface PickerCommandProps {
  pages: TreatmentPageMeta[];
  query: string;
  onQueryChange: (value: string) => void;
  activePageId: string;
  onSelect: (pageId: string) => void;
  className?: string;
}

export function TreatmentPagePickerCommand({
  pages,
  query,
  onQueryChange,
  activePageId,
  onSelect,
  className,
}: PickerCommandProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);

  const grouped = useMemo(() => {
    const order = ["behandlingar", "problem", "plastikkirurgi"];
    const map = new Map<string, TreatmentPageMeta[]>();
    for (const page of pages) {
      const list = map.get(page.category) ?? [];
      list.push(page);
      map.set(page.category, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.title.localeCompare(b.title, "sv"));
    }
    const keys = [...map.keys()].sort(
      (a, b) => order.indexOf(a) - order.indexOf(b) || a.localeCompare(b, "sv")
    );
    return keys.map((key) => ({
      key,
      label: CATEGORY_LABEL[key] ?? key,
      items: map.get(key) ?? [],
    }));
  }, [pages]);

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
    <Command
      shouldFilter={false}
      className={cn(
        "relative gap-1 rounded-none bg-transparent p-0 text-sidebar-foreground shadow-none [&_[data-slot=input-group]]:border-sidebar-border [&_[data-slot=input-group]]:bg-sidebar-accent [&_[data-slot=input-group-addon]]:text-sidebar-foreground/50",
        className
      )}
    >
      <CommandInput
        placeholder="Sök efter sida…"
        value={query}
        onValueChange={onQueryChange}
        className="text-sidebar-foreground placeholder:text-sidebar-foreground/45"
      />
      <CommandList
        ref={listRef}
        aria-label="Behandlingssidor"
        onScroll={updateScrollHint}
        className="max-h-none flex-1 overflow-y-auto pb-8 pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sidebar-foreground/20 [&::-webkit-scrollbar-track]:bg-transparent"
      >
        <CommandEmpty className="text-sidebar-foreground/60">
          Inga sidor matchar sökningen.
        </CommandEmpty>
        {grouped.map((group) => (
          <CommandGroup
            key={group.key}
            heading={group.label}
            className="text-sidebar-foreground **:[[cmdk-group-heading]]:text-sidebar-foreground/50"
          >
            {group.items.map((page) => {
              const id = `${page.category}/${page.slug}`;
              const active = id === activePageId;
              return (
                <CommandItem
                  key={id}
                  value={id}
                  aria-current={active ? "page" : undefined}
                  onSelect={() => onSelect(id)}
                  className={cn(
                    "cursor-pointer rounded-md px-2.5 py-2.5 text-sidebar-foreground/70 transition-colors data-selected:bg-sidebar-accent/70 data-selected:text-sidebar-accent-foreground [&>svg:last-child]:hidden",
                    active &&
                      "bg-sidebar-accent text-sidebar-accent-foreground data-selected:bg-sidebar-accent"
                  )}
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
