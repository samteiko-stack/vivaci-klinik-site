import "server-only";

import fsPromises from "node:fs/promises";
import path from "node:path";
import { REPO_ROOT } from "@/lib/content-path";
import {
  contentPathExists,
  joinContentPath,
  resolveContentPath,
} from "@/lib/fs-path";

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
  ".avif",
]);

/** Repo marketing `public/` (falls back to Next `public/` when synced alone). */
export function getSitePublicRoot(): string {
  const fromRepo = joinContentPath(REPO_ROOT, "public");
  if (contentPathExists(fromRepo)) return fromRepo;
  return joinContentPath(process.cwd(), "public");
}

export const SITE_PUBLIC_ROOT = getSitePublicRoot();

export const SITE_IMAGES_DIR = joinContentPath(SITE_PUBLIC_ROOT, "images");

export function resolveSitePublicFile(webPath: string): string {
  const normalized = webPath.startsWith("/") ? webPath.slice(1) : webPath;
  return joinContentPath(SITE_PUBLIC_ROOT, normalized);
}

export function assertInsideSitePublic(absPath: string): void {
  const resolved = resolveContentPath(absPath);
  const root = resolveContentPath(SITE_PUBLIC_ROOT);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error("Path outside public root");
  }
}

export function resolveSafePublicSegments(segments: string[]): string {
  const relative = segments
    .flatMap((s) => s.split(/[/\\]/))
    .filter((s) => s && s !== "." && s !== "..")
    .join(path.sep);
  const abs = joinContentPath(SITE_PUBLIC_ROOT, relative);
  assertInsideSitePublic(abs);
  return abs;
}

export function isImageFileName(fileName: string): boolean {
  return IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

export type SiteImageEntry = {
  /** Web path, e.g. `/images/foo.webp` */
  path: string;
  name: string;
};

export async function listSiteImages(options: {
  subdir?: string;
  query?: string;
  offset?: number;
  limit?: number;
}): Promise<{ items: SiteImageEntry[]; total: number }> {
  const subdir = (options.subdir ?? "").replace(/^\/+/, "").replace(/^images\/?/, "");
  const root = subdir ? joinContentPath(SITE_IMAGES_DIR, subdir) : SITE_IMAGES_DIR;
  assertInsideSitePublic(root);

  const query = options.query?.trim().toLowerCase() ?? "";
  const offset = Math.max(0, options.offset ?? 0);
  const limit = Math.min(120, Math.max(1, options.limit ?? 60));

  const collected: SiteImageEntry[] = [];

  async function walk(dir: string) {
    let entries: { name: string; isDirectory(): boolean }[];
    try {
      entries = await fsPromises.readdir(/* turbopackIgnore: true */ dir, {
        withFileTypes: true,
      });
    } catch {
      return;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name, "sv"));
    for (const entry of entries) {
      const abs = joinContentPath(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(abs);
        continue;
      }
      if (!isImageFileName(entry.name)) continue;
      const relFromPublic = path
        .relative(SITE_PUBLIC_ROOT, abs)
        .split(path.sep)
        .join("/");
      const webPath = `/${relFromPublic}`;
      const name = entry.name;
      if (query && !webPath.toLowerCase().includes(query) && !name.toLowerCase().includes(query)) {
        continue;
      }
      collected.push({ path: webPath, name });
    }
  }

  await walk(root);
  const total = collected.length;
  const items = collected.slice(offset, offset + limit);
  return { items, total };
}
