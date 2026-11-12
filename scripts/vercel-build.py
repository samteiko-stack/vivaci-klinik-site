#!/usr/bin/env python3
"""Pre-render Vivaci HTML for Vercel static hosting (same output as dev-server).

Before deploy, ensure English locale files exist:
  python3 scripts/build_en_locale.py
  python3 scripts/sync_en_content.py          # uses deep-translator (offline: use --skip-translate after a full sync)

This build always runs both with --skip-translate unless VIVACI_TRANSLATE_EN=1.
"""

from __future__ import annotations

import importlib.util
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
EXPORT = ROOT / "reference" / "webflow-export"


def _public_dir() -> Path:
    override = os.environ.get("VIVACI_PUBLIC_DIR", "").strip()
    if override:
        p = Path(override)
        return p if p.is_absolute() else ROOT / p
    return ROOT / "public"


def prebuild_html_sources() -> None:
    """Generate listing + article HTML in the export tree before static wrap."""
    from build_nyheter_listing import build as build_nyheter_listing
    from hydrate_blog_post import build_all as build_blog_posts

    build_nyheter_listing()
    build_blog_posts(EXPORT / "nyheter", EXPORT / "blog-page.html")


def sync_en_locale_for_deploy() -> None:
    """Refresh content/locales/en from cache; optional live translation on CI."""
    if os.environ.get("VIVACI_SKIP_LOCALE_SYNC", "").strip().lower() in ("1", "true", "yes"):
        print("Skipping locale sync (VIVACI_SKIP_LOCALE_SYNC)")
        return
    translate = os.environ.get("VIVACI_TRANSLATE_EN", "").strip().lower() in ("1", "true", "yes")
    cmd = [sys.executable, str(SCRIPTS / "sync_en_content.py")]
    if not translate:
        cmd.append("--skip-translate")
    print("Locale sync:", " ".join(cmd))
    subprocess.run(cmd, check=True, cwd=ROOT)

_spec = importlib.util.spec_from_file_location("vivaci_dev_server", SCRIPTS / "dev-server.py")
_mod = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
sys.path.insert(0, str(SCRIPTS))
_spec.loader.exec_module(_mod)
build_get_response = _mod.build_get_response


def main() -> None:
    public_dir = _public_dir()
    prebuild_html_sources()
    sync_en_locale_for_deploy()

    if public_dir.exists():
        shutil.rmtree(public_dir)
    public_dir.mkdir(parents=True)

    for item in EXPORT.rglob("*"):
        if not item.is_file():
            continue
        rel = item.relative_to(EXPORT)
        if item.suffix.lower() in {".html", ".htm"}:
            continue
        dest = public_dir / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(item, dest)

    shutil.copytree(ROOT / "content", public_dir / "content", dirs_exist_ok=True)

    # Vercel Root Directory is `content-admin`; API routes need `content/` on disk there too.
    admin_content = ROOT / "content-admin" / "content"
    if admin_content.exists():
        shutil.rmtree(admin_content)
    shutil.copytree(ROOT / "content", admin_content)

    for html in EXPORT.rglob("*.html"):
        rel = html.relative_to(EXPORT).as_posix()
        if rel == "index.html":
            req_path = "/"
        else:
            req_path = "/" + rel.removesuffix(".html")
        _status, _headers, body = build_get_response(req_path)
        out = public_dir / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(body)

    # Pretty-url aliases (e.g. /blogg → nyheter.html) need their own static file on Vercel.
    html_routes: dict[str, str] = _mod.HTML_ROUTES
    for route, target_html in html_routes.items():
        if route in {"/"} or route.count("/") > 1:
            continue
        alias_name = f"{route.lstrip('/')}.html"
        if alias_name == target_html:
            continue
        status, _headers, body = build_get_response(route)
        if status != 200:
            print(f"skip alias {route} → {alias_name} (HTTP {status})")
            continue
        alias_out = public_dir / alias_name
        alias_out.parent.mkdir(parents=True, exist_ok=True)
        alias_out.write_bytes(body)

    print(f"Wrote static site to {public_dir}")


if __name__ == "__main__":
    main()
