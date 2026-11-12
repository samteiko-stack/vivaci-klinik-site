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

export type SimpleContentMeta = {
  slug: string;
  title: string;
  path: string;
};

function contentDir(kind: "utbildning" | "nyheter"): string {
  return resolveContentSubdir(kind);
}

function fileFor(kind: "utbildning" | "nyheter", slug: string): string {
  if (!SLUG_RE.test(slug)) throw new Error("Invalid slug");
  const file = joinContentPath(contentDir(kind), `${slug}.json`);
  const resolved = resolveContentPath(file);
  if (!resolved.startsWith(resolveContentPath(contentDir(kind)))) {
    throw new Error("Invalid path");
  }
  return resolved;
}

function pathForMeta(kind: "utbildning" | "nyheter", slug: string, data: Record<string, unknown>): string {
  if (typeof data.path === "string" && data.path.startsWith("/")) return data.path;
  if (kind === "utbildning") return `/utbildning/${slug}`;
  return `/nyheter/${slug}`;
}

export async function listSimpleContent(
  kind: "utbildning" | "nyheter"
): Promise<SimpleContentMeta[]> {
  const dir = contentDir(kind);
  let files: string[];
  try {
    files = await fs.readdir(dir);
  } catch {
    return [];
  }
  const pages: SimpleContentMeta[] = [];
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
    });
  }
  pages.sort((a, b) => a.title.localeCompare(b.title, "sv"));
  return pages;
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
  await mirrorPublicContentJson(joinContentPath(kind, `${slug}.json`), json);
}
