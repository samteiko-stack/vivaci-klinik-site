"use client";

import { useCallback, useEffect, useState } from "react";
import { ImageIcon, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { siteAssetAdminUrl } from "@/lib/site-image-url";
import { cn } from "@/lib/utils";
import { readResponseJson } from "@/lib/utils";

type SiteImageItem = { path: string; name: string };

type ImagePickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (path: string) => void;
  title?: string;
};

export function ImagePickerDialog({
  open,
  onOpenChange,
  onSelect,
  title = "Välj bild",
}: ImagePickerDialogProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [items, setItems] = useState<SiteImageItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const limit = 48;

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const load = useCallback(
    async (append: boolean, currentLength: number) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          offset: String(append ? currentLength : 0),
          limit: String(limit),
        });
        if (debouncedQuery) params.set("q", debouncedQuery);
        const res = await fetch(`/api/site-images?${params}`, { credentials: "same-origin" });
        if (!res.ok) throw new Error("Kunde inte läsa bildlistan");
        const data = await readResponseJson<{
          items: SiteImageItem[];
          total: number;
        }>(res);
        setTotal(data.total);
        setItems((prev) => (append ? [...prev, ...data.items] : data.items));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Fel vid inläsning");
        if (!append) setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [debouncedQuery, limit]
  );

  useEffect(() => {
    if (!open) return;
    void load(false, 0);
  }, [open, debouncedQuery, load]);

  const canLoadMore = items.length < total;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(32rem,90vh)] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Bilder från <code className="text-xs">public/images</code> i Vivaci-repot.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b px-4 py-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök filnamn eller sökväg…"
              className="pl-8"
            />
          </div>
        </div>
        <ScrollArea className="min-h-0 flex-1 px-4 py-3">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : items.length === 0 && !loading ? (
            <p className="text-sm text-muted-foreground">Inga bilder hittades.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {items.map((item) => (
                <li key={item.path}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full flex-col overflow-hidden rounded-lg border bg-muted/30 text-left transition-colors",
                      "hover:border-ring hover:bg-muted/50"
                    )}
                    onClick={() => {
                      onSelect(item.path);
                      onOpenChange(false);
                    }}
                  >
                    <span className="relative flex aspect-[4/3] items-center justify-center bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={siteAssetAdminUrl(item.path)}
                        alt=""
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    </span>
                    <span className="truncate px-2 py-1.5 text-xs text-muted-foreground">
                      {item.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {loading ? (
            <div className="flex justify-center py-4 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" aria-hidden />
            </div>
          ) : null}
        </ScrollArea>
        <DialogFooter className="border-t px-4 py-3 sm:justify-between">
          <p className="text-xs text-muted-foreground tabular-nums">
            {items.length} / {total}
          </p>
          {canLoadMore ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => void load(true, items.length)}
            >
              <ImageIcon data-icon="inline-start" aria-hidden />
              Visa fler
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
