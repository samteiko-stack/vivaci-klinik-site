import "server-only";

import {
  contentPathExists,
  joinContentPath,
  resolveContentPath,
} from "./fs-path";

function hasRepoContentTree(root: string): boolean {
  return (
    contentPathExists(joinContentPath(root, "content", "treatment-pages")) ||
    contentPathExists(joinContentPath(root, "public", "content", "treatment-pages")) ||
    contentPathExists(joinContentPath(root, "content", "utbildning")) ||
    contentPathExists(joinContentPath(root, "public", "content", "utbildning"))
  );
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
    if (hasRepoContentTree(root)) {
      return root;
    }
  }

  return resolveContentPath(cwd, "..");
}

export const REPO_ROOT = resolveRepoRoot();

/**
 * Resolve a directory under `content/` (editable JSON).
 * On Vercel the project root is `content-admin` only — parent `content/` is not deployed,
 * so we fall back to `content-admin/content/` (build copy) or `public/content/` (site mirror).
 */
export function resolveContentSubdir(...segments: string[]): string {
  const cwd = process.cwd();
  const candidates = [
    joinContentPath(REPO_ROOT, "content", ...segments),
    joinContentPath(cwd, "content", ...segments),
    joinContentPath(cwd, "public", "content", ...segments),
    joinContentPath(REPO_ROOT, "public", "content", ...segments),
  ];

  for (const dir of candidates) {
    if (contentPathExists(dir)) {
      return dir;
    }
  }

  return joinContentPath(REPO_ROOT, "content", ...segments);
}

function resolveTreatmentPagesDir(): string {
  return resolveContentSubdir("treatment-pages");
}

export const TREATMENT_PAGES_DIR = resolveTreatmentPagesDir();
