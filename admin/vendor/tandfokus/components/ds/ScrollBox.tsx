"use client";

import { forwardRef, useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollRegion } from "./ScrollRegion";

interface ScrollBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  bodyClassName?: string;
  topHint?: string;
  bottomHint?: string;
  children: React.ReactNode;
}

export const ScrollBox = forwardRef<HTMLDivElement, ScrollBoxProps>(function ScrollBox(
  { children, bodyClassName, topHint, bottomHint, className, ...props },
  ref
) {
  const [edges, setEdges] = useState({ overflow: false, top: true, bottom: true });

  const sync = useCallback(() => {
    const el = ref && "current" in ref ? ref.current : null;
    if (!el) return;
    const overflow = el.scrollHeight - el.clientHeight > 2;
    setEdges({
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

    return () => {
      el.removeEventListener("scroll", sync);
      ro.disconnect();
    };
  }, [ref, sync, children]);

  return (
    <div className={cn("ds-scroll-box", className)} {...props}>
      {topHint && edges.overflow && !edges.top && (
        <div className="ds-scroll-box__hint ds-scroll-box__hint--top" aria-hidden>
          {topHint}
        </div>
      )}
      {bottomHint && edges.overflow && !edges.bottom && (
        <div className="ds-scroll-box__hint ds-scroll-box__hint--bottom" aria-hidden>
          {bottomHint}
        </div>
      )}
      <ScrollRegion ref={ref} bodyClassName={cn("ds-scroll-box__body", bodyClassName)}>
        {children}
      </ScrollRegion>
    </div>
  );
});
