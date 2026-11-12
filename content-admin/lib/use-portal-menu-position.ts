"use client";

import { useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";
import { getPortalMenuStyle, type PortalMenuStyleOptions } from "@/lib/menu-portal";

function sameStyle(a: CSSProperties, b: CSSProperties): boolean {
  const keysA = Object.keys(a) as (keyof CSSProperties)[];
  const keysB = Object.keys(b);
  return keysA.length === keysB.length && keysA.every((k) => a[k] === b[k]);
}

/**
 * Fixed-position style for a portaled menu panel. Re-measures on scroll (any container),
 * resize, and one post-layout frame while open. Only commits when placement changes.
 */
export function usePortalMenuPosition(
  open: boolean,
  enabled: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  { align, matchTriggerWidth, minPanelWidth, mobileSheet }: PortalMenuStyleOptions = {}
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    if (!open || !enabled) {
      setStyle({});
      return;
    }

    function update() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const next = getPortalMenuStyle(trigger, panelRef.current, {
        align,
        matchTriggerWidth,
        minPanelWidth,
        mobileSheet,
      });
      setStyle((prev) => (sameStyle(prev, next) ? prev : next));
    }

    update();
    const raf = requestAnimationFrame(update);
    const onReposition = () => update();
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [open, enabled, triggerRef, panelRef, align, matchTriggerWidth, minPanelWidth, mobileSheet]);

  return style;
}
