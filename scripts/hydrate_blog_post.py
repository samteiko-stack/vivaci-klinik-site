"""Server/build: bake nyheter JSON into blog-page.html markup."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from bs4 import BeautifulSoup, Tag

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content" / "nyheter"


def load_post(slug: str) -> dict[str, Any] | None:
    path = CONTENT / f"{slug}.json"
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def _set_text(el: Tag | None, text: str | None) -> None:
    if el is None or text is None:
        return
    el.clear()
    el.append(text)


def _set_html(el: Tag | None, fragment: str | None) -> None:
    if el is None or not fragment:
        return
    el.clear()
    frag = BeautifulSoup(fragment, "html.parser")
    for child in list(frag.children):
        el.append(child)


def _set_hero_image(soup: BeautifulSoup, src: str | None, alt: str | None) -> None:
    img = soup.select_one('[data-vivaci-field="hero-image"]')
    if not img or not src:
        return
    img["src"] = src
    if alt:
        img["alt"] = alt
    img.attrs.pop("srcset", None)
    img.attrs.pop("sizes", None)


def _set_author_image(soup: BeautifulSoup, src: str | None, alt: str | None) -> None:
    img = soup.select_one('[data-vivaci-field="author-image"]')
    if not img or not src:
        return
    img["src"] = src
    if alt:
        img["alt"] = alt


def _fill_tags(soup: BeautifulSoup, tags: list[str] | None) -> None:
    list_el = soup.select_one('[data-vivaci-field="tags-list"]')
    if not list_el:
        return
    template = list_el.select_one(".blog-post3-content_tag-item")
    if not template:
        return
    template_html = str(template)
    list_el.clear()
    for label in tags or []:
        item = BeautifulSoup(template_html, "html.parser").select_one(
            ".blog-post3-content_tag-item"
        )
        if not item:
            continue
        item["href"] = "/nyheter"
        div = item.find("div")
        if div:
            div.string = label
        list_el.append(item)


def _ensure_blog_styles(soup: BeautifulSoup) -> None:
    head = soup.head
    if not head:
        return
    html = str(head)
    if "vivaci-blog.css" not in html:
        head.append(
            soup.new_tag(
                "link",
                href="/css/vivaci-blog.css",
                rel="stylesheet",
                type="text/css",
            )
        )


def _update_meta(soup: BeautifulSoup, data: dict[str, Any]) -> None:
    title = data.get("title") or "Nyheter"
    desc = data.get("metaDescription") or data.get("excerpt") or ""
    page_title = f"{title} — Vivaci Klinik"
    if soup.title:
        soup.title.string = page_title
    for sel, attr, val in (
        ('meta[name="description"]', "content", desc),
        ('meta[property="og:title"]', "content", title),
        ('meta[property="og:description"]', "content", desc),
        ('meta[name="twitter:title"]', "content", title),
        ('meta[name="twitter:description"]', "content", desc),
    ):
        el = soup.select_one(sel)
        if el and val:
            el[attr] = val


def hydrate_blog_html(raw: str, data: dict[str, Any]) -> str:
    soup = BeautifulSoup(raw, "html.parser")
    slug = data.get("slug", "")

    _update_meta(soup, data)

    root = soup.select_one("main") or soup.body
    if root:
        root["data-vivaci-post-slug"] = slug
        root["data-vivaci-post-hydrated"] = "1"

    crumb_root = soup.select_one('[data-vivaci-field="breadcrumb-root"]')
    if crumb_root:
        crumb_root["href"] = "/nyheter"
        div = crumb_root.find("div")
        if div:
            div.string = "Nyheter & tips"

    crumb_cat = soup.select_one('[data-vivaci-field="breadcrumb-category"]')
    if crumb_cat:
        crumb_cat["href"] = "/nyheter"
        div = crumb_cat.find("div")
        if div:
            div.string = data.get("category") or "Nyheter"

    _set_text(soup.select_one('[data-vivaci-field="title"]'), data.get("title"))
    _set_text(
        soup.select_one('[data-vivaci-field="author-name"]'),
        (data.get("author") or {}).get("name"),
    )
    _set_text(soup.select_one('[data-vivaci-field="date"]'), data.get("date"))
    _set_text(soup.select_one('[data-vivaci-field="read-time"]'), data.get("readTime"))

    author = data.get("author") or {}
    _set_text(soup.select_one('[data-vivaci-field="author-name-footer"]'), author.get("name"))
    role = author.get("role") or ""
    bio = author.get("bio") or ""
    footer_line = role if not bio else f"{role}. {bio}"
    _set_text(soup.select_one('[data-vivaci-field="author-role"]'), footer_line)

    _set_hero_image(soup, data.get("heroImage"), data.get("title"))
    _set_author_image(soup, author.get("image"), author.get("name"))
    _set_html(soup.select_one('[data-vivaci-field="body-html"]'), data.get("bodyHtml"))
    _fill_tags(soup, data.get("tags"))
    _ensure_blog_styles(soup)

    html_out = str(soup)
    html_out = re.sub(r"<html([^>]*) lang=\"[^\"]*\"", r'<html\1 lang="sv"', html_out, count=1)
    return html_out


def hydrate_blog_post(raw: str, slug: str) -> str:
    data = load_post(slug)
    if not data:
        return raw
    data.setdefault("slug", slug)
    return hydrate_blog_html(raw, data)


def build_all(out_dir: Path, template_path: Path) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    template = template_path.read_text(encoding="utf-8")
    written: list[Path] = []
    for path in sorted(CONTENT.glob("*.json")):
        if path.name == "index.json":
            continue
        slug = path.stem
        data = json.loads(path.read_text(encoding="utf-8"))
        data.setdefault("slug", slug)
        html_out = hydrate_blog_html(template, data)
        dest = out_dir / f"{slug}.html"
        dest.write_text(html_out, encoding="utf-8")
        written.append(dest)
    return written


if __name__ == "__main__":
    export = ROOT / "reference" / "webflow-export"
    files = build_all(export / "nyheter", export / "blog-page.html")
    print(f"Built {len(files)} blog posts under reference/webflow-export/nyheter/")
