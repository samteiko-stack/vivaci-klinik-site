import "server-only";

import {
  contentPathExists,
  joinContentPath,
  resolveContentPath,
} from "./fs-path";

function hasTreatmentPagesContent(root: string): boolean {
  return contentPathExists(joinContentPath(root, "content", "treatment-pages"));
}

/** Vivaci monorepo root — resolves regardless of where `next` was started. */
function resolveRepoRoot(): string {
  const fromEnv = process.env.VIVACI_REPO_ROOT?.trim();
  if (fromEnv) {
    return resolveContentPath(fromEnv);
  }

  const cwd = process.cwd();
  const candidates = [
    cwd,
    resolveContentPath(cwd, ".."),
    resolveContentPath(cwd, "content-admin", ".."),
  ];

  for (const root of candidates) {
    if (hasTreatmentPagesContent(root)) {
      return root;
    }
  }

  return resolveContentPath(cwd, "..");
}

export const REPO_ROOT = resolveRepoRoot();

function resolveTreatmentPagesDir(): string {
  const fromRepo = joinContentPath(REPO_ROOT, "content", "treatment-pages");
  if (contentPathExists(fromRepo)) {
    return fromRepo;
  }
  // Static bundle from vercel-build (content copied into Next public/).
  const fromPublic = joinContentPath(
    process.cwd(),
    "public",
    "content",
    "treatment-pages"
  );
  if (contentPathExists(fromPublic)) {
    return fromPublic;
  }
  return fromRepo;
}

export const TREATMENT_PAGES_DIR = resolveTreatmentPagesDir();
