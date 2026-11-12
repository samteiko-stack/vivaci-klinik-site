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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { TreatmentPageMeta } from "@/components/TreatmentPagePicker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ensureAllSections,
  emptySectionDefaults,
  type SectionKey,
  type TreatmentPageDoc,
} from "@/lib/treatment-page-schema";
import { readResponseJson } from "@/lib/utils";

type TreatmentPagesContextValue = {
  pages: TreatmentPageMeta[];
  filteredPages: TreatmentPageMeta[];
  query: string;
  setQuery: (value: string) => void;
  activePageId: string;
  requestPageSelect: (pageId: string) => void;
  doc: TreatmentPageDoc | null;
  dirty: boolean;
  saving: boolean;
  loadingPage: boolean;
  pageTitle: string;
  pagePath: string;
  heroImagePath: string;
  setHeroImagePath: (path: string) => void;
  save: () => Promise<void>;
  mutateSection: (
    key: SectionKey,
    updater: (section: Record<string, unknown>) => void
  ) => void;
};

const TreatmentPagesContext = createContext<TreatmentPagesContextValue | null>(null);

export function useTreatmentPages() {
  const ctx = useContext(TreatmentPagesContext);
  if (!ctx) {
    throw new Error("useTreatmentPages must be used within TreatmentPagesProvider");
  }
  return ctx;
}

export function TreatmentPagesProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pages, setPages] = useState<TreatmentPageMeta[]>([]);
  const [query, setQuery] = useState("");
  const [activePageId, setActivePageId] = useState("");
  const [doc, setDoc] = useState<TreatmentPageDoc | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingPage, setLoadingPage] = useState(false);
  const [pendingPageId, setPendingPageId] = useState("");
  const [heroImagePath, setHeroImagePath] = useState("");
  const [heroImageSaved, setHeroImageSaved] = useState("");

  const loadPages = useCallback(async () => {
    try {
      const res = await fetch("/api/treatment-pages", { credentials: "same-origin" });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) throw new Error("API error");
      const data = await readResponseJson<{ pages: TreatmentPageMeta[] }>(res);
      const list = data.pages ?? [];
      if (list.length === 0) {
        toast.error("Inga behandlingssidor hittades i content/treatment-pages");
      }
      setPages(list);
      setActivePageId((current) =>
        current || (list[0] ? `${list[0].category}/${list[0].slug}` : "")
      );
    } catch {
      toast.error("Kunde inte läsa sidlistan");
    }
  }, [router]);

  useEffect(() => {
    void loadPages();
  }, [loadPages]);

  const filteredPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [pages, query]);

  const loadPage = useCallback(async (pageId: string) => {
    const [category, slug] = pageId.split("/");
    setLoadingPage(true);
    try {
      const res = await fetch(`/api/treatment-pages/${category}/${slug}`, {
        credentials: "same-origin",
      });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) throw new Error("Not found");
      const data = await readResponseJson<TreatmentPageDoc>(res);
      setDoc(ensureAllSections(data));
      setDirty(false);
      const pagePath = String(data.path ?? `/${category}/${slug}`);
      try {
        const heroRes = await fetch(
          `/api/treatment-hero?href=${encodeURIComponent(pagePath)}`,
          { credentials: "same-origin" }
        );
        if (heroRes.ok) {
          const heroData = await readResponseJson<{ imagePath?: string }>(heroRes);
          const path = heroData.imagePath ?? "";
          setHeroImagePath(path);
          setHeroImageSaved(path);
        } else {
          setHeroImagePath("");
          setHeroImageSaved("");
        }
      } catch {
        setHeroImagePath("");
        setHeroImageSaved("");
      }
    } catch {
      toast.error("Kunde inte läsa sidan");
      setDoc(null);
    } finally {
      setLoadingPage(false);
    }
  }, [router]);

  useEffect(() => {
    if (!activePageId) return;
    void loadPage(activePageId);
  }, [activePageId, loadPage]);

  useEffect(() => {
    const title = doc?.title?.trim();
    document.title = title ? `${title} · Vivaci innehåll` : "Behandlingssidor · Vivaci";
  }, [doc?.title]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const requestPageSelect = useCallback(
    (pageId: string) => {
      if (pageId === activePageId) return;
      if (dirty) {
        setPendingPageId(pageId);
        return;
      }
      setActivePageId(pageId);
    },
    [activePageId, dirty]
  );

  const mutateSection = useCallback(
    (key: SectionKey, updater: (section: Record<string, unknown>) => void) => {
      setDoc((prev) => {
        if (!prev) return prev;
        const sections = { ...(prev.sections ?? {}) };
        const section = { ...(sections[key] ?? emptySectionDefaults(key)) };
        updater(section);
        sections[key] = section;
        return { ...prev, sections };
      });
      setDirty(true);
    },
    []
  );

  const updateHeroImagePath = useCallback((path: string) => {
    setHeroImagePath(path);
    setDirty(true);
  }, []);

  const save = useCallback(async () => {
    if (!doc || !activePageId) return;
    const [category, slug] = activePageId.split("/");
    setSaving(true);
    try {
      const pagePath =
        doc.path?.trim() ||
        pages.find((p) => p.category === category && p.slug === slug)?.path ||
        `/${category}/${slug}`;

      if (heroImagePath !== heroImageSaved) {
        const heroRes = await fetch("/api/treatment-hero", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ href: pagePath, imagePath: heroImagePath }),
        });
        const heroJson = await readResponseJson<{ error?: string }>(heroRes);
        if (!heroRes.ok) {
          throw new Error(heroJson.error ?? "Kunde inte spara hero-bild");
        }
        setHeroImageSaved(heroImagePath);
      }

      const payload = { ...doc };
      const heroTitle = (payload.sections?.hero as { title?: string } | undefined)?.title;
      if (heroTitle?.trim()) payload.title = heroTitle.trim();
      const res = await fetch(`/api/treatment-pages/${category}/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await readResponseJson<{ error?: string }>(res);
      if (!res.ok) throw new Error(json.error ?? "Sparning misslyckades");
      setDirty(false);
      toast.success("Sparat");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sparning misslyckades");
    } finally {
      setSaving(false);
    }
  }, [doc, activePageId, heroImagePath, heroImageSaved, pages]);

  const pageTitle = doc?.title ? String(doc.title) : "Välj en sida";
  const pagePath = doc?.path
    ? String(doc.path)
    : activePageId
      ? (() => {
          const [category, slug] = activePageId.split("/");
          return (
            pages.find((p) => p.category === category && p.slug === slug)?.path ??
            `/${category}/${slug}`
          );
        })()
      : "";

  const value = useMemo(
    () => ({
      pages,
      filteredPages,
      query,
      setQuery,
      activePageId,
      requestPageSelect,
      doc,
      dirty,
      saving,
      loadingPage,
      pageTitle,
      pagePath,
      heroImagePath,
      setHeroImagePath: updateHeroImagePath,
      save,
      mutateSection,
    }),
    [
      pages,
      filteredPages,
      query,
      activePageId,
      requestPageSelect,
      doc,
      dirty,
      saving,
      loadingPage,
      pageTitle,
      pagePath,
      heroImagePath,
      updateHeroImagePath,
      save,
      mutateSection,
    ]
  );

  return (
    <TreatmentPagesContext.Provider value={value}>
      {children}
      <AlertDialog
        open={Boolean(pendingPageId)}
        onOpenChange={(open) => {
          if (!open) setPendingPageId("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lämna osparade ändringar?</AlertDialogTitle>
            <AlertDialogDescription>
              Ändringarna på den här sidan har inte sparats och går förlorade om du fortsätter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stanna kvar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDirty(false);
                setActivePageId(pendingPageId);
                setPendingPageId("");
              }}
            >
              Fortsätt utan att spara
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TreatmentPagesContext.Provider>
  );
}
