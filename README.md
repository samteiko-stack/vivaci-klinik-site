# Vivaci — content from Railway

Pulls content from **https://vivaci-klinik-production.up.railway.app/** into `content/from-production/`.

```bash
python3 -m venv scripts/.venv   # once
scripts/.venv/bin/pip install -r scripts/requirements.txt   # once
scripts/.venv/bin/python scripts/pull-production-content.py
scripts/.venv/bin/python scripts/build-nav.py
scripts/.venv/bin/python scripts/build-treatment-pages.py
```

## Local development (site + content admin)

One command, one URL — same origin as Vercel production:

```bash
npm run dev
```

Open **http://localhost:4000/** (home), **/login** (admin), **/treatment-pages** (editor). `/content-admin` in the footer redirects to `/treatment-pages` on the same host.

Legacy Python site-only preview (Railway-style, port 8765):

```bash
npm run dev:legacy
# or: scripts/.venv/bin/python scripts/dev-server.py
```

Missing pages return **`404.html`** (nav + footer, HTTP 404).

## Site server (Railway)

Same Python app serves the site on Railway. Missing pages return **`404.html`** (nav + footer, HTTP 404).

### Content admin (treatment pages)

Edit `content/treatment-pages/…` in the browser at **http://localhost:4000/treatment-pages** (after `npm run dev`). Sign in at **/login** when `VIVACI_ADMIN_PASSWORD` is set in `content-admin/.env.local`.

Legacy Python admin (dev:legacy only): **http://localhost:8765/admin** — Tandfokus `ds-*` UI under `admin/`, not the Next.js editor.

Marketing URLs on the unified dev server match production:

Regenerate the 404 shell after nav/footer template changes:

```bash
scripts/.venv/bin/python scripts/build_404_page.py
```

| URL | Page |
|-----|------|
| `/` | Home |
| `/problem/fine-lines-wrinkles` | Treatment template |
| `/behandlingar/botulinum-toxin` | Treatment template |
| `/plastikkirurgi/liposuction` | Treatment template |
| `/kontakt` | Contact |
| `/prislista` | Price list (`content/prislista.json`) |

Regenerate prices after editing `content/treatment-prices.json`:

```bash
scripts/.venv/bin/python scripts/build-prislista.py
```

Nav dropdowns use `content/from-production/nav.json` (scraped from the live site — 5 mega menus only).

## Content output

| Path | What |
|------|------|
| `manifest.json` | All crawled URLs |
| `problems/*.json` | `/problem/{slug}` (raw scrape) |
| `behandlingar/{slug}.json` | `/behandlingar/{slug}` (raw scrape) |
| `plastikkirurgi/{slug}.json` | `/plastikkirurgi/{slug}` (raw scrape) |
| `../treatment-pages/{category}/{slug}.json` | Normalized template content + section flags |
| `behandlingar.json` | Procedures (legacy index) |
| `plastikkirurgi.json` | Surgery (legacy index) |
| `nav.json` | Mega menus (labels/hrefs from production + `description` from `nav-descriptions.json`) |
| `nav-descriptions.json` | Short Swedish subcopy under each mega-menu link |

`reference/webflow-export/` is the HTML/CSS shell only — not part of public URLs.
