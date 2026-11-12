import "server-only";

import fs from "node:fs";
import path from "node:path";

function hasTreatmentPagesContent(root: string): boolean {
  return fs.existsSync(path.join(root, "content", "treatment-pages"));
}

/** Vivaci monorepo root — resolves regardless of where `next` was started. */
function resolveRepoRoot(): string {
  const fromEnv = process.env.VIVACI_REPO_ROOT?.trim();
  if (fromEnv) {
    return path.resolve(fromEnv);
  }

  const cwd = process.cwd();
  const candidates = [
    cwd,
    path.resolve(cwd, ".."),
    path.resolve(cwd, "content-admin", ".."),
  ];

  for (const root of candidates) {
    if (hasTreatmentPagesContent(root)) {
      return root;
    }
  }

  return path.resolve(cwd, "..");
}

export const REPO_ROOT = resolveRepoRoot();

function resolveTreatmentPagesDir(): string {
  const fromRepo = path.join(REPO_ROOT, "content", "treatment-pages");
  if (fs.existsSync(fromRepo)) {
    return fromRepo;
  }
  // Static bundle from vercel-build (content copied into Next public/).
  const fromPublic = path.join(process.cwd(), "public", "content", "treatment-pages");
  if (fs.existsSync(fromPublic)) {
    return fromPublic;
  }
  return fromRepo;
}

export const TREATMENT_PAGES_DIR = resolveTreatmentPagesDir();
