"""SSR-style hydrate for prislista.html from content/prislista.json."""

from __future__ import annotations

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRISLISTA_JSON = ROOT / "content" / "prislista.json"


def _slugify(title: str) -> str:
    import unicodedata

    s = unicodedata.normalize("NFD", title or "section")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.lower().replace("&", "och")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "section"


def _row_html(label: str, href: str, price: str) -> str:
    label_e = html.escape(label or "")
    href_e = html.escape(href or "#")
    price_e = html.escape(price or "")
    return (
        f'<div class="vivaci-prislista-row" role="row">'
        f'<a href="{href_e}" class="vivaci-prislista-row__label text-size-regular">'
        f"{label_e}</a>"
        f'<span class="vivaci-prislista-row__price text-size-regular">{price_e}</span>'
        f"</div>"
    )


def _section_html(title: str, items: list[dict]) -> str:
    sid = "vivaci-prislista-" + _slugify(title)
    heading_id = sid + "-heading"
    rows = "".join(
        _row_html(
            str(item.get("label") or ""),
            str(item.get("href") or ""),
            str(item.get("price") or ""),
        )
        for item in items
    )
    title_e = html.escape(title or "")
    return f"""<div class="margin-bottom margin-xlarge vivaci-prislista-section" id="{sid}">
        <div class="margin-bottom margin-small">
          <h2 class="heading-style-h5" id="{heading_id}">{title_e}</h2>
        </div>
        <div class="line-divider margin-bottom margin-small"></div>
        <div class="vivaci-prislista-table" role="table" aria-labelledby="{heading_id}">
          <div class="vivaci-prislista-table-head" role="row">
            <span class="vivaci-prislista-table-head__label text-size-small text-style-muted" role="columnheader">Behandling</span>
            <span class="vivaci-prislista-table-head__price text-size-small text-style-muted" role="columnheader">Från-pris</span>
          </div>
          {rows}
        </div>
      </div>"""


def _nav_html(sections: list[dict]) -> str:
    links: list[str] = []
    for section in sections:
        title = str(section.get("title") or "")
        sid = "vivaci-prislista-" + _slugify(title)
        links.append(
            f'<a href="/prislista#{sid}" data-vivaci-prislista-section="{sid}" '
            f'class="filters2_category-link is-vivaci-filter-chip w-inline-block" '
            f'role="listitem">{html.escape(title)}</a>'
        )
    return "\n".join(links)


def hydrate_prislista(raw: str) -> str:
    if 'id="vivaci-prislista"' not in raw or not PRISLISTA_JSON.is_file():
        return raw

    data = json.loads(PRISLISTA_JSON.read_text(encoding="utf-8"))
    sections = data.get("sections") or []

    title = html.escape(str(data.get("title") or "Prislista"))
    intro = html.escape(str(data.get("intro") or ""))
    disclaimer = html.escape(str(data.get("disclaimer") or ""))

    raw = re.sub(
        r'(<h1[^>]*data-vivaci-field="prislista-title"[^>]*>)(.*?)(</h1>)',
        rf"\1{title}\3",
        raw,
        count=1,
        flags=re.S,
    )
    raw = re.sub(
        r'(<p[^>]*data-vivaci-field="prislista-intro"[^>]*>)(.*?)(</p>)',
        rf"\1{intro}\3",
        raw,
        count=1,
        flags=re.S,
    )
    raw = re.sub(
        r'(<p[^>]*data-vivaci-field="prislista-disclaimer"[^>]*>)(.*?)(</p>)',
        rf"\1{disclaimer}\3",
        raw,
        count=1,
        flags=re.S,
    )

    nav = _nav_html(sections)
    raw = re.sub(
        r"(<div[^>]*data-vivaci-prislista-nav[^>]*>)(.*?)(</div>)",
        rf"\1\n{nav}\n\3",
        raw,
        count=1,
        flags=re.S,
    )

    body = "\n".join(
        _section_html(str(s.get("title") or ""), s.get("items") or [])
        for s in sections
    )
    raw = re.sub(
        r"(<div[^>]*data-vivaci-prislista-sections[^>]*>)(.*?)(</div>)",
        rf"\1\n{body}\n\3",
        raw,
        count=1,
        flags=re.S,
    )
    return raw
