import fs from "node:fs/promises";
import { resolveContentSubdir } from "./content-path";
import { mirrorPublicContentJson } from "./content-mirror";
import {
  joinContentPath,
  readContentFile,
  renameContentFile,
  resolveContentPath,
  writeContentFile,
} from "./fs-path";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const EXCLUDE = new Set(["index.json", "listing.json", "page.json"]);

const HUB_PAGES: Record<
  "utbildning" | "nyheter",
  { slug: string; title: string; path: string; group: string }
> = {
  utbildning: {
    slug: "index",
    title: "Utbildningsöversikt",
    path: "/utbildning",
    group: "Översikt",
  },
  nyheter: {
    slug: "listing",
    title: "Bloggöversikt",
    path: "/blogg",
    group: "Översikt",
  },
};

const SPECIAL_SLUG_FILE: Record<string, string> = {
  index: "index.json",
  listing: "listing.json",
  "blogg-layout": "page.json",
};

import type { SimpleContentMeta } from "./simple-json-store-types";

export type { SimpleContentMeta };

function contentDir(kind: "utbildning" | "nyheter"): string {
  return resolveContentSubdir(kind);
}

function fileForSlug(kind: "utbildning" | "nyheter", slug: string): string {
  if (SPECIAL_SLUG_FILE[slug]) {
    return joinContentPath(contentDir(kind), SPECIAL_SLUG_FILE[slug]!);
  }
  if (!SLUG_RE.test(slug)) throw new Error("Invalid slug");
  return joinContentPath(contentDir(kind), `${slug}.json`);
}

function fileFor(kind: "utbildning" | "nyheter", slug: string): string {
  const file = fileForSlug(kind, slug);
  const resolved = resolveContentPath(file);
  const base = resolveContentPath(contentDir(kind));
  if (!resolved.startsWith(base)) throw new Error("Invalid path");
  return resolved;
}

function pathForMeta(kind: "utbildning" | "nyheter", slug: string, data: Record<string, unknown>): string {
  if (typeof data.path === "string" && data.path.startsWith("/")) return data.path;
  if (kind === "utbildning") return `/utbildning/${slug}`;
  return `/nyheter/${slug}`;
}

function slugFromHref(href: unknown): string | null {
  if (typeof href !== "string" || !href.startsWith("/")) return null;
  const part = href.split("/").filter(Boolean).pop();
  return part && SLUG_RE.test(part) ? part : null;
}

async function mergeFromHubJson(
  kind: "utbildning" | "nyheter",
  pages: SimpleContentMeta[]
): Promise<SimpleContentMeta[]> {
  const hubFile = kind === "utbildning" ? "index.json" : "listing.json";
  const dir = contentDir(kind);
  try {
    const raw = await readContentFile(joinContentPath(dir, hubFile));
    const data = JSON.parse(raw) as { categories?: unknown[] };
    const known = new Set(pages.map((p) => p.slug));
    if (!Array.isArray(data.categories)) return pages;
    for (const cat of data.categories) {
      if (!cat || typeof cat !== "object") continue;
      const items = (cat as { items?: unknown[] }).items;
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        if (!item || typeof item !== "object") continue;
        const row = item as { href?: unknown; label?: unknown };
        const slug = slugFromHref(row.href);
        if (!slug || known.has(slug)) continue;
        known.add(slug);
        pages.push({
          slug,
          title:
            (typeof row.label === "string" && row.label) ||
            slug.replace(/-/g, " "),
          path: String(row.href),
          group: "Sidor",
        });
      }
    }
  } catch {
    /* hub file optional */
  }
  const hubSlug = HUB_PAGES[kind].slug;
  pages.sort((a, b) => {
    if (a.slug === hubSlug) return -1;
    if (b.slug === hubSlug) return 1;
    return a.title.localeCompare(b.title, "sv");
  });
  return pages;
}

export async function listSimpleContent(
  kind: "utbildning" | "nyheter"
): Promise<SimpleContentMeta[]> {
  const dir = contentDir(kind);
  const pages: SimpleContentMeta[] = [HUB_PAGES[kind]];

  let files: string[];
  try {
    files = await fs.readdir(dir);
  } catch {
    return mergeFromHubJson(kind, pages);
  }

  for (const file of files.filter((f) => f.endsWith(".json") && !EXCLUDE.has(f))) {
    const slug = file.replace(/\.json$/, "");
    const raw = await readContentFile(joinContentPath(dir, file));
    const data = JSON.parse(raw) as Record<string, unknown>;
    const title =
      (typeof data.title === "string" && data.title) ||
      slug.replace(/-/g, " ");
    pages.push({
      slug,
      title,
      path: pathForMeta(kind, slug, data),
      group: "Sidor",
    });
  }

  return mergeFromHubJson(kind, pages);
}

export async function readSimpleContent(kind: "utbildning" | "nyheter", slug: string) {
  const file = fileFor(kind, slug);
  const raw = await readContentFile(file);
  return JSON.parse(raw) as Record<string, unknown>;
}

export async function writeSimpleContent(
  kind: "utbildning" | "nyheter",
  slug: string,
  data: Record<string, unknown>
) {
  const file = fileFor(kind, slug);
  const json = `${JSON.stringify(data, null, 2)}\n`;
  const tmp = `${file}.tmp`;
  await writeContentFile(tmp, json);
  await renameContentFile(tmp, file);
  const rel = SPECIAL_SLUG_FILE[slug]
    ? joinContentPath(kind, SPECIAL_SLUG_FILE[slug]!)
    : joinContentPath(kind, `${slug}.json`);
  await mirrorPublicContentJson(rel, json);
}
