"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SimpleContentClient } from "@/components/simple-content-client";
import {
  SimplePagePicker,
  type SimplePageMeta,
} from "@/components/simple-page-picker";

type WorkspaceProps = {
  initialSlug: string | null;
  listApi: string;
  editApi: string;
  routeBase: string;
  emptyHint: string;
  kind: "utbildning" | "nyheter";
};

function SimpleContentWorkspaceBase({
  initialSlug,
  listApi,
  editApi,
  routeBase,
  emptyHint,
  kind,
}: WorkspaceProps) {
  const router = useRouter();
  const [pages, setPages] = useState<SimplePageMeta[]>([]);
  const [query, setQuery] = useState("");
  const [slug, setSlug] = useState(initialSlug ?? "");

  useEffect(() => {
    setSlug(initialSlug ?? "");
  }, [initialSlug]);

  useEffect(() => {
    fetch(listApi, { credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data: { pages: SimplePageMeta[] }) => setPages(data.pages))
      .catch(() => setPages([]));
  }, [listApi]);

  const selectSlug = useCallback(
    (next: string) => {
      setSlug(next);
      const url = next ? `${routeBase}?slug=${encodeURIComponent(next)}` : routeBase;
      router.replace(url);
    },
    [routeBase, router]
  );

  return (
  <div className="flex min-h-0 flex-1 overflow-hidden">
      <aside className="hidden w-64 shrink-0 border-r bg-muted/30 p-2 md:block">
        <SimplePagePicker
          pages={pages}
          query={query}
          onQueryChange={setQuery}
          activeSlug={slug}
          onSelect={selectSlug}
          className="h-full border-0 bg-transparent"
        />
      </aside>
      <SimpleContentClient
        kind={kind}
        apiBase={editApi}
        slug={slug || null}
        emptyHint={emptyHint}
      />
    </div>
  );
}

export function SimpleContentWorkspace({
  initialSlug,
}: {
  initialSlug: string | null;
}) {
  return (
    <SimpleContentWorkspaceBase
      initialSlug={initialSlug}
      kind="utbildning"
      listApi="/api/utbildning"
      editApi="/api/utbildning"
      routeBase="/utbildning"
      emptyHint="Välj en utbildningssida i sidofältet."
    />
  );
}

export function SimpleContentWorkspaceBlogg({
  initialSlug,
}: {
  initialSlug: string | null;
}) {
  return (
    <SimpleContentWorkspaceBase
      initialSlug={initialSlug}
      kind="nyheter"
      listApi="/api/nyheter"
      editApi="/api/nyheter"
      routeBase="/blogg"
      emptyHint="Välj en bloggartikel i sidofältet."
    />
  );
}
