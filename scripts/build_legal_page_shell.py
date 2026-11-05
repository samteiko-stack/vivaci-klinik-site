#!/usr/bin/env python3
"""Generate legal-page.html shell (nav + legal main + footer) from utbildning.html."""

from __future__ import annotations

import re
from pathlib import Path

from bs4 import BeautifulSoup, Tag

ROOT = Path(__file__).resolve().parents[1]
EXPORT = ROOT / "reference" / "webflow-export"

LEGAL_SECTION = """
<section class="is-section bg-light" id="vivaci-legal">
  <div class="padding-global">
    <div class="container-medium">
      <div class="padding-section-large is-offset">
        <div class="margin-bottom margin-medium">
          <h1 class="heading-style-h2" data-vivaci-field="legal-title">Legal</h1>
        </div>
        <div class="text-rich-text w-richtext is-vivaci-legal-body" data-vivaci-field="legal-body"></div>
      </div>
    </div>
  </div>
</section>
"""


def _strip_between_nav_and_footer(soup: BeautifulSoup) -> None:
    footer = soup.select_one("footer.is-section.bg-dark")
    if not footer:
        raise SystemExit("footer not found")
    el = footer.previous_sibling
    while el:
        prev = el.previous_sibling
        name = getattr(el, "name", None)
        if name in ("header", "section", "template", "main"):
            el.decompose()
        el = prev


def build_shell() -> Path:
    template = (EXPORT / "utbildning.html").read_text(encoding="utf-8")
    soup = BeautifulSoup(template, "html.parser")

    _strip_between_nav_and_footer(soup)

    footer = soup.select_one("footer.is-section.bg-dark")
    section = BeautifulSoup(LEGAL_SECTION, "html.parser").select_one("section")
    if footer and section:
        footer.insert_before(section)

    html_out = str(soup)
    html_out = re.sub(
        r'(<a[^>]*class="footer5_legal-link[^"]*"[^>]*href=")[^"]*("[^>]*>)\s*Köpvillkor',
        r'\1/villkor\2Köpvillkor',
        html_out,
    )
    html_out = re.sub(
        r'(<a[^>]*class="footer5_legal-link[^"]*"[^>]*href=")[^"]*("[^>]*>)\s*Integritetspolicy',
        r'\1/integritetspolicy\2Integritetspolicy',
        html_out,
        count=1,
    )

    if "vivaci-legal.css" not in html_out:
        html_out = html_out.replace(
            "</head>",
            '  <link href="css/vivaci-legal.css" rel="stylesheet" type="text/css">\n</head>',
            1,
        )

    dest = EXPORT / "legal-page.html"
    dest.write_text(html_out, encoding="utf-8")
    return dest


def relativize_for_legal_subfolder(html: str) -> str:
    """legal/*.html lives one level down — prefix asset paths."""
    html = html.replace('href="css/', 'href="../css/')
    html = html.replace('href="js/', 'href="../js/')
    html = html.replace('href="images/', 'href="../images/')
    html = html.replace('href="fonts/', 'href="../fonts/')
    html = html.replace('src="js/', 'src="../js/')
    html = html.replace('src="images/', 'src="../images/')
    html = html.replace('href="legal/', 'href="../legal/')
    html = html.replace('href="kontakt.html"', 'href="/kontakt"')
    html = html.replace('href="index.html"', 'href="/"')
    return html


if __name__ == "__main__":
    path = build_shell()
    print(f"Wrote {path}")
