"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "@/lib/icons";
import { usePortalMenuPosition } from "@/lib/use-portal-menu-position";
import { useMobileMenuSheet } from "@/lib/use-mobile-menu-sheet";
import { cn } from "@/lib/utils";
import { Spinner } from "./Feedback";
import { Text } from "./Text";

export interface SelectFieldOption {
  value: string;
  label: string;
  muted?: boolean;
}

export function SelectField({
  value,
  options,
  onChange,
  disabled,
  loading,
  error,
  className,
  menuPortal = true,
  size = "default",
}: {
  value: string;
  options: SelectFieldOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  className?: string;
  /** Portaled by default so menus are never clipped by overflow containers. Opt out only outside overflow. */
  menuPortal?: boolean;
  /** default = form field; table = inline cell control matching row typography */
  size?: "default" | "table";
}) {
  const [open, setOpen] = useState(false);
  const sheetActive = useMobileMenuSheet(menuPortal, open);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  const menuStyle = usePortalMenuPosition(open, menuPortal, triggerRef, panelRef, {
    matchTriggerWidth: size !== "table",
    mobileSheet: true,
  });

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const menuItems = options.map((opt) => (
    <button
      key={opt.value}
      type="button"
      role="option"
      aria-selected={opt.value === value}
      className={cn("ds-menu-item", opt.value === value && "ds-menu-item--active")}
      onClick={() => {
        onChange(opt.value);
        setOpen(false);
      }}
    >
      <span
        className={cn(
          "ds-menu-item__label",
          opt.muted && "ds-select-trigger__label--muted"
        )}
      >
        {opt.label}
      </span>
      <span className="ds-menu-item__check-slot" aria-hidden>
        {opt.value === value ? <Check className="ds-menu-item__check" /> : null}
      </span>
    </button>
  ));

  const menuPanel = (
    <div
      ref={panelRef}
      className={cn(
        "ds-menu-panel ds-select-menu-panel",
        menuPortal && "ds-menu-panel--portal",
        sheetActive && "ds-menu-panel--mobile-sheet"
      )}
      style={menuPortal ? menuStyle : undefined}
      role="listbox"
    >
      {sheetActive ? (
        <>
          <div className="ds-menu-sheet-handle" aria-hidden />
          <div className="ds-menu-sheet-scroll">{menuItems}</div>
        </>
      ) : (
        menuItems
      )}
    </div>
  );

  return (
    <div
      ref={rootRef}
      className={cn(
        "ds-menu ds-menu--block",
        size === "table" && "ds-select-field--table",
        error && "ds-select-field--error",
        className
      )}
    >
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          "ds-select-trigger",
          size === "table" && "ds-select-trigger--table",
          open && "ds-select-trigger--open",
          loading && "ds-select-trigger--loading"
        )}
        onClick={() => !disabled && !loading && setOpen((v) => !v)}
        disabled={disabled || loading}
        aria-expanded={open}
        aria-busy={loading || undefined}
      >
        {loading && <Spinner size="sm" className="ds-select-trigger__spinner" />}
        <span
          className={cn(
            "ds-select-trigger__label",
            current?.muted && "ds-select-trigger__label--muted"
          )}
        >
          {current?.label ?? "Select…"}
        </span>
        {!loading && (
          <ChevronDown
            className={cn("ds-select-trigger__chevron", open && "ds-select-trigger__chevron--open")}
          />
        )}
      </button>

      {open &&
        (menuPortal && typeof document !== "undefined"
          ? createPortal(
              <>
                {sheetActive ? (
                  <div
                    className="ds-menu-sheet-backdrop"
                    role="presentation"
                    onClick={() => setOpen(false)}
                  />
                ) : null}
                {menuPanel}
              </>,
              document.body
            )
          : menuPanel)}

      {error && size !== "table" && (
        <Text variant="body-sm" className="ds-field-error">
          {error}
        </Text>
      )}
    </div>
  );
}
