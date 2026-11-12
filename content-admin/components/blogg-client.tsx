"use client";

"use client";

import { SimpleContentWorkspaceBlogg } from "@/components/simple-content-workspace";

export function BloggClient({ initialSlug }: { initialSlug: string | null }) {
  return <SimpleContentWorkspaceBlogg initialSlug={initialSlug} />;
}
