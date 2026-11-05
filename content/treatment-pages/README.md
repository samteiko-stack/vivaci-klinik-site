# Treatment page content

Single template: `reference/webflow-export/treatment-page.html`  
Runtime hydration: `reference/webflow-export/js/treatment-page.js`  
Preview: `scripts/dev-server.py` → `/problem/{slug}`, `/behandlingar/{slug}`, `/plastikkirurgi/{slug}`

## Pipeline

1. **Pull** production (Railway Next.js HTML → structured JSON):

   ```bash
   scripts/.venv/bin/python scripts/pull-production-content.py
   ```

   Writes `content/from-production/{problems,behandlingar,plastikkirurgi}/*.json`.

2. **Build** template JSON:

   ```bash
   scripts/.venv/bin/python scripts/build-treatment-pages.py
   ```

   Writes `content/treatment-pages/{category}/{slug}.json` and `index.json`.

   **Snabba fakta — Pris:** edit placeholders in `content/treatment-prices.json` (`byPath`), then rebuild. Real Railway amounts override when present.

3. **Preview** with dev server (serves `/content/…` + treatment routes):

   ```bash
   scripts/.venv/bin/python scripts/dev-server.py
   ```

Mapping logic lives in `scripts/treatment_content_lib.py`.  
**Visibility = Railway `rawSectionHeadings` + real body** (no stuffing plastik/konsultation copy into “Tecken & symtom”, no generic Snabba fakta when production has no facts).  
`sync_section_enabled()` re-checks `enabled`; `treatment-page.js` hides all `[data-vivaci-section]` until JSON loads, then shows only sections that pass.  
Per-page matrix: `python3 scripts/audit_treatment_sections.py`.

## New site template (Railway) — section catalog

Production has **four** treatment/problem layouts. The **v2 behandling** layout (condensed, Botox-first) is what the Webflow `treatment-page.html` mirrors.

**v2 on Railway today:** only `/behandlingar/botulinum-toxin` (30 other behandlingar still use **v1 legacy** section ids like `om-behandlingen`, `fore`, `efter`, …).

### Always on vs variable (Railway)

**Shell — on every behandling, problem, and plastikkirurgi URL** (layout tail; not treatment-specific CMS blocks):

| Catalog ID | UI |
|------------|-----|
| `method` | Avancerad diagnostik… / vår metod |
| `faq` | Vanliga frågor *(accordion may be empty on some URLs; section still exists)* |
| `quizCta` | Osäker på vilken behandling… *(v2 Botox; Webflow keeps equivalent mid-page quiz card)* |
| `bottomCta` | Boka din kostnadsfria konsultation |
| `experts` | Möt våra experter |
| `trust` | Därför väljer patienter Vivaci |

**Variable — only when Railway has body/list data** for that treatment:  
`hero`, `facts`, `about`, `suitability`, `benefits`, `howItWorks`, `resultsTimeline`, `treatmentAreas`, `beforeAfterCare`, `beforeAfterGallery`, `related`.

Per-page matrix: `python3 scripts/audit_railway_content_blocks.py`

### v2 slots (top → bottom) — use these names in CMS / audits

| Order | **Catalog ID** | UI (Swedish on site) | Railway `section#id` | In-page nav anchor |
|------:|----------------|----------------------|----------------------|--------------------|
| — | `siteChrome` | Global header / footer | — | — |
| 1 | `hero` | Hero — H1, intro, CTAs, breadcrumb | *(no id)* | — |
| 2 | `facts` | **Behandlingsfakta** (sticky card; label “Behandlingsfakta” in UI) | *(inside hero grid)* | — |
| 3 | `about` | **Om behandlingen** (main “what is it” body) | `about` | `#about` |
| 3a | `suitabilityGood` | **Passar bra för dig som** (list) | *(inside `#about`)* | — |
| 3b | `suitabilityAssessment` | **Kräver individuell bedömning** (list) | *(inside `#about`)* | — |
| 4 | `benefits` | **Fördelar** (card grid) | `benefits` | — |
| 5 | `howItWorks` | **Så fungerar det** (prose + step cards) | `how` | — |
| 5a | `howItWorksSteps` | Step cards under Så fungerar det (konsultation → uppföljning) | *(inside `#how`)* | — |
| 5b | `treatmentAreas` | **Behandlingsområden** (e.g. Pannan, Glabella — h3 cards) | *(inside `#how`)* | — |
| 5c | `resultsTimeline` | **Resultat över tid** (eyebrow + vertical timeline; “Din behandlingsresa” copy) | *(inside `#how`)* | — |
| 6 | `beforeAfterCare` | **Före & eftervård** (tabs: Före / Efter) | `care` | `#care` |
| 7 | `beforeAfterGallery` | **Före & Efter** (photo swiper) | `results` | `#results` |
| 8 | `faq` | **Vanliga frågor** | `faq` | `#faq` |
| 9 | `related` | **Relaterat** | `related` | — |
| 10 | `quizCta` | **Osäker på vilken behandling som passar dig?** | *(no id)* | — |
| 11 | `experts` | **Möt våra experter** | *(no id)* | — |
| 12 | `method` | **Avancerad diagnostik. Personliga behandlingar. Bättre resultat.** (4-step “Vår metod”) | *(no id)* | — |
| 13 | `trust` | **Därför väljer patienter Vivaci** | *(no id)* | — |
| 14 | `bottomCta` | **Boka din kostnadsfria konsultation** | *(no id)* | — |

Sticky jump links on v2 only expose: `#about`, `#care`, `#results`, `#faq` (not benefits / how / related).

### Other Railway layouts (for “what exists on production” per URL)

| Layout | Routes | Primary `section#id` blocks |
|--------|--------|-----------------------------|
| **v1 behandling** | 30× `/behandlingar/*` (not Botox) | `om-behandlingen`, `hur-fungerar`, `fordelar`, `process`, `ratt-for-mig`, `fore`, `efter`, `kansla`, `sessioner`, `problem` + shared tail (experts, trust, FAQ, bottom CTA) |
| **problem** | `/problem/*` | `vad-ar-det`, `tecken`, `orsaker`, `bedomning` + recommended treatments / quiz blocks + shared tail |
| **plastikkirurgi** | `/plastikkirurgi/*` | `om`, `kandidater`, `konsultation`, `steg`, `aterhamtning`, `fore`, `efter`, reviews + shared tail |

When auditing Railway vs v2 catalog IDs, map v1 blocks → v2 slots (e.g. `om-behandlingen` → `about`, `fore`/`efter` → `beforeAfterCare`, `ratt-for-mig` → `suitability*`, `process` → `howItWorksSteps`).

---

## Webflow template section catalog (top → bottom)

Order on `treatment-page.html`. **Hook** = `data-vivaci-section` or nested block/field. **Hydrate** = filled from JSON by `treatment-page.js` today.

### v2 catalog ID → Webflow hook

| Catalog ID | Webflow `data-vivaci-section` / block |
|------------|--------------------------------------|
| `hero` | `hero` |
| `facts` | `facts` |
| `about` | `overview` + block `whatIsIt` |
| `suitabilityGood` / `suitabilityAssessment` | `suitability` |
| `benefits` | `benefits` |
| `howItWorks` | `howItWorks` |
| `howItWorksSteps` | `howItWorks.steps` (list in JSON) |
| `treatmentAreas` | `treatmentAreas` / block `treatmentAreas` |
| `resultsTimeline` | `resultsTimeline` |
| `beforeAfterCare` | `beforeAfterCare` |
| `beforeAfterGallery` | `beforeAfterGallery` |
| `faq` | `faq` |
| `related` | `related` |
| `quizCta` | `quizCta` |
| `experts` | `experts` |
| `method` | `method` |
| `trust` | `trust` |
| `bottomCta` | `bottomCta` |

| # | UI (Swedish / Webflow) | JSON `sections.*` | DOM hook | Hydrate |
|---|------------------------|-------------------|----------|---------|
| — | Global navigation | — | (navbar, shared) | Static export |
| 1 | Hero — title, intro, CTAs | `hero` | `hero` · `hero-title`, `hero-intro` | Yes |
| 2 | **Snabba fakta** (sticky sidebar) | `facts` | `facts` · `facts-title`, `facts-summary`, `facts-list` | Yes |
| 2b | Quiz CTA in sidebar | — | `data-vivaci-quiz-trigger` | Static (opens quiz modal) |
| 3 | Overview header — tagline + “Fakta om …” | `overview` | `overview` · `overview-tagline`, `overview-heading` | Yes |
| 3a | Vad är det? | `overview.blocks.whatIsIt` | `data-vivaci-block="whatIsIt"` · `data-vivaci-block-body` | Yes (+ Visa mer) |
| 3b | Tecken & symtom | `overview.blocks.symptoms` | `symptoms` | Yes |
| 3c | Vanliga behandlingsområden (card grid) | `treatmentAreas` | `treatmentAreas` (inside overview) | Yes |
| 3d | Orsaker | `overview.blocks.causes` | `causes` | Yes |
| 3e | Hur vi bedömer det | `overview.blocks.assessment` | `assessment` | Yes |
| 4 | Passar bra / Kräver bedömning (2 cols) | `suitability` | `suitability` · `good-for-list`, `needs-assessment-list` | Yes — **hidden unless both lists have copy** (Railway: h3 under Om behandlingen; today mainly Botox) |
| 5 | Fördelar (card grid) | `benefits` | `benefits` · `benefits-grid` | Yes |
| 6 | Så fungerar det (text + image) | `howItWorks` | `howItWorks` · `how-heading`, `[data-vivaci-block-body]` | Yes (body only) |
| 7 | Resultat över tid (image + timeline) | `resultsTimeline` | `resultsTimeline` · `timeline-list` | Yes |
| 7b | Före & eftervård (tabs) | `beforeAfterCare` | `beforeAfterCare` · `before-intro`, `before-list`, `after-intro`, `after-list` | Yes — Railway h2 *Före behandling* / *Efter behandling* or combined *Före & eftervård* |
| 7c | Före & Efter (swiper) | `beforeAfterGallery` | `beforeAfterGallery` · `ba-heading`, `ba-intro`, `ba-swiper` | Yes — **`items[]` from** `content/from-production/before-after-gallery.json`; hidden when no items |
| 8 | Vår metod — 4-step timeline | `method` | `method` | **Always on** every treatment page (static HTML) |
| 9 | Möt våra experter | `experts` | `experts` | **Toggle only** — h2 *Möt våra experter* |
| 10 | Därför väljer patienter Vivaci | `trust` | `trust` | **Toggle only** — h2 *Därför väljer patienter Vivaci* |
| 11 | Mid-page quiz CTA | `quizCta` | `quizCta` | **Always on** — quiz button only (no konsultation button on this card) |
| 13 | Vanliga frågor | `faq` | `faq` | Yes — **always enabled**; accordion filled when production has `faqs` |
| 14 | Relaterat (large cards) | `related` | `related` | Yes |
| 15 | Bottom hero CTA — boka konsultation | `bottomCta` | `bottomCta` | **Always on** (default copy + kontakt CTA) |
| — | Footer | — | (footer, shared) | Static export |

### In JSON but not on the template yet

| JSON | Railway source | Notes |
|------|----------------|--------|
| `howItWorks.steps` | h3 under “Så fungerar det” (konsultation → uppföljning) | Rendered as `vivaci-how-list` when steps exist |

### Layout shell

- **`page-shell`**: left `floating-section` (facts) + right **`page-content`** (rows 3–13 stacked).
- Overview blocks share one **`section-content-wrap`**; each block can be hidden via `enabled` on the matching `overview.blocks[]` entry (except `treatmentAreas`, driven by `sections.treatmentAreas`).

## Railway h2 → template section

| Production (h2) | Template `sections.*` | DOM hook |
|-----------------|----------------------|----------|
| (page h1 + first p) | `hero` | `data-vivaci-field="hero-title"`, `hero-intro` |
| Behandlingsfakta sidebar | `facts` | `data-vivaci-section="facts"` |
| Om behandlingen / Vad är denna behandling? / Om ingreppet (body → **Vad är det?**) | `overview.blocks.whatIsIt` | `data-vivaci-block="whatIsIt"` |
| Tecken & symtom | `overview.blocks.symptoms` | `data-vivaci-block="symptoms"` |
| Orsaker | `overview.blocks.causes` | `data-vivaci-block="causes"` |
| Hur vi bedömer det | `overview.blocks.assessment` | `data-vivaci-block="assessment"` |
| Passar bra för dig som | `suitability.goodFor` | `data-vivaci-field="good-for-list"` |
| Kräver individuell bedömning | `suitability.needsAssessment` | `data-vivaci-field="needs-assessment-list"` |
| Fördelar (h3 cards) | `benefits.items` | `data-vivaci-section="benefits"` |
| Så fungerar det (intro) | `howItWorks.body` | `data-vivaci-section="howItWorks"` |
| Resultat över tid / timeline items | `resultsTimeline.items` | `data-vivaci-section="resultsTimeline"` |
| Före & Efter (intro from Railway h2 body when present) | `beforeAfterGallery` | `data-vivaci-section="beforeAfterGallery"` |
| Vanliga behandlingsområden | `treatmentAreas.items` | `data-vivaci-block="treatmentAreas"` |
| Före & eftervård | `beforeAfterCare` | `data-vivaci-section="beforeAfterCare"` |
| Vanliga frågor | `faq.items` | `data-vivaci-section="faq"` |
| Relaterat (children + links) | `related.items` | `data-vivaci-section="related"` |

**Always on** (shell — see table above): `method`, `faq`, `quizCta`, `bottomCta`, `experts`, `trust`.

| Source | `sections.*` | Visibility |
|--------|--------------|------------|
| `before-after-gallery.json` (+ intro from Railway *Före & Efter* when scraped) | `beforeAfterGallery` | `enabled` when `items.length > 0` |

## JSON shape (version 1)

Each file: `version`, `category`, `slug`, `path`, `sourceUrl`, `title`, `sections`.

Every section supports `enabled: boolean`. Text sections use `heading`, `body`, `items[]` with `{ title, body }` or `{ label, value }` for facts.

## Admin / CMS

Edit `content/treatment-pages/…` JSON only; the HTML template stays fixed. Re-run **build** after re-pulling production if you want to refresh from Railway without hand-editing.
