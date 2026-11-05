#!/usr/bin/env python3
"""Generate nyheter.html from the same listing shell as utbildning.html."""

from __future__ import annotations

from pathlib import Path

from bs4 import BeautifulSoup, Tag

ROOT = Path(__file__).resolve().parents[1]
EXPORT = ROOT / "reference" / "webflow-export"

HERO_EYEBROW = """
<div class="margin-bottom margin-xsmall">
  <div data-wf--tagline--variant="white-dot" class="full-tag">
    <img src="images/sss.svg" loading="lazy" alt="" class="tag-image w-variant-0123b966-6127-57af-5491-20e874ad3cfd">
    <p data-vivaci-field="hero-eyebrow">Blogg</p>
  </div>
</div>
"""

CATEGORY_ORDER = "Nyhet,Utbildande,Bloggartikel,Erbjudande"


def _ensure_blog_css(soup: BeautifulSoup) -> None:
    head = soup.head
    if not head or "vivaci-blog.css" in str(head):
        return
    link = soup.new_tag(
        "link",
        href="css/vivaci-blog.css",
        rel="stylesheet",
        type="text/css",
    )
    head.append(link)


def _patch_hero(soup: BeautifulSoup) -> None:
    hero_header = soup.select_one("header.is-section.text-color-white")
    if hero_header:
        hero_header["id"] = "vivaci-nyheter-hero"

    hero = soup.select_one("header.is-section.text-color-white .header50_component")
    if not hero:
        raise SystemExit("utbildning shell: header50_component not found")
    max_w = hero.select_one(".max-width-medium")
    if not max_w:
        raise SystemExit("utbildning shell: max-width-medium not found")
    max_w.clear()

    eyebrow = BeautifulSoup(HERO_EYEBROW, "html.parser")
    for child in list(eyebrow.children):
        if isinstance(child, Tag):
            max_w.append(child)

    h1_wrap = soup.new_tag("div", attrs={"class": "margin-bottom margin-small"})
    h1 = soup.new_tag(
        "h1",
        attrs={"class": "heading-style-h2", "data-vivaci-field": "hero-title"},
    )
    h1.string = "Nyheter & tips"
    h1_wrap.append(h1)
    max_w.append(h1_wrap)

    intro = soup.new_tag(
        "p",
        attrs={"class": "text-size-regular", "data-vivaci-field": "hero-intro"},
    )
    intro.string = (
        "Tips från våra experter, nyheter och praktiska råd från Vivaci Klinik."
    )
    max_w.append(intro)

    bg_img = soup.select_one(".header50_background-image")
    if bg_img:
        bg_img["src"] = "images/pexels/blog-1.jpg"
        bg_img.attrs.pop("srcset", None)
        bg_img.attrs.pop("sizes", None)
        bg_img["alt"] = "Nyheter och tips från Vivaci Klinik"


def _patch_listing_section(soup: BeautifulSoup) -> None:
    section = soup.select_one("section[data-vivaci-category-finder]")
    if not section:
        raise SystemExit("utbildning shell: category finder section not found")
    section["id"] = "vivaci-nyheter-list"
    section["data-nav-url"] = "/content/nyheter/listing.json"
    section["data-category-order"] = CATEGORY_ORDER
    section["data-empty-search"] = "Inga artiklar matchar din sökning."
    section["data-empty-category"] = "Inga artiklar att visa."
    section["data-cta-label"] = "Läs artikel"
    section.attrs.pop("data-cta-primary-href", None)
    section.attrs.pop("data-cta-primary-label", None)

    template = soup.select_one("#vivaci-listing-card-template")
    if template:
        title = template.select_one(".vivaci-listing-card__title")
        if title:
            title.string = "Artikel"
        cta = template.select_one("[data-vivaci-listing-cta]")
        if cta:
            cta.clear()
            cta.string = "Läs artikel"


def build() -> Path:
    template = (EXPORT / "utbildning.html").read_text(encoding="utf-8")
    soup = BeautifulSoup(template, "html.parser")

    if soup.title:
        soup.title.string = "Nyheter & tips — Vivaci Klinik"
    desc = soup.select_one('meta[name="description"]')
    if desc:
        desc["content"] = (
            "Läs nyheter, erbjudanden och utbildande artiklar från Vivaci Klinik i Stockholm."
        )
    for sel, val in (
        ('meta[property="og:title"]', "Nyheter & tips"),
        ('meta[name="twitter:title"]', "Nyheter & tips"),
    ):
        el = soup.select_one(sel)
        if el:
            el["content"] = val

    html_tag = soup.find("html")
    if html_tag:
        html_tag["lang"] = "sv"

    _patch_hero(soup)
    _patch_listing_section(soup)
    _ensure_blog_css(soup)

    html_out = str(soup)
    if "vivaci-nyheter-page.js" not in html_out:
        html_out = html_out.replace(
            "</body>",
            '<script src="/js/vivaci-nyheter-page.js" defer></script>\n</body>',
            1,
        )

    dest = EXPORT / "nyheter.html"
    dest.write_text(html_out, encoding="utf-8")
    return dest


if __name__ == "__main__":
    path = build()
    print(f"Wrote {path}")
