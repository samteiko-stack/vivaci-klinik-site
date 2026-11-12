import "server-only";

import { REPO_ROOT } from "@/lib/content-path";
import path from "node:path";
import {
  joinContentPath,
  mkdirContentDir,
  writeContentFile,
} from "@/lib/fs-path";

/**
 * After writing under `content/`, mirror the same JSON to every `public/content/`
 * tree the marketing site reads (repo `public/` and Next `public/`).
 */
export async function mirrorPublicContentJson(
  relativeFromContent: string,
  json: string
): Promise<void> {
  const rel = relativeFromContent.replace(/^\/+/, "");
  const targets = [
    joinContentPath(REPO_ROOT, "public", "content", rel),
    joinContentPath(process.cwd(), "public", "content", rel),
  ];
  const seen = new Set<string>();
  for (const target of targets) {
    const key = target;
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      await mkdirContentDir(path.dirname(target));
      await writeContentFile(target, json);
    } catch {
      /* skip missing trees */
    }
  }
}
