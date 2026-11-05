"""Bake content/legal JSON into legal page HTML."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from bs4 import BeautifulSoup, Tag

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content" / "legal"


def load_legal(slug: str) -> dict[str, Any] | None:
    path = CONTENT / f"{slug}.json"
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def _set_html(el: Tag | None, fragment: str | None) -> None:
    if el is None or not fragment:
        return
    el.clear()
    frag = BeautifulSoup(fragment, "html.parser")
    for child in list(frag.children):
        el.append(child)


def hydrate_legal_html(raw: str, data: dict[str, Any]) -> str:
    soup = BeautifulSoup(raw, "html.parser")
    title = data.get("title") or "Legal"
    desc = data.get("metaDescription") or ""

    page_title = f"{title} — Vivaci Klinik"
    if soup.title:
        soup.title.string = page_title
    for sel, val in (
        ('meta[name="description"]', desc),
        ('meta[property="og:title"]', title),
        ('meta[property="og:description"]', desc),
        ('meta[name="twitter:title"]', title),
        ('meta[name="twitter:description"]', desc),
    ):
        el = soup.select_one(sel)
        if el and val:
            el["content"] = val

    h1 = soup.select_one('[data-vivaci-field="legal-title"]')
    if h1:
        h1.string = title
    _set_html(soup.select_one('[data-vivaci-field="legal-body"]'), data.get("bodyHtml"))

    html_out = str(soup)
    html_out = re.sub(r"<html([^>]*) lang=\"[^\"]*\"", r'<html\1 lang="sv"', html_out, count=1)
    return html_out


def hydrate_legal_page(raw: str, slug: str) -> str:
    data = load_legal(slug)
    if not data:
        return raw
    return hydrate_legal_html(raw, data)


def _relativize_for_legal_subfolder(html: str) -> str:
    html = html.replace('href="css/', 'href="../css/')
    html = html.replace('href="js/', 'href="../js/')
    html = html.replace('href="images/', 'href="../images/')
    html = html.replace('href="fonts/', 'href="../fonts/')
    html = html.replace('src="js/', 'src="../js/')
    html = html.replace('src="images/', 'src="../images/')
    html = html.replace('href="kontakt.html"', 'href="/kontakt"')
    html = html.replace('href="index.html"', 'href="/"')
    html = re.sub(
        r'src="(?:\.\./)?images/logo-vivaci-dark\.webp"',
        'src="/images/logo-vivaci-dark.webp"',
        html,
    )
    return html


def build_all(out_dir: Path, template_path: Path) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    template = template_path.read_text(encoding="utf-8")
    written: list[Path] = []
    for path in sorted(CONTENT.glob("*.json")):
        if path.name == "index.json":
            continue
        slug = path.stem
        data = json.loads(path.read_text(encoding="utf-8"))
        html_out = hydrate_legal_html(template, data)
        html_out = _relativize_for_legal_subfolder(html_out)
        dest = out_dir / f"{slug}.html"
        dest.write_text(html_out, encoding="utf-8")
        written.append(dest)
    return written


if __name__ == "__main__":
    export = ROOT / "reference" / "webflow-export"
    files = build_all(export / "legal", export / "legal-page.html")
    print(f"Built {len(files)} legal pages under reference/webflow-export/legal/")
