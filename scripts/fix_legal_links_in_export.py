#!/usr/bin/env python3
"""Point static HTML legal links at dev/production URL paths."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPORT = ROOT / "reference" / "webflow-export"

KOPVILLKOR = re.compile(
    r'(<a[^>]*class="footer5_legal-link[^"]*"[^>]*)href="[^"]*"([^>]*)>\s*Köpvillkor\s*</a>',
    re.I,
)
INTEGRITET = re.compile(
    r'(<a[^>]*class="footer5_legal-link[^"]*"[^>]*)href="[^"]*"([^>]*)>\s*Integritetspolicy\s*</a>',
    re.I,
)

KONTAKT_CHECKBOX_OLD = (
    'Jag godkänner <a href="#" class="text-style-link-4">villkoren.</a>'
)
KONTAKT_CHECKBOX_NEW = (
    'Jag godkänner <a href="/integritetspolicy" class="text-style-link-4">'
    "integritetspolicyn</a> och "
    '<a href="/villkor" class="text-style-link-4">köpvillkoren</a>.'
)


def main() -> None:
    n = 0
    for path in EXPORT.rglob("*.html"):
        text = path.read_text(encoding="utf-8")
        new = KOPVILLKOR.sub(r'\1href="/villkor"\2>Köpvillkor</a>', text)
        new = INTEGRITET.sub(r'\1href="/integritetspolicy"\2>Integritetspolicy</a>', new)
        if path.name == "kontakt.html":
            new = new.replace(KONTAKT_CHECKBOX_OLD, KONTAKT_CHECKBOX_NEW)
        if new != text:
            path.write_text(new, encoding="utf-8")
            n += 1
    print(f"Updated legal links in {n} HTML files")


if __name__ == "__main__":
    main()
