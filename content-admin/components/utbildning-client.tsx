"use client";

import { SimpleContentWorkspace } from "@/components/simple-content-workspace";
import { useAutoSelectSlug } from "@/hooks/use-auto-select-slug";
import { ADMIN_UTBILDNING } from "@/lib/admin-routes";

export function UtbildningClient({ initialSlug }: { initialSlug: string | null }) {
  useAutoSelectSlug(ADMIN_UTBILDNING, "/api/utbildning", initialSlug);

  return (
    <SimpleContentWorkspace
      initialSlug={initialSlug}
      kind="utbildning"
      apiBase="/api/utbildning"
      emptyHint="Välj en utbildningssida i sidofältet."
    />
  );
}
