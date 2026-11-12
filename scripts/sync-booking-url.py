#!/usr/bin/env python3
"""Point booking/konsultation CTAs at content/site-urls.json → bookingUrl."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE_URLS = ROOT / "content" / "site-urls.json"
BOOKING = json.loads(SITE_URLS.read_text(encoding="utf-8"))["bookingUrl"]

BOOKING_VIVACI_FIELDS = frozenset(
    {
        "hero-primary-cta",
        "hero-secondary-cta",
        "hero-cta-primary",
        "bottom-cta-primary",
    }
)

BOOKING_LABEL_RE = re.compile(
    r"\b(boka|book)(\s+|\b)",
    re.IGNORECASE,
)


def mirror_site_urls() -> None:
    dst = ROOT / "public" / "content" / "site-urls.json"
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(SITE_URLS.read_text(encoding="utf-8"), encoding="utf-8")


def patch_treatment_json(path: Path) -> bool:
    raw = path.read_text(encoding="utf-8")
    if '"/kontakt"' not in raw:
        return False
    updated = raw.replace('"href": "/kontakt"', f'"href": "{BOOKING}"')
    if updated == raw:
        return False
    path.write_text(updated, encoding="utf-8")
    return True


def patch_homepage_copy(path: Path) -> bool:
    data = json.loads(path.read_text(encoding="utf-8"))
    changed = False
    hero = data.get("hero") or {}
    pc = hero.get("primaryCta") or {}
    label = (pc.get("label") or "").lower()
    if pc.get("href") == "/kontakt" and BOOKING_LABEL_RE.search(label):
        pc["href"] = BOOKING
        hero["primaryCta"] = pc
        data["hero"] = hero
        changed = True
    if changed:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return changed


def patch_quiz_locale(path: Path) -> bool:
    data = json.loads(path.read_text(encoding="utf-8"))
    ui = data.get("ui") or data
    if ui.get("consultHref") == "/kontakt":
        ui["consultHref"] = BOOKING
        if "ui" in data:
            data["ui"] = ui
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        return True
    return False


def patch_html(path: Path) -> bool:
    html = path.read_text(encoding="utf-8")
    original = html

    for field in BOOKING_VIVACI_FIELDS:
        html = re.sub(
            rf'href="/kontakt"([^>]*\bdata-vivaci-field="{field}")',
            rf'href="{BOOKING}"\1',
            html,
            flags=re.IGNORECASE,
        )
        html = re.sub(
            rf'(data-vivaci-field="{field}"[^>]*?)href="/kontakt"',
            rf'\1href="{BOOKING}"',
            html,
            flags=re.IGNORECASE,
        )

    def booking_band_button(m: re.Match[str]) -> str:
        return m.group(1) + f'href="{BOOKING}"'

    html = re.sub(
        r'(<h1[^>]*>\s*Boka din kostnadsfria konsultation\s*</h1>[\s\S]*?)href="/kontakt"',
        booking_band_button,
        html,
        count=1,
        flags=re.IGNORECASE,
    )

    anchor_re = re.compile(
        r"<a\s+([^>]*?)href=[\"']/kontakt[\"']([^>]*?)>(.*?)</a>",
        re.IGNORECASE | re.DOTALL,
    )

    def repl_anchor(m: re.Match[str]) -> str:
        before, after, inner = m.group(1), m.group(2), m.group(3)
        attrs = before + after
        if "navbar" in attrs or "dropdown-link" in attrs:
            return m.group(0)
        if "course-bottom-contact" in attrs or "vivaci-academy-hero-cta" in attrs:
            return m.group(0)
        if "Anmäl intresse" in inner:
            return m.group(0)
        if BOOKING_LABEL_RE.search(inner) or BOOKING_LABEL_RE.search(attrs):
            return f"<a {before}href=\"{BOOKING}\"{after}>{inner}</a>"
        if "is-icon is-alternate is-secondary" in attrs and "Boka din kostnadsfria" in html:
            # Bottom band primary (often labeled Kontakta oss).
            return f"<a {before}href=\"{BOOKING}\"{after}>{inner}</a>"
        return m.group(0)

    html = anchor_re.sub(repl_anchor, html)

    if html != original:
        path.write_text(html, encoding="utf-8")
        return True
    return False


def patch_js_fallbacks(path: Path) -> bool:
    raw = path.read_text(encoding="utf-8")
    if 'href: "/kontakt"' not in raw and '|| "/kontakt"' not in raw:
        return False
    updated = raw
    if "DEFAULT_BOOKING_CTAS" in raw or "data-cta-primary-href" in raw:
        updated = updated.replace('href: "/kontakt"', f'href: "{BOOKING}"')
        updated = updated.replace('|| "/kontakt"', f'|| "{BOOKING}"')
    if updated == raw:
        return False
    path.write_text(updated, encoding="utf-8")
    return True


def main() -> int:
    changed: list[str] = []
    mirror_site_urls()
    changed.append(str(SITE_URLS.relative_to(ROOT)))
    changed.append("public/content/site-urls.json")

    for base in (ROOT / "content" / "treatment-pages", ROOT / "public" / "content" / "treatment-pages"):
        if not base.is_dir():
            continue
        for path in sorted(base.rglob("*.json")):
            if patch_treatment_json(path):
                changed.append(str(path.relative_to(ROOT)))

    for rel in (
        "content/homepage-copy.json",
        "public/content/homepage-copy.json",
        "content/locales/en/homepage-copy.json",
        "public/content/locales/en/homepage-copy.json",
    ):
        p = ROOT / rel
        if p.is_file() and patch_homepage_copy(p):
            changed.append(rel)

    for base in (
        ROOT / "content" / "quiz" / "locales",
        ROOT / "public" / "content" / "quiz" / "locales",
        ROOT / "content" / "locales" / "en" / "quiz" / "locales",
        ROOT / "public" / "content" / "locales" / "en" / "quiz" / "locales",
    ):
        if not base.is_dir():
            continue
        for path in sorted(base.glob("*.json")):
            if patch_quiz_locale(path):
                changed.append(str(path.relative_to(ROOT)))

    html_roots = [ROOT / "public", ROOT / "reference" / "webflow-export"]
    for root in html_roots:
        if not root.is_dir():
            continue
        for path in sorted(root.rglob("*.html")):
            if patch_html(path):
                changed.append(str(path.relative_to(ROOT)))

    js_files = [
        ROOT / "public" / "js" / "treatment-page.js",
        ROOT / "reference" / "webflow-export" / "js" / "treatment-page.js",
        ROOT / "public" / "js" / "treatment-finder.js",
        ROOT / "reference" / "webflow-export" / "js" / "treatment-finder.js",
    ]
    for path in js_files:
        if path.is_file() and patch_js_fallbacks(path):
            changed.append(str(path.relative_to(ROOT)))

    # treatment_content_lib.py constants
    lib = ROOT / "scripts" / "treatment_content_lib.py"
    if lib.is_file():
        raw = lib.read_text(encoding="utf-8")
        if 'BOOKING_URL = "' not in raw:
            raw = raw.replace(
                'DEFAULT_HERO_CTAS = {',
                f'BOOKING_URL = "{BOOKING}"\n\nDEFAULT_HERO_CTAS = {{',
            )
        raw = re.sub(
            r'"href":\s*"/kontakt"',
            f'"href": "{BOOKING}"',
            raw,
        )
        lib.write_text(raw, encoding="utf-8")
        changed.append("scripts/treatment_content_lib.py")

    build_en = ROOT / "scripts" / "build_en_locale.py"
    if build_en.is_file():
        raw = build_en.read_text(encoding="utf-8")
        new = raw.replace('"href": "/kontakt"', f'"href": "{BOOKING}"')
        if new != raw:
            build_en.write_text(new, encoding="utf-8")
            changed.append("scripts/build_en_locale.py")

    partial = ROOT / "reference" / "webflow-export" / "partials" / "vivaci-bottom-cta.html"
    if partial.is_file() and patch_html(partial):
        changed.append(str(partial.relative_to(ROOT)))

    print(f"Updated {len(set(changed))} paths")
    for p in sorted(set(changed)):
        print(p)
    return 0


if __name__ == "__main__":
    sys.exit(main())
