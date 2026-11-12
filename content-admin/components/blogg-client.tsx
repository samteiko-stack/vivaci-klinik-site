"use client";

import { SimpleContentWorkspaceBlogg } from "@/components/simple-content-workspace";
import { useAutoSelectSlug } from "@/hooks/use-auto-select-slug";
import { ADMIN_BLOGG } from "@/lib/admin-routes";

export function BloggClient({ initialSlug }: { initialSlug: string | null }) {
  useAutoSelectSlug(ADMIN_BLOGG, "/api/nyheter", initialSlug);

  return <SimpleContentWorkspaceBlogg />;
}
