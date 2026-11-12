"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";
import { ImagePathField } from "@/components/treatment-pages/image-path-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

function setNested(
  doc: Record<string, unknown>,
  keys: string[],
  value: string
): Record<string, unknown> {
  const next = { ...doc };
  let cur: Record<string, unknown> = next;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]!;
    const child = cur[k];
    const branch =
      child && typeof child === "object" && !Array.isArray(child)
        ? { ...(child as Record<string, unknown>) }
        : {};
    cur[k] = branch;
    cur = branch;
  }
  cur[keys[keys.length - 1]!] = value;
  return next;
}

function getNested(doc: Record<string, unknown>, keys: string[]): string {
  let cur: unknown = doc;
  for (const k of keys) {
    if (!cur || typeof cur !== "object") return "";
    cur = (cur as Record<string, unknown>)[k];
  }
  return typeof cur === "string" ? cur : "";
}

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
            (typeof data.title === "string" && data.title) || payload.slug,
          path:
            (typeof data.path === "string" && data.path) ||
            (kind === "utbildning"
              ? `/utbildning/${payload.slug}`
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
    return <EmptyState>Laddar…</EmptyState>;
  }

  const previewPath = meta?.path ?? "/";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-end gap-2 border-b px-4 py-2">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={
            <a href={previewPath} target="_blank" rel="noreferrer" />
          }
        >
          <ExternalLink data-icon="inline-start" />
          Förhandsgranska
        </Button>
        <Button type="button" size="sm" disabled={!dirty || saving} onClick={() => void save()}>
          <Save data-icon="inline-start" />
          {saving ? "Sparar…" : "Spara"}
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          <Field
            label="Titel"
            value={typeof doc.title === "string" ? doc.title : ""}
            onChange={(v) => setDoc({ ...doc, title: v })}
          />
          <Field
            label="Meta (SEO)"
            value={
              typeof doc.metaDescription === "string" ? doc.metaDescription : ""
            }
            onChange={(v) => setDoc({ ...doc, metaDescription: v })}
          />
          {kind === "nyheter" ? (
            <>
              <Field
                label="Utdrag"
                value={typeof doc.excerpt === "string" ? doc.excerpt : ""}
                onChange={(v) => setDoc({ ...doc, excerpt: v })}
              />
              <Field
                label="Datum"
                value={typeof doc.date === "string" ? doc.date : ""}
                onChange={(v) => setDoc({ ...doc, date: v })}
              />
              <div className="flex flex-col gap-2">
                <Label>Hero-bild</Label>
                <ImagePathField
                  value={typeof doc.heroImage === "string" ? doc.heroImage : ""}
                  onChange={(v) => setDoc({ ...doc, heroImage: v })}
                />
              </div>
              <FormTextarea
                label="Brödtext (HTML)"
                value={typeof doc.bodyHtml === "string" ? doc.bodyHtml : ""}
                onChange={(v: string) => setDoc({ ...doc, bodyHtml: v })}
              />
            </>
          ) : (
            <>
              <Field
                label="Hero — rubrik"
                value={getNested(doc, ["hero", "title"])}
                onChange={(v: string) => setDoc(setNested(doc, ["hero", "title"], v))}
              />
              <FormTextarea
                label="Hero — intro"
                value={getNested(doc, ["hero", "intro"])}
                onChange={(v: string) => setDoc(setNested(doc, ["hero", "intro"], v))}
              />
              <div className="flex flex-col gap-2">
                <Label>Hero-bild</Label>
                <ImagePathField
                  value={getNested(doc, ["hero", "image"])}
                  onChange={(v) => setDoc(setNested(doc, ["hero", "image"], v))}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function FormTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Textarea
        className="min-h-28 font-mono text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
