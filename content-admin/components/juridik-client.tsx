"use client";

import { SimpleContentWorkspaceLegal } from "@/components/simple-content-workspace";
import { useAutoSelectSlug } from "@/hooks/use-auto-select-slug";
import { ADMIN_LEGAL } from "@/lib/admin-routes";

export function JuridikClient() {
  useAutoSelectSlug(ADMIN_LEGAL, "/api/legal");

  return <SimpleContentWorkspaceLegal />;
}
