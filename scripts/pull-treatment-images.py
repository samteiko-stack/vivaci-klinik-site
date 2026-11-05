#!/usr/bin/env python3
"""Pull per-path hero/card images from Railway production (same URLs the live site uses)."""

from __future__ import annotations

import json
import re
import time
from pathlib import Path
from urllib.parse import unquote

import requests
from bs4 import BeautifulSoup

BASE = "https://vivaci-klinik-production.up.railway.app"
ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "content/from-production"
MANIFEST = OUT_DIR / "manifest.json"
NAV_PATH = OUT_DIR / "nav.json"

SKIP_URL_PARTS = ("logo", "favicon", "icon", "webclip")


def extract_page_image(html: str) -> str | None:
    for m in re.finditer(r'/_next/image\?url=([^&"\']+)', html):
        url = unquote(m.group(1))
        if any(part in url.lower() for part in SKIP_URL_PARTS):
            continue
        return url
    soup = BeautifulSoup(html, "html.parser")
    for el in soup.find_all(style=True):
        m = re.search(r'background-image:\s*url\(["\']?([^"\')]+)', el.get("style", ""))
        if not m:
            continue
        url = m.group(1)
        if any(part in url.lower() for part in SKIP_URL_PARTS):
            continue
        return url
    return None


def card_image_from_anchor(anchor) -> str | None:
    el = anchor
    for _ in range(14):
        if not el:
            break
        nodes = [el]
        if hasattr(el, "find_all"):
            nodes.extend(el.find_all(style=True))
        for node in nodes:
            st = node.get("style", "") if hasattr(node, "get") else ""
            m = re.search(r'background-image:\s*url\(["\']?([^"\')]+)', st)
            if not m:
                continue
            url = m.group(1)
            if any(part in url.lower() for part in SKIP_URL_PARTS):
                continue
            return url
        el = el.parent
    return None


def parse_home_featured(html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    for h2 in soup.find_all("h2"):
        if h2.get_text(strip=True) != "Utvalda behandlingar":
            continue
        section = h2.find_parent("section")
        if not section:
            break
        items: list[dict] = []
        seen: set[str] = set()
        for a in section.find_all("a", href=True):
            href = a["href"]
            if not href.startswith("/behandlingar/") or href == "/behandlingar":
                continue
            if href in seen:
                continue
            seen.add(href)
            name = a.get_text(" ", strip=True)
            if not name:
                continue
            items.append(
                {
                    "name": name,
                    "href": href,
                    "slug": href.rstrip("/").split("/")[-1],
                    "image": card_image_from_anchor(a),
                }
            )
        cta = {"label": "Se alla behandlingar", "href": "/behandlingar"}
        for link in section.find_all("a", href=True):
            if "Se alla" in link.get_text(strip=True):
                cta = {
                    "label": link.get_text(" ", strip=True).replace("→", "").strip(),
                    "href": link["href"],
                }
                break
        return {
            "sourceUrl": f"{BASE}/",
            "heading": "Utvalda behandlingar",
            "cta": cta,
            "items": items,
        }
    return {"sourceUrl": f"{BASE}/", "heading": "Utvalda behandlingar", "items": []}


def collect_paths() -> list[str]:
    paths: set[str] = set()
    if MANIFEST.is_file():
        data = json.loads(MANIFEST.read_text(encoding="utf-8"))
        for p in data.get("paths") or []:
            if re.match(r"^/(behandlingar|problem|plastikkirurgi)/[^/]+$", p):
                paths.add(p)
    if NAV_PATH.is_file():
        nav = json.loads(NAV_PATH.read_text(encoding="utf-8"))
        for cat in nav.get("categories") or []:
            for item in cat.get("items") or []:
                href = item.get("href")
                if href and href.startswith("/"):
                    paths.add(href.rstrip("/") or href)
    return sorted(paths)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers["User-Agent"] = "Vivaci-Treatment-Images/1.0"

    home_html = session.get(BASE + "/", timeout=45).text
    featured = parse_home_featured(home_html)
    (OUT_DIR / "home-featured-treatments.json").write_text(
        json.dumps(featured, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"home-featured-treatments: {len(featured.get('items', []))} items")

    by_href: dict[str, str] = {}
    paths = collect_paths()
    print(f"Fetching images for {len(paths)} paths…")
    for path in paths:
        try:
            html = session.get(BASE + path, timeout=45).text
        except requests.RequestException as exc:
            print(f"  skip {path}: {exc}")
            continue
        img = extract_page_image(html)
        if img:
            by_href[path] = img
        time.sleep(0.1)

    for item in featured.get("items") or []:
        href = item.get("href")
        if href and item.get("image"):
            by_href.setdefault(href, item["image"])

    doc = {
        "sourceUrl": BASE,
        "byHref": by_href,
    }
    (OUT_DIR / "treatment-images.json").write_text(
        json.dumps(doc, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"treatment-images.json: {len(by_href)} entries → {OUT_DIR}")


if __name__ == "__main__":
    main()
