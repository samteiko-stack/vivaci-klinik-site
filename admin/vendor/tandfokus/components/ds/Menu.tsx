"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "@/lib/icons";
import type { PortalMenuAlign } from "@/lib/menu-portal";
import { usePortalMenuPosition } from "@/lib/use-portal-menu-position";
import { useMobileMenuSheet } from "@/lib/use-mobile-menu-sheet";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

type MenuContextValue = {
  open: boolean;
  setOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  rootRef: React.RefObject<HTMLDivElement | null>;
  triggerRef: React.RefObject<HTMLElement | null>;
  panelRef: React.RefObject<HTMLDivElement | null>;
};

const MenuContext = React.createContext<MenuContextValue | null>(null);

function useMenu() {
  const ctx = React.useContext(MenuContext);
  if (!ctx) throw new Error("Menu components must be used within Menu");
  return ctx;
}

function useMenuOutsideClose(
  open: boolean,
  onClose: () => void,
  rootRef: React.RefObject<HTMLDivElement | null>,
  panelRef: React.RefObject<HTMLDivElement | null>
) {
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onClose();
    }
    if (open) document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open, onClose, panelRef, rootRef]);
}

function useMenuProviderValue(
  open: boolean,
  setOpen: MenuContextValue["setOpen"]
): MenuContextValue {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  return { open, setOpen, rootRef, triggerRef, panelRef };
}

export function Menu({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ctx = useMenuProviderValue(open, setOpen);

  useMenuOutsideClose(open, () => setOpen(false), ctx.rootRef, ctx.panelRef);

  return (
    <MenuContext.Provider value={ctx}>
      <div ref={ctx.rootRef} className={cn("ds-menu", className)}>
        {children}
      </div>
    </MenuContext.Provider>
  );
}

/** Toolbar filter dropdown trigger */
export function FilterTrigger({
  children,
  active,
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}) {
  const { open, setOpen, triggerRef } = useMenu();
  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      type="button"
      className={cn(
        "ds-filter-trigger",
        active && "ds-filter-trigger--active",
        open && "ds-filter-trigger--open",
        className
      )}
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
    >
      {children}
      <ChevronDown
        className={cn("ds-filter-trigger__chevron", open && "ds-filter-trigger__chevron--open")}
      />
    </button>
  );
}

/** Standalone toolbar toggle — same chrome as FilterTrigger but toggles a filter instead of opening a menu. */
export function FilterToggle({
  children,
  active,
  compact,
  onClick,
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  compact?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "ds-filter-trigger",
        compact && "ds-filter-trigger--compact",
        active && "ds-filter-trigger--active",
        className
      )}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function MenuTrigger({
  children,
  className,
  variant = "secondary",
  size = "sm",
  disabled,
  fullWidth,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  const { open, setOpen, triggerRef } = useMenu();
  return (
    <span ref={triggerRef as React.RefObject<HTMLSpanElement>} className="ds-menu-trigger-wrap">
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={disabled}
        fullWidth={fullWidth}
        className={className}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {children}
      </Button>
    </span>
  );
}

export function MenuPanel({
  children,
  align = "left",
  className,
  portal = true,
  mobileSheet = false,
}: {
  children: React.ReactNode;
  align?: PortalMenuAlign;
  className?: string;
  /** Render in a body portal so menus are not clipped by overflow containers (e.g. data tables). */
  portal?: boolean;
  /** Bottom sheet on narrow viewports (filter / select pickers). */
  mobileSheet?: boolean;
}) {
  const { open, setOpen, triggerRef, panelRef } = useMenu();
  const menuStyle = usePortalMenuPosition(open, portal, triggerRef, panelRef, {
    align,
    mobileSheet,
  });
  const sheetActive = useMobileMenuSheet(mobileSheet && portal, open);

  if (!open) return null;

  const panel = (
    <div
      ref={panelRef}
      className={cn(
        "ds-menu-panel",
        !portal && align === "right" && "ds-menu-panel--right",
        portal && "ds-menu-panel--portal",
        sheetActive && "ds-menu-panel--mobile-sheet",
        className
      )}
      style={portal ? menuStyle : undefined}
      role="menu"
    >
      {sheetActive ? (
        <>
          <div className="ds-menu-sheet-handle" aria-hidden />
          <div className="ds-menu-sheet-scroll">{children}</div>
        </>
      ) : (
        children
      )}
    </div>
  );

  if (portal && typeof document !== "undefined") {
    return createPortal(
      <>
        {sheetActive ? (
          <div
            className="ds-menu-sheet-backdrop"
            role="presentation"
            onClick={() => setOpen(false)}
          />
        ) : null}
        {panel}
      </>,
      document.body
    );
  }

  return panel;
}

export function MenuItem({
  children,
  active,
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const { setOpen } = useMenu();
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={cn("ds-menu-item", active && "ds-menu-item--active", className)}
      onClick={() => {
        onClick?.();
        setOpen(false);
      }}
    >
      <span className="ds-menu-item__label">{children}</span>
      <span className="ds-menu-item__check-slot" aria-hidden>
        {active ? <Check className="ds-menu-item__check" /> : null}
      </span>
    </button>
  );
}

export function ControlledMenu({
  open,
  onOpenChange,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const setOpen: MenuContextValue["setOpen"] = (v) => {
    const next = typeof v === "function" ? v(open) : v;
    onOpenChange(next);
  };
  const ctx = useMenuProviderValue(open, setOpen);

  useMenuOutsideClose(open, () => onOpenChange(false), ctx.rootRef, ctx.panelRef);

  return (
    <MenuContext.Provider value={ctx}>
      <div ref={ctx.rootRef} className={cn("ds-menu", className)}>
        {children}
      </div>
    </MenuContext.Provider>
  );
}
