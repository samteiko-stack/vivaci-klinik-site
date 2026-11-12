import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import createNextIntlPlugin from "next-intl/plugin";
import { vivaciSiteBeforeFileRewrites } from "./lib/vivaci-site-rewrites";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const contentAdminRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(contentAdminRoot, "..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: repoRoot,
  outputFileTracingIncludes: {
    "/api/treatment-pages": ["./content/treatment-pages/**/*"],
    "/api/treatment-pages/[category]/[slug]": ["./content/treatment-pages/**/*"],
    "/(editor)/treatment-pages": ["./content/treatment-pages/**/*"],
    "/api/utbildning": ["./content/utbildning/**/*"],
    "/api/utbildning/[slug]": ["./content/utbildning/**/*"],
    "/api/nyheter": ["./content/nyheter/**/*"],
    "/api/nyheter/[slug]": ["./content/nyheter/**/*"],
  },
  async redirects() {
    return [
      {
        source: "/content-admin",
        destination: "/treatment-pages",
        permanent: false,
      },
      {
        source: "/content-admin/",
        destination: "/treatment-pages",
        permanent: false,
      },
      {
        source: "/en/content-admin",
        destination: "/treatment-pages",
        permanent: false,
      },
      {
        source: "/en/content-admin/",
        destination: "/treatment-pages",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: vivaciSiteBeforeFileRewrites,
    };
  },
};

export default withNextIntl(nextConfig);
