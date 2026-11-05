#!/usr/bin/env python3
"""Align footer Kontakt icons: map-pin, phone, mail (Lucide). Restore phone row if missing."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPORT = ROOT / "reference/webflow-export"

PHONE_HREF = "tel:+46850927508"
PHONE_LABEL = "08-509 275 08"
MAIL_HREF = "mailto:info@vivaci.se"
MAIL_LABEL = "info@vivaci.se"
ADDR_HREF = (
    "https://www.google.com/maps/search/?api=1&query="
    "Solna%20Torg%203%2C%20Plan%202%2C%20171%2045%20Solna"
)
ADDR_LABEL = "Solna Centrum, Torg 3,<br>171 45 Solna"


def lucide(name: str, inner: str) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewbox="0 0 24 24" '
        f'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
        f'stroke-linejoin="round" class="lucide lucide-{name}" preserveaspectratio="xMidYMid meet" '
        f'aria-hidden="true" role="img">{inner}</svg>'
    )


ICONS = {
    "map-pin": lucide(
        "map-pin",
        '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>'
        '<circle cx="12" cy="10" r="3"/>',
    ),
    "phone": lucide(
        "phone",
        '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    ),
    "mail": lucide(
        "mail",
        '<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/>',
    ),
}

CONTACT_WRAP = re.compile(
    r'(<div class="footer-links-wrap">)(.*?)(</div>\s*</div>\s*</div>\s*</div>\s*<div class="faq1_accordion")',
    re.DOTALL | re.IGNORECASE,
)

KONTakt_BLOCK = re.compile(
    r'(<div class="text-size-regular text-weight-bold">Kontakt</div>.*?<div class="footer-links-wrap">)'
    r".*?"
    r'(</div>\s*</div>\s*</div>\s*</div>\s*<div class="faq1_accordion")',
    re.DOTALL | re.IGNORECASE,
)


def contact_rows_html(indent: str = "") -> str:
    i = indent
    return (
        f'{i}<div class="footer-left-link-wrap">\n'
        f'{i}  <div class="icon-embed-xsmall w-embed">{ICONS["map-pin"]}</div>\n'
        f'{i}  <a href="{ADDR_HREF}" class="footer5_link">{ADDR_LABEL}</a>\n'
        f"{i}</div>\n"
        f'{i}<div class="footer-left-link-wrap is-center">\n'
        f'{i}  <div class="icon-embed-xsmall w-embed">{ICONS["phone"]}</div>\n'
        f'{i}  <a href="{PHONE_HREF}" class="footer5_link">{PHONE_LABEL}</a>\n'
        f"{i}</div>\n"
        f'{i}<div class="footer-left-link-wrap is-center">\n'
        f'{i}  <div class="icon-embed-xsmall w-embed">{ICONS["mail"]}</div>\n'
        f'{i}  <a href="{MAIL_HREF}" class="footer5_link">{MAIL_LABEL}</a>\n'
        f"{i}</div>"
    )


def contact_rows_html_compact() -> str:
    return (
        f'<div class="footer-left-link-wrap">'
        f'<div class="icon-embed-xsmall w-embed">{ICONS["map-pin"]}</div>'
        f'<a class="footer5_link" href="{ADDR_HREF}">{ADDR_LABEL}</a>'
        f"</div>"
        f'<div class="footer-left-link-wrap is-center">'
        f'<div class="icon-embed-xsmall w-embed">{ICONS["phone"]}</div>'
        f'<a class="footer5_link" href="{PHONE_HREF}">{PHONE_LABEL}</a>'
        f"</div>"
        f'<div class="footer-left-link-wrap is-center">'
        f'<div class="icon-embed-xsmall w-embed">{ICONS["mail"]}</div>'
        f'<a class="footer5_link" href="{MAIL_HREF}">{MAIL_LABEL}</a>'
        f"</div>"
    )


def fix_kontakt_section(html: str) -> tuple[str, bool]:
    m = KONTakt_BLOCK.search(html)
    if not m:
        return html, False
    inner = m.group(0)
    compact = "<br/>" in inner or '<div class="footer-left-link-wrap">' in inner and "\n" not in inner[:200]
    rows = contact_rows_html_compact() if compact else contact_rows_html("                      ")
    replacement = m.group(1) + rows + m.group(2)
    return html[: m.start()] + replacement + html[m.end() :], True


def main() -> int:
    n = 0
    for path in sorted(EXPORT.rglob("*.html")):
        raw = path.read_text(encoding="utf-8")
        if "Kontakt</div>" not in raw or "footer-links-wrap" not in raw:
            continue
        updated, ok = fix_kontakt_section(raw)
        if ok and updated != raw:
            path.write_text(updated, encoding="utf-8")
            print(path.relative_to(ROOT))
            n += 1
    print(f"Updated {n} file(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
