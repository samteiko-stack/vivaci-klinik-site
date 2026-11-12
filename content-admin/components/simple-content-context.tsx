"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ADMIN_BLOGG, ADMIN_UTBILDNING } from "@/lib/admin-routes";

type Kind = "utbildning" | "nyheter";

type SimpleContentContextValue = {
  kind: Kind | null;
  slug: string | null;
  loading: boolean;
  saving: boolean;
  dirty: boolean;
  doc: Record<string, unknown> | null;
  pageTitle: string;
  pagePath: string;
  setDoc: React.Dispatch<React.SetStateAction<Record<string, unknown> | null>>;
  save: () => Promise<void>;
};

const SimpleContentContext = createContext<SimpleContentContextValue | null>(null);

export function useSimpleContent() {
  return useContext(SimpleContentContext);
}

function resolveWorkspace(pathname: string): { kind: Kind; apiBase: string } | null {
  if (pathname.startsWith(ADMIN_UTBILDNING)) {
    return { kind: "utbildning", apiBase: "/api/utbildning" };
  }
  if (pathname.startsWith(ADMIN_BLOGG)) {
    return { kind: "nyheter", apiBase: "/api/nyheter" };
  }
  return null;
}

export function SimpleContentProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const workspace = resolveWorkspace(pathname);
  const slug = workspace ? searchParams.get("slug") : null;

  const [doc, setDoc] = useState<Record<string, unknown> | null>(null);
  const [saved, setSaved] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const apiBase = workspace?.apiBase ?? "";
  const kind = workspace?.kind ?? null;

  useEffect(() => {
    if (!kind || !apiBase || !slug) {
      setDoc(null);
      setSaved(null);
      setLoading(false);
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

  const pageTitle = useMemo(() => {
    if (!doc || !slug) return "";
    if (typeof doc.title === "string" && doc.title) return doc.title;
    if (slug === "index") return "Utbildningsöversikt";
    if (slug === "listing") return "Bloggöversikt";
    return slug.replace(/-/g, " ");
  }, [doc, slug]);

  const pagePath = useMemo(() => {
    if (!doc || !slug || !kind) return "/";
    if (typeof doc.path === "string" && doc.path.startsWith("/")) return doc.path;
    if (kind === "utbildning") {
      return slug === "index" ? "/utbildning" : `/utbildning/${slug}`;
    }
    return slug === "listing" ? "/blogg" : `/nyheter/${slug}`;
  }, [doc, kind, slug]);

  const save = useCallback(async () => {
    if (!slug || !doc || !apiBase) return;
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

  const value = useMemo<SimpleContentContextValue>(
    () => ({
      kind,
      slug,
      loading,
      saving,
      dirty,
      doc,
      pageTitle,
      pagePath,
      setDoc,
      save,
    }),
    [kind, slug, loading, saving, dirty, doc, pageTitle, pagePath, save]
  );

  return (
    <SimpleContentContext.Provider value={value}>{children}</SimpleContentContext.Provider>
  );
}
