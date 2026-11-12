"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAutoSelectSlug(
  adminRoute: string,
  listApi: string,
  initialSlug: string | null
) {
  const router = useRouter();

  useEffect(() => {
    if (initialSlug) return;
    let cancelled = false;
    fetch(listApi, { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { pages?: { slug: string }[] }) => {
        if (cancelled) return;
        const first = data.pages?.[0]?.slug;
        if (first) {
          router.replace(
            `${adminRoute}?slug=${encodeURIComponent(first)}`
          );
        }
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, [adminRoute, initialSlug, listApi, router]);
}
