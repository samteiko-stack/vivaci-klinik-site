import fs from "node:fs/promises";
import path from "node:path";
import { TREATMENT_PAGES_DIR } from "./content-path";
import { validateTreatmentPageBody } from "./treatment-page-schema";

const CATEGORIES = ["behandlingar", "problem", "plastikkirurgi"] as const;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type TreatmentPageMeta = {
  category: string;
  slug: string;
  title: string;
  path: string;
};

export async function listTreatmentPages(): Promise<TreatmentPageMeta[]> {
  const pages: TreatmentPageMeta[] = [];
  for (const category of CATEGORIES) {
    const dir = path.join(TREATMENT_PAGES_DIR, category);
    let files: string[];
    try {
      files = await fs.readdir(dir);
    } catch {
      continue;
    }
    for (const file of files.filter((f) => f.endsWith(".json"))) {
      const slug = file.replace(/\.json$/, "");
      const raw = await fs.readFile(path.join(dir, file), "utf8");
      const data = JSON.parse(raw) as { title?: string; path?: string };
      pages.push({
        category,
        slug,
        title: data.title ?? slug,
        path: data.path ?? `/${category}/${slug}`,
      });
    }
  }
  pages.sort((a, b) => a.title.localeCompare(b.title, "sv"));
  return pages;
}

function pagePath(category: string, slug: string) {
  if (!(CATEGORIES as readonly string[]).includes(category)) throw new Error("Invalid category");
  if (!SLUG_RE.test(slug)) throw new Error("Invalid slug");
  const file = path.join(TREATMENT_PAGES_DIR, category, `${slug}.json`);
  const resolved = path.resolve(file);
  if (!resolved.startsWith(path.resolve(TREATMENT_PAGES_DIR))) throw new Error("Invalid path");
  return resolved;
}

export async function readTreatmentPage(category: string, slug: string) {
  const file = pagePath(category, slug);
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw);
}

export async function writeTreatmentPage(category: string, slug: string, data: unknown) {
  validateTreatmentPageBody(data, category, slug);
  const body = data as Record<string, unknown>;
  const file = pagePath(category, slug);
  const json = `${JSON.stringify(body, null, 2)}\n`;
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, json, "utf8");
  await fs.rename(tmp, file);
}
