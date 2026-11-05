#!/usr/bin/env python3
"""Generate 404.html with site nav + footer (from utbildning shell)."""

from __future__ import annotations

import re
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
EXPORT = ROOT / "reference" / "webflow-export"

NOT_FOUND_SECTION = """
<main class="is-section bg-light" id="vivaci-404">
  <div class="padding-global">
    <div class="container-medium">
      <div class="padding-section-large is-offset">
        <div class="vivaci-404__inner">
          <p class="heading-style-h6 text-style-muted vivaci-404__code" aria-hidden="true">404</p>
          <h1 class="heading-style-h2">Sidan hittades inte</h1>
          <p class="text-size-medium text-style-muted vivaci-404__lead">
            Sidan du söker finns inte eller har flyttats.
          </p>
          <div class="padding-small"></div>
          <a href="/" class="button w-button">Till startsidan</a>
        </div>
      </div>
    </div>
  </div>
</main>
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


def build_404() -> Path:
    template = (EXPORT / "utbildning.html").read_text(encoding="utf-8")
    soup = BeautifulSoup(template, "html.parser")

    if soup.html:
        soup.html["lang"] = "sv"
    title = soup.find("title")
    if title:
        title.string = "Sidan hittades inte — Vivaci Klinik"
    desc = soup.find("meta", attrs={"name": "description"})
    if desc:
        desc["content"] = "Sidan du söker finns inte eller har flyttats."
    else:
        head = soup.find("head")
        if head:
            tag = soup.new_tag("meta", attrs={"name": "description"})
            tag["content"] = "Sidan du söker finns inte eller har flyttats."
            head.append(tag)

    _strip_between_nav_and_footer(soup)

    footer = soup.select_one("footer.is-section.bg-dark")
    section = BeautifulSoup(NOT_FOUND_SECTION, "html.parser").select_one("main")
    if footer and section:
        footer.insert_before(section)

    html_out = str(soup)
    html_out = re.sub(
        r'(<a[^>]*class="footer5_legal-link[^"]*"[^>]*href=")[^"]*("[^>]*>)\s*Köpvillkor',
        r"\1/villkor\2Köpvillkor",
        html_out,
    )
    html_out = re.sub(
        r'(<a[^>]*class="footer5_legal-link[^"]*"[^>]*href=")[^"]*("[^>]*>)\s*Integritetspolicy',
        r"\1/integritetspolicy\2Integritetspolicy",
        html_out,
        count=1,
    )

    dest = EXPORT / "404.html"
    dest.write_text(html_out, encoding="utf-8")
    return dest


if __name__ == "__main__":
    path = build_404()
    print(f"Wrote {path.relative_to(ROOT)}")
