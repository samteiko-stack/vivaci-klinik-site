"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CRM_NAV_START, isInternalNavLink } from "@/lib/crm-navigation";

export default function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const prevPathname = useRef(pathname);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function start() {
    if (delayRef.current) clearTimeout(delayRef.current);
    delayRef.current = setTimeout(() => setPending(true), 150);
    if (safetyRef.current) clearTimeout(safetyRef.current);
    safetyRef.current = setTimeout(() => setPending(false), 8000);
  }

  function stop() {
    if (delayRef.current) clearTimeout(delayRef.current);
    if (safetyRef.current) clearTimeout(safetyRef.current);
    setPending(false);
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
      if (!isInternalNavLink(anchor)) return;
      start();
    }

    function onNavStart() {
      start();
    }

    document.addEventListener("click", onClick);
    window.addEventListener(CRM_NAV_START, onNavStart);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener(CRM_NAV_START, onNavStart);
    };
  }, []);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      stop();
    }
  }, [pathname]);

  useEffect(
    () => () => {
      if (delayRef.current) clearTimeout(delayRef.current);
      if (safetyRef.current) clearTimeout(safetyRef.current);
    },
    []
  );

  return (
    <div
      className={cn("crm-route-transition", pending && "crm-route-transition--pending")}
      aria-busy={pending || undefined}
    >
      <div className="ds-motion-page">{children}</div>
    </div>
  );
}
