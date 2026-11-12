/** Client-safe helpers for `/images/…` paths in the admin UI. */

/** Vivaci wordmark on light surfaces (repo `public/images/`). */
export const VIVACI_LOGO_DARK_WEB_PATH = "/images/logo-vivaci-dark.webp";

/** Vivaci wordmark on dark surfaces — same asset as marketing footer (`footer-logo_main`). */
export const VIVACI_LOGO_FOR_DARK_BG_WEB_PATH =
  "/images/logo-vivaci-white.webp";

export function vivaciLogoDarkAdminUrl(): string {
  return siteAssetAdminUrl(VIVACI_LOGO_DARK_WEB_PATH);
}

export function vivaciLogoForDarkBgAdminUrl(): string {
  return siteAssetAdminUrl(VIVACI_LOGO_FOR_DARK_BG_WEB_PATH);
}

export function normalizeImageWebPath(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  return `/${trimmed.replace(/^\/+/, "")}`;
}

export function isPreviewableLocalImage(path: string): boolean {
  const p = normalizeImageWebPath(path);
  return Boolean(p && p.startsWith("/") && !/^https?:\/\//i.test(p));
}

/**
 * URL for marketing images in the admin UI.
 * Assets live under `content-admin/public/` (same as the live site) — serve via `/images/…`
 * so `next/image` and static hosting work on Vercel without bundling binaries into API routes.
 */
export function siteAssetAdminUrl(webPath: string): string {
  return normalizeImageWebPath(webPath);
}
