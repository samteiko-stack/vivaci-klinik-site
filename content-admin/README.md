# Vivaci content admin

Vivaci's treatment-page editor, built with Next.js, Tailwind CSS and shadcn/ui.
The application shell, navigation, forms, dialogs and feedback components all use
the local shadcn component registry. DM Sans and the monochrome admin palette are
mapped to shadcn's semantic theme tokens in `app/shadcn-admin.css`.

This is a separate app inside the Vivaci repo. It does not use external CRM APIs.

## Run

From the **repo root** (recommended — site + admin on one port):

```bash
npm run dev
```

Open **http://localhost:4000/** — home, **/login** — admin sign-in, **/treatment-pages** — editor.
The footer link **/content-admin** redirects to **/treatment-pages** on the same host.

Or from this directory (runs `sync:public` via `predev`, then Next on port 4000):

```bash
npm install && npm run dev
```

## Vercel (single project)

Marketing static HTML and this admin app deploy together. See [../docs/VERCEL.md](../docs/VERCEL.md) for Root Directory, env vars, and persistence limits.

## Authentication

Copy `.env.example` to `.env.local` and set a strong password and session secret
(at least 32 characters) before deployment. Sign-in is password-only; the editor
and its content APIs require a signed admin session. Logging out clears the
HTTP-only session cookie.

## Data

Writes only to `../content/treatment-pages/{category}/{slug}.json` (Vivaci repo).
