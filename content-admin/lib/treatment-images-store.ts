import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { REPO_ROOT } from "@/lib/content-path";

type TreatmentImagesCatalog = {
  byHref?: Record<string, string>;
  [key: string]: unknown;
};

function catalogCandidates(): string[] {
  return [
    path.join(REPO_ROOT, "content/from-production/treatment-images.json"),
    path.join(process.cwd(), "public/content/from-production/treatment-images.json"),
  ];
}

async function resolveCatalogPath(): Promise<string> {
  for (const candidate of catalogCandidates()) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }
  return catalogCandidates()[0];
}

function publicMirrorPath(sourcePath: string): string | null {
  if (sourcePath.includes(`${path.sep}content${path.sep}from-production${path.sep}`)) {
    return path.join(REPO_ROOT, "public/content/from-production/treatment-images.json");
  }
  if (sourcePath.includes(`${path.sep}public${path.sep}content${path.sep}`)) {
    return path.join(REPO_ROOT, "content/from-production/treatment-images.json");
  }
  return null;
}

async function writeCatalog(filePath: string, data: TreatmentImagesCatalog): Promise<void> {
  const json = `${JSON.stringify(data, null, 2)}\n`;
  const tmp = `${filePath}.tmp`;
  await fs.writeFile(tmp, json, "utf8");
  await fs.rename(tmp, filePath);

  const mirror = publicMirrorPath(filePath);
  if (mirror) {
    const mirrorTmp = `${mirror}.tmp`;
    await fs.writeFile(mirrorTmp, json, "utf8");
    await fs.rename(mirrorTmp, mirror);
  }
}

export async function readTreatmentImagesCatalog(): Promise<TreatmentImagesCatalog> {
  const filePath = await resolveCatalogPath();
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as TreatmentImagesCatalog;
}

export async function getHeroImageForHref(href: string): Promise<string> {
  const catalog = await readTreatmentImagesCatalog();
  const key = href.trim();
  return catalog.byHref?.[key] ?? "";
}

export async function setHeroImageForHref(href: string, imagePath: string): Promise<void> {
  const filePath = await resolveCatalogPath();
  const raw = await fs.readFile(filePath, "utf8");
  const catalog = JSON.parse(raw) as TreatmentImagesCatalog;
  const byHref = { ...(catalog.byHref ?? {}) };
  const key = href.trim();
  const value = imagePath.trim();
  if (value) {
    byHref[key] = value;
  } else {
    delete byHref[key];
  }
  catalog.byHref = byHref;
  await writeCatalog(filePath, catalog);
}
