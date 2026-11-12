import "server-only";

import path from "node:path";
import { REPO_ROOT } from "@/lib/content-path";
import {
  accessContentPath,
  joinContentPath,
  readContentFile,
  renameContentFile,
  writeContentFile,
} from "@/lib/fs-path";

type TreatmentImagesCatalog = {
  byHref?: Record<string, string>;
  [key: string]: unknown;
};

function catalogCandidates(): string[] {
  return [
    joinContentPath(REPO_ROOT, "content/from-production/treatment-images.json"),
    joinContentPath(process.cwd(), "public/content/from-production/treatment-images.json"),
  ];
}

async function resolveCatalogPath(): Promise<string> {
  for (const candidate of catalogCandidates()) {
    try {
      await accessContentPath(candidate);
      return candidate;
    } catch {
      continue;
    }
  }
  return catalogCandidates()[0]!;
}

function publicMirrorPath(sourcePath: string): string | null {
  if (sourcePath.includes(`${path.sep}content${path.sep}from-production${path.sep}`)) {
    return joinContentPath(REPO_ROOT, "public/content/from-production/treatment-images.json");
  }
  if (sourcePath.includes(`${path.sep}public${path.sep}content${path.sep}`)) {
    return joinContentPath(REPO_ROOT, "content/from-production/treatment-images.json");
  }
  return null;
}

async function writeCatalog(filePath: string, data: TreatmentImagesCatalog): Promise<void> {
  const json = `${JSON.stringify(data, null, 2)}\n`;
  const tmp = `${filePath}.tmp`;
  await writeContentFile(tmp, json);
  await renameContentFile(tmp, filePath);

  const mirror = publicMirrorPath(filePath);
  if (mirror) {
    const mirrorTmp = `${mirror}.tmp`;
    await writeContentFile(mirrorTmp, json);
    await renameContentFile(mirrorTmp, mirror);
  }
}

export async function readTreatmentImagesCatalog(): Promise<TreatmentImagesCatalog> {
  const filePath = await resolveCatalogPath();
  const raw = await readContentFile(filePath);
  return JSON.parse(raw) as TreatmentImagesCatalog;
}

export async function getHeroImageForHref(href: string): Promise<string> {
  const catalog = await readTreatmentImagesCatalog();
  const key = href.trim();
  return catalog.byHref?.[key] ?? "";
}

export async function setHeroImageForHref(href: string, imagePath: string): Promise<void> {
  const filePath = await resolveCatalogPath();
  const raw = await readContentFile(filePath);
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
