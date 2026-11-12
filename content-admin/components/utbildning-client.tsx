"use client";

"use client";

import { SimpleContentWorkspace } from "@/components/simple-content-workspace";

export function UtbildningClient({ initialSlug }: { initialSlug: string | null }) {
  return (
    <SimpleContentWorkspace
      initialSlug={initialSlug}
      kind="utbildning"
      apiBase="/api/utbildning"
      emptyHint="Välj en utbildningssida i sidofältet."
    />
  );
}
