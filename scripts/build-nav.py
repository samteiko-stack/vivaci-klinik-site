#!/usr/bin/env python3
"""Build content/from-production/nav.json from the live production homepage only."""

from __future__ import annotations

import json
import random
from pathlib import Path

import requests
from bs4 import BeautifulSoup

BASE = "https://vivaci-klinik-production.up.railway.app"
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "content/from-production/nav.json"
DESCRIPTIONS_PATH = ROOT / "content/from-production/nav-descriptions.json"
LISTING_PATH = ROOT / "content/behandlingar/listing.json"

# Same order as production header + Webflow template
CATEGORY_ORDER = ["Plastikkirurgi", "Hud", "Injektion", "Kropp", "Hår"]

TREATMENT_IMAGES_PATH = ROOT / "content/from-production/treatment-images.json"
AK_PLACEHOLDER_IMAGE = "/images/ak/treatments/hydrafacial.jpg"

# Display labels in mega-menu (canonical slugs unchanged)
NAV_LABEL_OVERRIDES: dict[str, str] = {
    "/behandlingar/botulinum-toxin": "Botox",
}

INJEKTION_HIGHLIGHT_HREFS = (
    "/behandlingar/botulinum-toxin",
    "/behandlingar/dermal-fillers",
)

MER_LINKS = [
    {"href": "/blogg", "label": "Blogg"},
    {"href": "/prislista", "label": "Prislista"},
    {"href": "/kontakt", "label": "Kontakta oss"},
]


def load_image_by_href() -> dict[str, str]:
    if not TREATMENT_IMAGES_PATH.is_file():
        return {}
    data = json.loads(TREATMENT_IMAGES_PATH.read_text(encoding="utf-8"))
    return dict(data.get("byHref") or {})


def image_for_href(href: str, image_by_href: dict[str, str]) -> str:
    key = (href or "").rstrip("/")
    return (
        image_by_href.get(key)
        or image_by_href.get(href or "")
        or AK_PLACEHOLDER_IMAGE
    )


def load_listing_items_by_category() -> dict[str, list[dict]]:
    if not LISTING_PATH.is_file():
        return {}
    data = json.loads(LISTING_PATH.read_text(encoding="utf-8"))
    out: dict[str, list[dict]] = {}
    for cat in data.get("categories") or []:
        label = (cat.get("label") or "").strip()
        if not label:
            continue
        rows: list[dict] = []
        for item in cat.get("items") or []:
            href = (item.get("href") or "").strip()
            if not href:
                continue
            key = href.rstrip("/")
            row = {
                "href": href,
                "label": NAV_LABEL_OVERRIDES.get(key, item.get("label") or href),
            }
            if item.get("description"):
                row["description"] = item["description"]
            if item.get("image"):
                row["image"] = item["image"]
            rows.append(row)
        out[label] = rows
    return out


def merge_category_items(
    category: str,
    scraped_items: list[dict],
    listing_by_category: dict[str, list[dict]],
) -> list[dict]:
    """Injektion: behandling pages first (Botox, fillers…), then Railway problem links."""
    if category != "Injektion":
        return scraped_items
    prefix = listing_by_category.get("Injektion") or []
    seen: set[str] = set()
    merged: list[dict] = []
    for it in prefix + scraped_items:
        href = (it.get("href") or "").strip()
        if not href:
            continue
        key = href.rstrip("/")
        if key in seen:
            continue
        seen.add(key)
        row = dict(it)
        if key in NAV_LABEL_OVERRIDES:
            row["label"] = NAV_LABEL_OVERRIDES[key]
        merged.append(row)
    return merged


def is_overview_item(item: dict) -> bool:
    label = item.get("label", "").lower()
    href = item.get("href", "")
    if label.startswith("all "):
        return True
    parts = [p for p in href.split("/") if p]
    return len(parts) == 1


def pick_highlights(
    category_label: str,
    items: list[dict],
    image_by_href: dict[str, str],
    count: int = 2,
) -> list[dict]:
    if category_label == "Injektion":
        by_href = {(it.get("href") or "").rstrip("/"): it for it in items}
        picked: list[dict] = []
        for href in INJEKTION_HIGHLIGHT_HREFS:
            it = by_href.get(href.rstrip("/"))
            if it:
                picked.append(it)
            if len(picked) >= count:
                break
        if picked:
            out: list[dict] = []
            for it in picked:
                row: dict = {"href": it["href"], "label": it["label"]}
                if it.get("description"):
                    row["description"] = it["description"]
                row["image"] = it.get("image") or image_for_href(
                    it.get("href") or "", image_by_href
                )
                out.append(row)
            return out

    candidates = [it for it in items if not is_overview_item(it)]
    if not candidates:
        return []
    rng = random.Random(category_label)
    picked = candidates if len(candidates) <= count else rng.sample(candidates, count)
    out = []
    for it in picked:
        row = {"href": it["href"], "label": it["label"]}
        if it.get("description"):
            row["description"] = it["description"]
        href = it.get("href") or ""
        row["image"] = image_for_href(href, image_by_href)
        out.append(row)
    return out


def nav_groups(soup: BeautifulSoup, aria_label: str) -> list[dict]:
    nav = soup.find("nav", attrs={"aria-label": aria_label})
    if not nav:
        return []
    groups: list[dict] = []
    for rel in nav.find_all("div", class_="relative", recursive=True):
        btn = rel.find("button")
        if not btn:
            continue
        label = btn.get_text(strip=True)
        panel = rel.find(
            "div",
            class_=lambda c: c and "absolute" in c and "top-full" in c,
        )
        items: list[dict] = []
        if panel:
            for a in panel.find_all("a", href=True):
                items.append({"href": a["href"], "label": a.get_text(strip=True)})
        groups.append({"label": label, "items": items})
    return groups


def utility_links(soup: BeautifulSoup) -> list[dict]:
    """Top-level header links on the right (not inside mega-menu panels)."""
    nav = soup.find("nav", attrs={"aria-label": "Main navigation right"})
    if not nav:
        return []
    out: list[dict] = []
    seen: set[str] = set()
    for a in nav.find_all("a", href=True):
        if a.find_parent(
            "div",
            class_=lambda c: c and "absolute" in c and "top-full" in c,
        ):
            continue
        href = a["href"]
        if href in seen:
            continue
        seen.add(href)
        out.append({"href": href, "label": a.get_text(strip=True)})
    return out


def attach_descriptions(items: list[dict], descriptions: dict[str, str]) -> list[dict]:
    out: list[dict] = []
    for it in items:
        row = dict(it)
        desc = descriptions.get(it["href"])
        if desc:
            row["description"] = desc
        out.append(row)
    return out


def attach_images(items: list[dict], hud_images: dict[str, str]) -> list[dict]:
    out: list[dict] = []
    for it in items:
        row = dict(it)
        href = it.get("href") or ""
        row["image"] = image_for_href(href, hud_images)
        out.append(row)
    return out


def main() -> None:
    html = requests.get(BASE + "/", timeout=30).text
    soup = BeautifulSoup(html, "html.parser")

    descriptions: dict[str, str] = {}
    if DESCRIPTIONS_PATH.is_file():
        descriptions = json.loads(DESCRIPTIONS_PATH.read_text(encoding="utf-8"))

    scraped: dict[str, list[dict]] = {}
    for group in nav_groups(soup, "Main navigation left") + nav_groups(
        soup, "Main navigation right"
    ):
        scraped[group["label"]] = group["items"]

    image_by_href = load_image_by_href()
    listing_by_category = load_listing_items_by_category()
    categories: list[dict] = []
    for name in CATEGORY_ORDER:
        raw = merge_category_items(
            name, scraped.get(name, []), listing_by_category
        )
        items = attach_images(
            attach_descriptions(raw, descriptions),
            image_by_href,
        )
        items = [it for it in items if not is_overview_item(it)]
        categories.append(
            {
                "label": name,
                "items": items,
                "highlights": pick_highlights(name, items, image_by_href),
            }
        )

    utility = utility_links(soup)
    utility = [u for u in utility if u.get("href") != "/om-oss"]
    if not any(u.get("href") == "/prislista" for u in utility):
        utility.insert(1, {"href": "/prislista", "label": "Prislista"})
    if not any(u.get("href") == "/kontakt" for u in utility):
        utility.append({"href": "/kontakt", "label": "Kontakta oss"})

    payload = {
        "source": BASE,
        "categories": categories,
        "moreLinks": MER_LINKS,
        "utilityLinks": utility,
    }
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {OUT} — production nav only")
    print("  Tip: run python3 scripts/build_en_locale.py to refresh English nav.json")
    for g in categories:
        print(f"  {g['label']}: {len(g['items'])} links")
    print(f"  utility: {len(payload['utilityLinks'])} links")


if __name__ == "__main__":
    main()
