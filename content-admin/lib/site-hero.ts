import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "@/lib/content-path";

const DEFAULT_HERO_IMAGE = "/images/Morpheus8_0146.webp";

const HOMEPAGE_COPY_CANDIDATES = [
  path.join(REPO_ROOT, "content", "homepage-copy.json"),
  path.join(REPO_ROOT, "public", "content", "homepage-copy.json"),
] as const;

type HomepageCopy = {
  hero?: {
    image?: string;
  };
};

function readHomepageCopy(): HomepageCopy | null {
  for (const filePath of HOMEPAGE_COPY_CANDIDATES) {
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      return JSON.parse(raw) as HomepageCopy;
    } catch {
      continue;
    }
  }
  return null;
}

/** Web path as used on vivaci.se (`/images/...`). */
export function getHomeHeroImagePath(): string {
  const image = readHomepageCopy()?.hero?.image?.trim();
  if (image && image.startsWith("/")) return image;
  if (image) return `/${image.replace(/^\/+/, "")}`;
  return DEFAULT_HERO_IMAGE;
}

/** Absolute path to the file under repo `public/`. */
export function resolveMarketingPublicFile(webPath: string): string {
  const normalized = webPath.startsWith("/") ? webPath.slice(1) : webPath;
  return path.join(REPO_ROOT, "public", normalized);
}

/** Same hero file via content-admin (no duplicated assets in `public/`). */
export function getHomeHeroImageAdminUrl(): string {
  const webPath = getHomeHeroImagePath();
  const relative = webPath.startsWith("/") ? webPath.slice(1) : webPath;
  return `/api/site-assets/${relative}`;
}
