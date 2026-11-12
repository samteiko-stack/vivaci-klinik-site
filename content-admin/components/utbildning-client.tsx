"use client";

import { SimpleContentWorkspace } from "@/components/simple-content-workspace";
import { useAutoSelectSlug } from "@/hooks/use-auto-select-slug";
import { ADMIN_UTBILDNING } from "@/lib/admin-routes";

export function UtbildningClient() {
  useAutoSelectSlug(ADMIN_UTBILDNING, "/api/utbildning");

  return (
    <SimpleContentWorkspace emptyHint="Välj en utbildningssida i sidofältet." />
  );
}
