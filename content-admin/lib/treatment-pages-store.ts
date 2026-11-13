import fs from "node:fs/promises";
import { TREATMENT_PAGES_DIR } from "./content-path";
import {
  accessContentPath,
  joinContentPath,
  readContentFile,
  renameContentFile,
  resolveContentPath,
  writeContentFile,
} from "./fs-path";
import { mirrorPublicContentJson } from "./content-mirror";
import {
  ensureAllSections,
  validateTreatmentPageBody,
  type TreatmentPageDoc,
} from "./treatment-page-schema";
import { scaffoldTreatmentPage } from "./content-scaffolds";

import { TREATMENT_PAGE_CATEGORIES } from "./treatment-page-categories";

const CATEGORIES = TREATMENT_PAGE_CATEGORIES;

export { TREATMENT_PAGE_CATEGORIES };
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
    const dir = joinContentPath(TREATMENT_PAGES_DIR, category);
    let files: string[];
    try {
      files = await fs.readdir(dir);
    } catch {
      continue;
    }
    for (const file of files.filter((f) => f.endsWith(".json"))) {
      const slug = file.replace(/\.json$/, "");
      const raw = await readContentFile(joinContentPath(dir, file));
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
  const file = joinContentPath(TREATMENT_PAGES_DIR, category, `${slug}.json`);
  const resolved = resolveContentPath(file);
  if (!resolved.startsWith(resolveContentPath(TREATMENT_PAGES_DIR))) throw new Error("Invalid path");
  return resolved;
}

export async function readTreatmentPage(category: string, slug: string) {
  const file = pagePath(category, slug);
  const raw = await readContentFile(file);
  return JSON.parse(raw);
}

export async function treatmentPageExists(
  category: string,
  slug: string
): Promise<boolean> {
  try {
    const file = pagePath(category, slug);
    await accessContentPath(file);
    return true;
  } catch {
    return false;
  }
}

export async function createTreatmentPage(
  category: string,
  slug: string,
  title: string
) {
  if (await treatmentPageExists(category, slug)) {
    throw new Error("Page already exists");
  }
  const doc = scaffoldTreatmentPage(category, slug, title);
  const normalized = ensureAllSections(doc) as TreatmentPageDoc;
  await writeTreatmentPage(category, slug, normalized);
}

export async function writeTreatmentPage(category: string, slug: string, data: unknown) {
  validateTreatmentPageBody(data, category, slug);
  const body = data as Record<string, unknown>;
  const file = pagePath(category, slug);
  const json = `${JSON.stringify(body, null, 2)}\n`;
  const tmp = `${file}.tmp`;
  await writeContentFile(tmp, json);
  await renameContentFile(tmp, file);
  await mirrorPublicContentJson(
    joinContentPath("treatment-pages", category, `${slug}.json`),
    json
  );
}
