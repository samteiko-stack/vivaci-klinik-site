"use client";

import { forwardRef, useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ScrollRegionProps extends React.HTMLAttributes<HTMLDivElement> {
  bodyClassName?: string;
  fadeColor?: string;
}

export const ScrollRegion = forwardRef<HTMLDivElement, ScrollRegionProps>(function ScrollRegion(
  { children, className, bodyClassName, fadeColor, style, ...props },
  ref
) {
  const [edge, setEdge] = useState({ overflow: false, top: true, bottom: true });

  const sync = useCallback(() => {
    const el = ref && "current" in ref ? ref.current : null;
    if (!el) return;
    const overflow = el.scrollHeight - el.clientHeight > 2;
    setEdge({
      overflow,
      top: el.scrollTop <= 2,
      bottom: el.scrollTop + el.clientHeight >= el.scrollHeight - 2,
    });
  }, [ref]);

  useEffect(() => {
    const el = ref && "current" in ref ? ref.current : null;
    if (!el) return;

    sync();
    el.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    for (const child of el.children) ro.observe(child);

    return () => {
      el.removeEventListener("scroll", sync);
      ro.disconnect();
    };
  }, [ref, sync, children]);

  return (
    <div
      className={cn("ds-scroll-region", className)}
      data-overflow={edge.overflow ? "true" : "false"}
      data-at-top={edge.top ? "true" : "false"}
      data-at-bottom={edge.bottom ? "true" : "false"}
      style={
        fadeColor
          ? ({ ...style, "--ds-scroll-fade": fadeColor } as React.CSSProperties)
          : style
      }
      {...props}
    >
      <div ref={ref} className={cn("ds-scroll-region__body", bodyClassName)}>
        {children}
      </div>
    </div>
  );
});
