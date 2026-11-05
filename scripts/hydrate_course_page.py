"""Server/build: bake course JSON into course-page.html markup."""

from __future__ import annotations

import html
import json
import re
from pathlib import Path
from typing import Any

from bs4 import BeautifulSoup, Tag

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content" / "utbildning"


def load_course(slug: str) -> dict[str, Any] | None:
    path = CONTENT / f"{slug}.json"
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def _set_field_text(soup: BeautifulSoup, field: str, text: str | None) -> None:
    if text is None:
        return
    el = soup.select_one(f'[data-vivaci-field="{field}"]')
    if not el:
        return
    if field == "about-body":
        el.clear()
        frag = BeautifulSoup(text, "html.parser")
        for child in list(frag.children):
            el.append(child)
        return
    if field == "fee-amount":
        el.string = text
        return
    el.string = text


ENROLL_TRIGGER_CLASSES = ["is-vivaci-enroll-trigger"]


def _normalize_enroll_trigger(el) -> None:
    el["class"] = list(ENROLL_TRIGGER_CLASSES)


def _set_hero_cta(soup: BeautifulSoup, cta: dict[str, str] | None) -> None:
    el = soup.select_one('[data-vivaci-field="hero-cta-primary"]')
    if not el:
        return
    _normalize_enroll_trigger(el)
    el["href"] = "#"
    el["data-vivaci-course-enroll"] = ""
    if not cta:
        return
    label = el.select_one("div")
    if label and cta.get("label"):
        label.string = cta["label"]


def _fill_dates(soup: BeautifulSoup, dates: list[dict[str, str]] | None) -> None:
    list_el = soup.select_one('[data-vivaci-field="dates-list"]')
    if not list_el or not dates:
        return
    template = list_el.select_one(".career21_item")
    if not template:
        return
    template_html = str(template)
    list_el.clear()
    for d in dates:
        item = BeautifulSoup(template_html, "html.parser").select_one(".career21_item")
        if not item:
            continue
        title = item.select_one(".career21_title-wrapper .heading-style-h6")
        if title:
            title.string = d.get("label", "")
        job_rows = item.select(".career21_job-detail")
        if len(job_rows) >= 1:
            time_cell = job_rows[0].find_all("div")[-1]
            if time_cell:
                time_cell.string = d.get("time", "")
        if len(job_rows) >= 2:
            seats_cell = job_rows[1].find_all("div")[-1]
            if seats_cell:
                seats_cell.string = d.get("seats", "")
        btn = item.select_one(".button-group a")
        if btn:
            _normalize_enroll_trigger(btn)
            btn["href"] = "#"
            btn["data-vivaci-course-enroll"] = ""
            btn["data-course-date"] = d.get("label", "")
            btn["data-course-time"] = d.get("time", "")
        list_el.append(item)


def _fill_instructors(soup: BeautifulSoup, block: dict[str, Any] | None) -> None:
    sec = soup.select_one('[data-vivaci-section="instructors"]')
    if not sec or not block:
        return
    items = block.get("items") or []
    if block.get("enabled") is False or not items:
        sec["hidden"] = "hidden"
        return
    sec.attrs.pop("hidden", None)
    heading = sec.select_one('[data-vivaci-field="instructors-heading"]')
    intro = sec.select_one('[data-vivaci-field="instructors-intro"]')
    if heading and block.get("heading"):
        heading.string = block["heading"]
    if intro is not None:
        intro.string = block.get("intro") or ""
    grid = sec.select_one(".team8_list")
    if not grid:
        return
    template = grid.select_one(".team8_item")
    if not template:
        return
    template_html = str(template)
    grid.clear()
    for i, person in enumerate(items):
        node = BeautifulSoup(template_html, "html.parser").select_one(".team8_item")
        if not node:
            continue
        if i % 2 == 1:
            node["class"] = [*(node.get("class") or []), "is-down"]
        img = node.select_one(".team8_image")
        if img and person.get("image"):
            img["src"] = person["image"]
            img["alt"] = f'{person.get("name", "")} — instruktör'.strip()
            for attr in ("srcset", "sizes"):
                if img.has_attr(attr):
                    del img[attr]
        name_el = node.select_one(".team8_title-wrapper .text-size-regular")
        role_el = node.select_one(".team8_title-wrapper .text-size-small")
        if name_el:
            name_el.string = person.get("name", "")
        if role_el:
            role_el.string = person.get("role", "")
        grid.append(node)


def _fill_faq(soup: BeautifulSoup, block: dict[str, Any] | None) -> None:
    sec = soup.select_one('[data-vivaci-section="faq"]')
    if not sec or not block:
        return
    items = block.get("items") or []
    if block.get("enabled") is False or not items:
        sec["hidden"] = "hidden"
        return
    sec.attrs.pop("hidden", None)
    intro = sec.select_one('[data-vivaci-field="faq-intro"]')
    if intro is not None:
        intro.string = block.get("intro") or ""
    list_el = sec.select_one(".faq3_list")
    if not list_el:
        return
    template = list_el.select_one(".faq3_accordion")
    if not template:
        return
    template_html = str(template)
    list_el.clear()
    for faq in items:
        node = BeautifulSoup(template_html, "html.parser").select_one(".faq3_accordion")
        if not node:
            continue
        q = node.select_one(".faq3_question .heading-style-h6")
        a = node.select_one(".faq3_answer p")
        if q:
            q.string = faq.get("question", "")
        if a:
            a.string = faq.get("answer", "")
        list_el.append(node)


def _set_meta(soup: BeautifulSoup, data: dict[str, Any]) -> None:
    title = data.get("title")
    if not title:
        return
    full = f"{title} — Vivaci Klinik"
    if soup.title:
        soup.title.string = full
    desc = data.get("metaDescription") or (data.get("hero") or {}).get("intro") or ""
    for sel, val in (
        ('meta[name="description"]', desc),
        ('meta[property="og:title"]', full),
        ('meta[property="og:description"]', desc),
        ('meta[name="twitter:title"]', full),
        ('meta[name="twitter:description"]', desc),
    ):
        el = soup.select_one(sel)
        if el and val:
            el["content"] = val


def _set_bottom_cta(soup: BeautifulSoup, data: dict[str, Any]) -> None:
    sec = soup.select_one('[data-vivaci-section="course-bottom-cta"]')
    if not sec:
        return
    cta = data.get("bottomCta") or {
        "heading": "Intresserad av den här utbildningen?",
        "body": "Anmäl intresse eller ställ frågor om datum, behörighet och faktura — vi återkommer inom två arbetsdagar.",
        "label": "Kontakta oss",
        "href": "/kontakt",
    }
    h = sec.select_one('[data-vivaci-field="course-bottom-heading"]')
    p = sec.select_one('[data-vivaci-field="course-bottom-body"]')
    link = sec.select_one('[data-vivaci-field="course-bottom-link"]')
    if h:
        h.string = cta.get("heading", "")
    if p:
        p.string = cta.get("body", "")
    if link:
        link["href"] = cta.get("href", "/kontakt")
        label = link.select_one("div")
        if label:
            label.string = cta.get("label", "Kontakta oss")


def hydrate_course_html(raw: str, data: dict[str, Any]) -> str:
    soup = BeautifulSoup(raw, "html.parser")
    _set_meta(soup, data)

    hero = data.get("hero") or {}
    summary = data.get("summary") or {}

    _set_field_text(soup, "hero-title", hero.get("title") or data.get("title"))
    _set_field_text(soup, "hero-intro", hero.get("intro"))
    _set_field_text(soup, "hero-audience", hero.get("audience"))
    _set_hero_cta(soup, hero.get("ctaPrimary"))

    img = soup.select_one("[data-vivaci-hero-image]")
    if img and hero.get("image"):
        img["src"] = hero["image"]
        img["alt"] = hero.get("title") or data.get("title") or "Utbildning"
        for attr in ("srcset", "sizes"):
            if img.has_attr(attr):
                del img[attr]

    _set_field_text(soup, "summary-intro", summary.get("intro"))
    _set_field_text(soup, "fee-amount", summary.get("fee"))
    _set_field_text(soup, "fee-suffix", summary.get("feeNote"))
    _set_field_text(soup, "course-level", summary.get("level"))
    _set_field_text(soup, "course-duration", summary.get("duration"))
    _set_field_text(soup, "course-location", summary.get("location"))

    about = (data.get("about") or {}).get("html")
    if about:
        _set_field_text(soup, "about-body", about)

    _fill_dates(soup, data.get("dates"))
    _fill_instructors(soup, data.get("instructors"))
    _fill_faq(soup, data.get("faq"))
    _set_bottom_cta(soup, data)

    if soup.html:
        if data.get("slug"):
            soup.html["data-vivaci-course-hydrated"] = data.get("slug", "")
        if data.get("title"):
            soup.html["data-vivaci-course-title"] = data.get("title", "")

    _ensure_course_scripts(soup)

    return str(soup)


def _ensure_course_scripts(soup: BeautifulSoup) -> None:
    head = soup.head
    if not head:
        return
    html = str(head)
    if "vivaci-quiz.css" not in html:
        head.append(
            soup.new_tag(
                "link",
                href="/css/vivaci-quiz.css",
                rel="stylesheet",
                type="text/css",
            )
        )
    if "vivaci-academy.css" not in html:
        head.append(
            soup.new_tag(
                "link",
                href="/css/vivaci-academy.css",
                rel="stylesheet",
                type="text/css",
            )
        )
    if "vivaci-faq-accordion.js" not in html:
        head.append(
            soup.new_tag(
                "script",
                src="/js/vivaci-faq-accordion.js",
                type="text/javascript",
                defer="defer",
            )
        )
    if "vivaci-course-enroll.js" not in html:
        head.append(
            soup.new_tag(
                "script",
                src="/js/vivaci-course-enroll.js",
                type="text/javascript",
                defer="defer",
            )
        )


def hydrate_course_page(raw: str, slug: str) -> str:
    data = load_course(slug)
    if not data:
        return raw
    return hydrate_course_html(raw, data)


def build_all(out_dir: Path, template_path: Path) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    template = template_path.read_text(encoding="utf-8")
    written: list[Path] = []
    for path in sorted(CONTENT.glob("*.json")):
        if path.name == "index.json":
            continue
        slug = path.stem
        data = json.loads(path.read_text(encoding="utf-8"))
        html_out = hydrate_course_html(template, data)
        dest = out_dir / f"{slug}.html"
        dest.write_text(html_out, encoding="utf-8")
        written.append(dest)
    return written


if __name__ == "__main__":
    export = ROOT / "reference" / "webflow-export"
    files = build_all(export / "utbildning", export / "course-page.html")
    print(f"Built {len(files)} course pages under reference/webflow-export/utbildning/")
