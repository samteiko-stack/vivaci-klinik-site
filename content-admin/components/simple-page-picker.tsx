"use client";

import { useMemo } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export type SimplePageMeta = {
  slug: string;
  title: string;
  path: string;
};

interface Props {
  pages: SimplePageMeta[];
  query: string;
  onQueryChange: (value: string) => void;
  activeSlug: string;
  onSelect: (slug: string) => void;
  className?: string;
}

export function SimplePagePicker({
  pages,
  query,
  onQueryChange,
  activeSlug,
  onSelect,
  className,
}: Props) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.slug.includes(q) ||
        p.path.toLowerCase().includes(q)
    );
  }, [pages, query]);

  return (
    <Command className={className} shouldFilter={false}>
      <CommandInput
        placeholder="Sök…"
        value={query}
        onValueChange={onQueryChange}
      />
      <CommandList>
        <CommandEmpty>Ingen träff.</CommandEmpty>
        <CommandGroup>
          {filtered.map((page) => (
            <CommandItem
              key={page.slug}
              value={page.slug}
              data-checked={activeSlug === page.slug ? "true" : undefined}
              onSelect={() => onSelect(page.slug)}
            >
              <span className="truncate">{page.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
