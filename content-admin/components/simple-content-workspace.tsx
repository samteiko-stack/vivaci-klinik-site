"use client";

import { SimpleContentClient } from "@/components/simple-content-client";

type WorkspaceProps = {
  initialSlug: string | null;
  apiBase: string;
  emptyHint: string;
  kind: "utbildning" | "nyheter";
};

export function SimpleContentWorkspace({
  initialSlug,
  apiBase,
  emptyHint,
  kind,
}: WorkspaceProps) {
  return (
    <SimpleContentClient
      kind={kind}
      apiBase={apiBase}
      slug={initialSlug}
      emptyHint={emptyHint}
    />
  );
}

export function SimpleContentWorkspaceBlogg({
  initialSlug,
}: {
  initialSlug: string | null;
}) {
  return (
    <SimpleContentWorkspace
      initialSlug={initialSlug}
      kind="nyheter"
      apiBase="/api/nyheter"
      emptyHint="Välj en bloggartikel i sidofältet."
    />
  );
}
