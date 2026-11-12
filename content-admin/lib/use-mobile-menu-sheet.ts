"use client";

import { useEffect, useState } from "react";
import { MOBILE_MENU_SHEET_MAX_WIDTH } from "@/lib/menu-portal";

/** True when a portaled menu should render as a full-width bottom sheet. */
export function useMobileMenuSheet(enabled: boolean, open: boolean): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MENU_SHEET_MAX_WIDTH}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return enabled && open && isMobile;
}
