import type { CSSProperties } from "react";

export type PortalMenuAlign = "left" | "right";

export interface PortalMenuStyleOptions {
  align?: PortalMenuAlign;
  /** Pin menu width to the trigger width (form selects). */
  matchTriggerWidth?: boolean;
  /** Minimum panel width when not matching trigger width. */
  minPanelWidth?: number;
  /** On narrow viewports, anchor as a bottom sheet instead of under the trigger. */
  mobileSheet?: boolean;
}

/** Natural-height fallback before the panel is measured. */
const MENU_FLIP_MIN_SPACE_BELOW = 120;
/** Smallest max-height a clamped panel may shrink to (about two rows). */
const MENU_MIN_CLAMPED_HEIGHT = 96;

export const MOBILE_MENU_SHEET_MAX_WIDTH = 768;

export function prefersMobileMenuSheet(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(`(max-width: ${MOBILE_MENU_SHEET_MAX_WIDTH}px)`).matches;
}

export function getMobileSheetMenuStyle(): CSSProperties {
  return {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    top: "auto",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    maxHeight: "var(--menu-sheet-max-height)",
  };
}

const menuLayerCache = new WeakMap<HTMLElement, number>();

function readZToken(name: string): number {
  return parseInt(getComputedStyle(document.documentElement).getPropertyValue(name), 10) || 0;
}

/**
 * Portaled menus stack immediately above the layer their trigger lives in — never a global
 * top layer. Triggers inside a table → `--z-table-menu` (below the sticky header and list toolbar,
 * so the header always wins); other page content → `--z-popover` (below the fixed nav);
 * inside a fixed/sticky layer with a z-index (modal, nav, bulk bar, sticky thead, parent menu)
 * → that layer + 1.
 */
function getMenuLayerZIndex(trigger: HTMLElement): number {
  const cached = menuLayerCache.get(trigger);
  if (cached !== undefined) return cached;

  const base = readZToken(trigger.closest("table") ? "--z-table-menu" : "--z-popover");
  let layer = 0;
  for (let el = trigger.parentElement; el && el !== document.body; el = el.parentElement) {
    const { position, zIndex } = getComputedStyle(el);
    const z = parseInt(zIndex, 10);
    if ((position === "fixed" || position === "sticky") && Number.isFinite(z)) {
      layer = z + 1;
      break;
    }
  }
  const resolved = Math.max(base, layer);
  menuLayerCache.set(trigger, resolved);
  return resolved;
}

interface MenuBoundary {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Viewport rectangle a table-cell menu is allowed to paint in: the scroll region below the sticky
 * header. Rows scroll under the header, and the menu — anchored to its row — must too, so it is
 * clipped to this box instead of floating over the header, toolbar or list footer. Bottom/sides are
 * only enforced when the region actually scrolls, so short lists can still open a tall menu.
 * Triggers outside a table are bounded by the viewport.
 */
function getMenuBoundary(trigger: HTMLElement, viewportPadding: number): MenuBoundary {
  const viewport: MenuBoundary = {
    top: viewportPadding,
    bottom: document.documentElement.clientHeight - viewportPadding,
    left: 0,
    right: window.innerWidth,
  };
  const scroller = trigger.closest<HTMLElement>(".ds-data-table-scroll");
  const thead = trigger.closest("table")?.tHead;
  if (!scroller && !thead) return viewport;

  const boundary = { ...viewport };
  if (thead) boundary.top = Math.max(boundary.top, thead.getBoundingClientRect().bottom);
  if (scroller) {
    const rect = scroller.getBoundingClientRect();
    boundary.top = Math.max(boundary.top, rect.top);
    if (scroller.scrollHeight - scroller.clientHeight > 2) {
      boundary.bottom = Math.min(boundary.bottom, rect.bottom);
    }
    if (scroller.scrollWidth - scroller.clientWidth > 2) {
      boundary.left = Math.max(boundary.left, rect.left);
      boundary.right = Math.min(boundary.right, rect.right);
    }
  }
  return boundary;
}

/** Extra paint area kept on unclipped sides so the panel shadow is not cut off. */
const MENU_CLIP_BLEED = 24;

/** Clip the panel to the boundary box; undefined when nothing needs clipping. */
function getMenuClip(
  boundary: MenuBoundary,
  box: { top: number; left: number; width: number; height: number }
): Pick<CSSProperties, "clipPath"> {
  const top = Math.max(0, boundary.top - box.top);
  const bottom = Math.max(0, box.top + box.height - boundary.bottom);
  const left = Math.max(0, boundary.left - box.left);
  const right = Math.max(0, box.left + box.width - boundary.right);
  if (!top && !bottom && !left && !right) return {};
  const edge = (px: number) => (px ? `${px}px` : `-${MENU_CLIP_BLEED}px`);
  return { clipPath: `inset(${edge(top)} ${edge(right)} ${edge(bottom)} ${edge(left)})` };
}

/** Content height ignoring any max-height clamp, so flip decisions are stable. */
function getPanelNaturalHeight(panel: HTMLElement | null): number {
  if (!panel) return 0;
  return panel.scrollHeight + (panel.offsetHeight - panel.clientHeight);
}

export function getPortalMenuStyle(
  trigger: HTMLElement,
  panel: HTMLElement | null,
  {
    align = "left",
    matchTriggerWidth = false,
    minPanelWidth = 0,
    mobileSheet = false,
  }: PortalMenuStyleOptions = {}
): CSSProperties {
  if (mobileSheet && prefersMobileMenuSheet()) {
    return getMobileSheetMenuStyle();
  }

  const rect = trigger.getBoundingClientRect();
  const gap = 4;
  const viewportPadding = 8;
  const measuredWidth = panel?.offsetWidth ?? 0;
  const panelWidth = matchTriggerWidth
    ? rect.width
    : Math.max(measuredWidth, rect.width, minPanelWidth);
  // clientHeight excludes horizontal scrollbars, which is what `position: fixed; bottom` is measured from.
  const viewportHeight = document.documentElement.clientHeight;
  const boundary = getMenuBoundary(trigger, viewportPadding);
  const spaceBelow = boundary.bottom - rect.bottom - gap;
  // Opening upward must never cover the sticky table header (or leave the viewport).
  const spaceAbove = rect.top - gap - boundary.top;
  const measuredNaturalHeight = getPanelNaturalHeight(panel);
  const maxHeightBelow = Math.max(MENU_MIN_CLAMPED_HEIGHT, spaceBelow);
  const maxHeightAbove = Math.max(MENU_MIN_CLAMPED_HEIGHT, spaceAbove);
  // Flip from measured content; before measure, assume the downward slot (not the 120px stub).
  const naturalHeightForFlip =
    measuredNaturalHeight ||
    Math.max(MENU_FLIP_MIN_SPACE_BELOW, maxHeightBelow);
  const openUp =
    spaceBelow < naturalHeightForFlip && spaceAbove > spaceBelow;

  let left = align === "right" ? rect.right - panelWidth : rect.left;
  left = Math.max(
    viewportPadding,
    Math.min(left, window.innerWidth - panelWidth - viewportPadding)
  );

  const maxHeight = openUp ? maxHeightAbove : maxHeightBelow;
  const visibleHeight =
    panel && panel.offsetHeight > 0
      ? panel.offsetHeight
      : measuredNaturalHeight > 0
        ? Math.min(measuredNaturalHeight, maxHeight)
        : maxHeight;
  const top = openUp ? rect.top - gap - visibleHeight : rect.bottom + gap;
  // Trigger scrolled fully out of the visible region — hide the panel until it returns.
  const triggerHidden = rect.bottom <= boundary.top || rect.top >= boundary.bottom;

  return {
    position: "fixed",
    left,
    zIndex: getMenuLayerZIndex(trigger),
    ...getMenuClip(boundary, { top, left, width: panelWidth, height: visibleHeight }),
    ...(triggerHidden ? { visibility: "hidden", pointerEvents: "none" } : {}),
    ...(matchTriggerWidth ? { width: panelWidth } : { minWidth: panelWidth }),
    ...(openUp
      ? { bottom: viewportHeight - rect.top + gap, top: "auto" }
      : { top: rect.bottom + gap, bottom: "auto" }),
    maxHeight,
  };
}
