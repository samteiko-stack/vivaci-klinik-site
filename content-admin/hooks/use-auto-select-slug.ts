"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function useAutoSelectSlug(adminRoute: string, listApi: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");

  useEffect(() => {
    if (slug) return;
    let cancelled = false;
    fetch(listApi, { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { pages?: { slug: string }[] }) => {
        if (cancelled) return;
        const first = data.pages?.[0]?.slug;
        if (first) {
          router.replace(`${adminRoute}?slug=${encodeURIComponent(first)}`);
        }
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, [adminRoute, listApi, router, slug]);
}
