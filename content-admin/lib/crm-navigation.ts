/** Minimal internal-link helper (from Tandfokus CRM navigation). */
export function isInternalNavLink(anchor: HTMLAnchorElement): boolean {
  if (anchor.target === "_blank") return false;
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#")) return false;
  if (href.startsWith("http://") || href.startsWith("https://")) {
    try {
      const url = new URL(href);
      return url.origin === window.location.origin;
    } catch {
      return false;
    }
  }
  return href.startsWith("/");
}

export const CRM_NAV_START = "crm-nav-start";
