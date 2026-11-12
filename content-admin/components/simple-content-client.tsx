"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";
import { BlogPostEditor } from "@/components/content-editors/blog-post-editor";
import { HubCategoriesEditor } from "@/components/content-editors/hub-categories-editor";
import { UtbildningCourseEditor } from "@/components/content-editors/utbildning-course-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

type Kind = "utbildning" | "nyheter";

type SimplePageMeta = {
  slug: string;
  title: string;
  path: string;
};

type Props = {
  kind: Kind;
  apiBase: string;
  slug: string | null;
  emptyHint: string;
};

export function SimpleContentClient({ kind, apiBase, slug, emptyHint }: Props) {
  const [meta, setMeta] = useState<SimplePageMeta | null>(null);
  const [doc, setDoc] = useState<Record<string, unknown> | null>(null);
  const [saved, setSaved] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!slug) {
      setDoc(null);
      setSaved(null);
      setMeta(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`${apiBase}/${encodeURIComponent(slug)}`, { credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((payload: { slug: string; data: Record<string, unknown> }) => {
        if (cancelled) return;
        const data = payload.data;
        setDoc(data);
        setSaved(structuredClone(data));
        setMeta({
          slug: payload.slug,
          title:
            (typeof data.title === "string" && data.title) ||
            (slug === "index"
              ? "Utbildningsöversikt"
              : slug === "listing"
                ? "Bloggöversikt"
                : payload.slug),
          path:
            (typeof data.path === "string" && data.path) ||
            (kind === "utbildning"
              ? slug === "index"
                ? "/utbildning"
                : `/utbildning/${payload.slug}`
              : slug === "listing"
                ? "/blogg"
                : `/nyheter/${payload.slug}`),
        });
      })
      .catch(() => {
        if (!cancelled) toast.error("Kunde inte ladda sidan.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiBase, kind, slug]);

  const dirty = useMemo(() => {
    if (!doc || !saved) return false;
    return JSON.stringify(doc) !== JSON.stringify(saved);
  }, [doc, saved]);

  const save = useCallback(async () => {
    if (!slug || !doc) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/${encodeURIComponent(slug)}`, {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doc),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSaved(structuredClone(doc));
      toast.success("Sparat.");
    } catch {
      toast.error("Kunde inte spara.");
    } finally {
      setSaving(false);
    }
  }, [apiBase, doc, slug]);

  if (!slug) {
    return <EmptyState>{emptyHint}</EmptyState>;
  }

  if (loading || !doc) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-muted/35 p-6">
        <Skeleton className="mb-4 h-8 w-64" />
        <Skeleton className="h-96 w-full max-w-3xl rounded-xl" />
      </div>
    );
  }

  const previewPath = meta?.path ?? "/";
  const isHub =
    (kind === "utbildning" && slug === "index") ||
    (kind === "nyheter" && slug === "listing");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/35">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b bg-background/95 px-4 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{meta?.title}</p>
          <p className="truncate text-xs text-muted-foreground">{previewPath}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={dirty ? "secondary" : "outline"} className="hidden sm:inline-flex">
            {dirty ? "Osparad" : "Sparad"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href={previewPath} target="_blank" rel="noreferrer" />}
          >
            <ExternalLink data-icon="inline-start" />
            Förhandsgranska
          </Button>
          <Button type="button" size="sm" disabled={!dirty || saving} onClick={() => void save()}>
            <Save data-icon="inline-start" />
            {saving ? "Sparar…" : "Spara"}
          </Button>
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8">
          {isHub ? (
            <HubCategoriesEditor
              doc={doc}
              onChange={setDoc}
              itemFields={
                kind === "utbildning"
                  ? [
                      { key: "href", label: "Länk (path)" },
                      { key: "label", label: "Rubrik" },
                      { key: "description", label: "Beskrivning", kind: "textarea", rows: 2 },
                      { key: "image", label: "Bild", kind: "image" as const },
                    ]
                  : [
                      { key: "href", label: "Länk (path)" },
                      { key: "label", label: "Rubrik" },
                      { key: "description", label: "Beskrivning", kind: "textarea", rows: 2 },
                      { key: "image", label: "Bild", kind: "image" as const },
                    ]
              }
            />
          ) : kind === "utbildning" ? (
            <UtbildningCourseEditor doc={doc} onChange={setDoc} />
          ) : (
            <BlogPostEditor doc={doc} onChange={setDoc} />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-muted/35 p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
