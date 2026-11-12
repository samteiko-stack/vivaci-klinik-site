#!/usr/bin/env python3
"""
Download treatment card images from Akademikliniken (ak.se) per content/ak-treatment-map.json.

Uses Yoast treatment-sitemap image:loc when present, else og:image from the page.
Stores under reference/webflow-export/images/ak/treatments/{slug}.{ext}
Updates treatment-images.json, treatment-visuals.json, and behandlingar listing copies.

You need rights to use these assets on vivaci.se (license, partnership, or own photography).
"""

from __future__ import annotations

import json
import re
import shutil
import time
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse

import requests

ROOT = Path(__file__).resolve().parents[1]
MAP_PATH = ROOT / "content/ak-treatment-map.json"
PUBLIC_MAP = ROOT / "public/content/ak-treatment-map.json"
TREATMENT_MAP = ROOT / "content/from-production/treatment-images.json"
PUBLIC_TREATMENT_MAP = ROOT / "public/content/from-production/treatment-images.json"
VISUALS_PATH = ROOT / "content/treatment-visuals.json"
PUBLIC_VISUALS = ROOT / "public/content/treatment-visuals.json"
NAV_PATHS = [
    ROOT / "content/from-production/nav.json",
    ROOT / "public/content/from-production/nav.json",
    ROOT / "content/locales/en/from-production/nav.json",
    ROOT / "public/content/locales/en/from-production/nav.json",
]
LISTING_PATHS = [
    ROOT / "content/behandlingar/listing.json",
    ROOT / "content/locales/en/behandlingar/listing.json",
    ROOT / "public/content/behandlingar/listing.json",
    ROOT / "public/content/locales/en/behandlingar/listing.json",
]
FEATURED_PATHS = [
    ROOT / "content/from-production/home-featured-treatments.json",
    ROOT / "public/content/from-production/home-featured-treatments.json",
    ROOT / "content/locales/en/from-production/home-featured-treatments.json",
    ROOT / "public/content/locales/en/from-production/home-featured-treatments.json",
]
OUT_DIR = ROOT / "reference/webflow-export/images/ak/treatments"
PUBLIC_IMG = ROOT / "public/images/ak/treatments"

SITEMAP = "https://ak.se/treatment-sitemap.xml"
OG_RE = re.compile(
    r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']',
    re.I,
)

NS = {
    "sm": "http://www.sitemaps.org/schemas/sitemap/0.9",
    "img": "http://www.google.com/schemas/sitemap-image/1.1",
}


def slug_from_href(href: str) -> str:
    parts = href.strip("/").split("/")
    return parts[-1] if parts else "treatment"


def ext_from_url(url: str) -> str:
    path = urlparse(url).path.lower()
    for ext in (".jpeg", ".jpg", ".webp", ".png"):
        if path.endswith(ext):
            return ".jpg" if ext == ".jpeg" else ext
    return ".jpg"


def ext_from_content_type(ct: str | None) -> str:
    if not ct:
        return ".jpg"
    ct = ct.split(";")[0].strip().lower()
    return {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/webp": ".webp",
        "image/png": ".png",
    }.get(ct, ".jpg")


def load_sitemap_images(session: requests.Session) -> dict[str, str]:
    r = session.get(SITEMAP, timeout=90)
    r.raise_for_status()
    root = ET.fromstring(r.text)
    out: dict[str, str] = {}
    for url in root.findall("sm:url", NS):
        loc = url.find("sm:loc", NS)
        if loc is None or not loc.text:
            continue
        page = loc.text.rstrip("/") + "/"
        img_el = url.find("img:image/img:loc", NS)
        if img_el is not None and img_el.text:
            out[page] = img_el.text.strip()
    return out


def og_image(session: requests.Session, page_url: str) -> str | None:
    r = session.get(page_url, timeout=90)
    if not r.ok:
        return None
    m = OG_RE.search(r.text)
    return m.group(1).strip() if m else None


def resolve_image_url(
    session: requests.Session, page_url: str, sitemap: dict[str, str]
) -> str | None:
    key = page_url if page_url.endswith("/") else page_url + "/"
    if key in sitemap:
        return sitemap[key]
    return og_image(session, page_url)


def download_image(
    session: requests.Session, image_url: str, dest: Path, force: bool = False
) -> bool:
    if dest.is_file() and dest.stat().st_size > 8000 and not force:
        return True
    r = session.get(image_url, timeout=120)
    if not r.ok or len(r.content) < 2000:
        print(f"    download failed ({r.status_code}) {image_url[:80]}")
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(r.content)
    return True


def sync_nav(by_href: dict[str, str]) -> None:
    for path in NAV_PATHS:
        if not path.is_file():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        changed = False
        for cat in data.get("categories") or []:
            for bucket in ("items", "highlights"):
                for item in cat.get(bucket) or []:
                    href = (item.get("href") or "").rstrip("/")
                    key = href if href.startswith("/") else f"/{href}"
                    img = by_href.get(key)
                    if img and item.get("image") != img:
                        item["image"] = img
                        changed = True
        if changed:
            path.write_text(
                json.dumps(data, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
            print(f"Updated nav → {path.relative_to(ROOT)}")


def sync_home_featured(by_href: dict[str, str]) -> None:
    for path in FEATURED_PATHS:
        if not path.is_file():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        changed = False
        for item in data.get("items") or []:
            href = (item.get("href") or "").rstrip("/")
            key = href if href.startswith("/") else f"/{href}"
            img = by_href.get(key)
            if img and item.get("image") != img:
                item["image"] = img
                changed = True
        if changed:
            path.write_text(
                json.dumps(data, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
            print(f"Updated featured → {path.relative_to(ROOT)}")


def sync_listing(by_href: dict[str, str]) -> None:
    for path in LISTING_PATHS:
        if not path.is_file():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        changed = False
        for cat in data.get("categories") or []:
            for item in cat.get("items") or []:
                href = (item.get("href") or "").rstrip("/")
                key = href if href.startswith("/") else f"/{href}"
                img = by_href.get(key) or by_href.get(href)
                if img and item.get("image") != img:
                    item["image"] = img
                    changed = True
        if changed:
            path.write_text(
                json.dumps(data, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
            print(f"Updated listing → {path.relative_to(ROOT)}")


def main() -> None:
    if not MAP_PATH.is_file():
        raise SystemExit(f"Missing {MAP_PATH}")

    ak_map = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    href_to_page: dict[str, str] = dict(ak_map.get("byHref") or {})

    if not TREATMENT_MAP.is_file():
        raise SystemExit(f"Missing {TREATMENT_MAP}")
    treatment_data = json.loads(TREATMENT_MAP.read_text(encoding="utf-8"))
    by_href: dict[str, str] = dict(treatment_data.get("byHref") or {})
    source_pages: dict[str, str] = dict(treatment_data.get("akSourceByHref") or {})

    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": "Vivaci-AK-Image-Sync/1.0 (local export)",
            "Accept": "text/html,application/xhtml+xml,image/*;q=0.9",
        }
    )

    print("Loading ak.se treatment sitemap…")
    sitemap = load_sitemap_images(session)

    ok, failed = 0, []
    for href, page_url in sorted(href_to_page.items()):
        slug = slug_from_href(href)
        image_url = resolve_image_url(session, page_url, sitemap)
        if not image_url:
            print(f"  no image: {href} ← {page_url}")
            failed.append(href)
            time.sleep(0.15)
            continue

        ext = ext_from_url(image_url)
        rel = f"/images/ak/treatments/{slug}{ext}"
        dest = OUT_DIR / f"{slug}{ext}"

        if not download_image(session, image_url, dest):
            failed.append(href)
            continue

        # Reconcile extension if server served different type
        if not dest.is_file():
            failed.append(href)
            continue

        by_href[href] = rel
        source_pages[href] = page_url
        treatment_data.setdefault("akImageByHref", {})[href] = image_url
        ok += 1
        print(f"  {href} → {rel}")
        time.sleep(0.2)

    treatment_data["byHref"] = by_href
    treatment_data["akSourceByHref"] = source_pages
    treatment_data["akImageSync"] = {
        "source": ak_map.get("source", "https://ak.se"),
        "map": str(MAP_PATH.relative_to(ROOT)),
        "count": ok,
        "failed": failed,
    }
    TREATMENT_MAP.write_text(
        json.dumps(treatment_data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    PUBLIC_TREATMENT_MAP.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(TREATMENT_MAP, PUBLIC_TREATMENT_MAP)
    PUBLIC_MAP.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(MAP_PATH, PUBLIC_MAP)

    if VISUALS_PATH.is_file():
        visuals = json.loads(VISUALS_PATH.read_text(encoding="utf-8"))
        vmap = dict(visuals.get("byHref") or {})
        for href in href_to_page:
            if href in by_href:
                vmap[href] = by_href[href]
        visuals["byHref"] = vmap
        visuals["akImageSync"] = treatment_data.get("akImageSync")
        VISUALS_PATH.write_text(
            json.dumps(visuals, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        if PUBLIC_VISUALS.parent.is_dir():
            shutil.copy2(VISUALS_PATH, PUBLIC_VISUALS)

    PUBLIC_IMG.mkdir(parents=True, exist_ok=True)
    for f in OUT_DIR.iterdir():
        if f.is_file():
            shutil.copy2(f, PUBLIC_IMG / f.name)

    sync_nav(by_href)
    sync_listing(by_href)
    sync_home_featured(by_href)

    print(f"\nDone: {ok} images → {OUT_DIR}")
    if failed:
        print(f"Failed ({len(failed)}):", ", ".join(failed))


if __name__ == "__main__":
    main()
