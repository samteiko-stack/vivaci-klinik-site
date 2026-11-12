# Vivaci — single Vercel project (marketing + content admin)

One GitHub repo and one Vercel project serves the static Vivaci site and the Next.js content admin on the same domain.

## Vercel project settings

| Setting | Value |
|--------|--------|
| **Root Directory** | `content-admin` |
| **Framework Preset** | Next.js (auto) |
| **Build / Install** | Leave default — `content-admin/vercel.json` overrides |

If the root directory is still the repo root, use root `vercel.json` instead (same build, `framework: nextjs`).

## Environment variables

Set these on the Vercel project (Production and Preview as needed):

| Variable | Required | Purpose |
|----------|----------|---------|
| `VIVACI_ADMIN_PASSWORD` | Yes | Admin sign-in password |
| `VIVACI_ADMIN_SESSION_SECRET` | Yes | Session cookie signing (≥ 32 random characters) |
| `VIVACI_REPO_ROOT` | Usually no | Absolute repo root if content cannot be resolved automatically |
| `VIVACI_TRANSLATE_EN` | No | Set to `1` to run live EN translation during build |

Optional local-only (legacy Python dev server):

| Variable | Purpose |
|----------|---------|
| `CONTENT_ADMIN_ORIGIN` | Default `same-origin` — `/content-admin` → `/treatment-pages` on the same host (`scripts/dev-server.py`) |

On production, `/content-admin` redirects to `/treatment-pages` on the same host (Next `redirects` in `next.config.ts`).

## Build flow

1. `scripts/vercel-build.py` pre-renders HTML into `content-admin/public/` (`VIVACI_PUBLIC_DIR`).
2. `next build` in `content-admin` deploys admin routes and serves static files from `public/`.
3. Marketing pretty URLs are handled by `beforeFiles` rewrites in `next.config.ts` (same rules as the old root `vercel.json`).

## URLs after deploy

Replace `https://your-domain.vercel.app` with your production domain:

| Path | What |
|------|------|
| `/` | Marketing home (static) |
| `/login` | Admin sign-in |
| `/treatment-pages` | Treatment page editor |
| `/api/treatment-pages/*` | Admin JSON API |
| `/content-admin` | Redirect → `/treatment-pages` |

## JSON persistence on Vercel (important)

The admin writes treatment JSON with the local filesystem (`content/treatment-pages/` in git locally, or `public/content/treatment-pages` from the static build bundle). **Serverless functions use ephemeral disk**: saves from production do **not** commit to GitHub and may not survive cold starts or redeploys.

For durable production editing you need a follow-up (e.g. GitHub Contents API commit-on-save, Vercel Blob, or a hosted DB). Local dev and a long-lived server (Railway, etc.) behave like normal git-tracked files.

## Local development

One command, one URL (matches production: marketing + admin on the same origin):

```bash
npm run dev                            # http://localhost:4000
```

This bundles CSS, syncs marketing static into `content-admin/public/`, then starts Next.js. Try `/`, `/login`, `/treatment-pages`, and `/content-admin`.

Legacy Python site-only server (optional):

```bash
npm run dev:legacy                     # http://localhost:8765 — no Next admin UI
```

## Deploy

```bash
# From repo root (requires Vercel CLI linked to this project)
vercel --prod
```

Or push to the connected Git branch; Vercel runs the combined build automatically.
