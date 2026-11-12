"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "@/lib/icons";
import { getPortalMenuStyle } from "@/lib/menu-portal";
import { cn } from "@/lib/utils";

export interface RowAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export function RowActionsMenu({
  items,
  ariaLabel = "Row actions",
  className,
}: {
  items: RowAction[];
  ariaLabel?: string;
  className?: string;
}) {
  const visibleItems = items.filter((item) => item.label.trim().length > 0);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function updatePortalPosition() {
    const trigger = triggerRef.current;
    if (!trigger) return;
    setMenuStyle(
      getPortalMenuStyle(trigger, panelRef.current, { align: "right", minPanelWidth: 168 })
    );
  }

  useLayoutEffect(() => {
    if (!open) return;
    updatePortalPosition();
    const raf = requestAnimationFrame(updatePortalPosition);
    const onReposition = () => updatePortalPosition();
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [open, visibleItems.length]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  if (visibleItems.length === 0) return null;

  const menuPanel = (
    <div
      ref={panelRef}
      className="ds-menu-panel ds-menu-panel--portal ds-row-actions-panel"
      style={menuStyle}
      role="menu"
    >
      {visibleItems.map((item) => (
        <button
          key={item.key}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          className={cn("ds-menu-item", item.danger && "ds-menu-item--danger")}
          onClick={() => {
            if (item.disabled) return;
            item.onClick();
            setOpen(false);
          }}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div
      ref={rootRef}
      className={cn("ds-row-actions-menu", className)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        className="ds-row-actions-trigger"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <MoreVertical className="ds-icon-sm" />
      </button>
      {open && typeof document !== "undefined" ? createPortal(menuPanel, document.body) : null}
    </div>
  );
}
