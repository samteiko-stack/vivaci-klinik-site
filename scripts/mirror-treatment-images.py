#!/usr/bin/env python3
"""Download Railway treatment images into reference/webflow-export/images/railway/."""

from __future__ import annotations

import json
import re
import time
from pathlib import Path
from urllib.parse import urlparse

import requests

ROOT = Path(__file__).resolve().parents[1]
MAP_PATH = ROOT / "content/from-production/treatment-images.json"
OUT = ROOT / "reference/webflow-export/images/railway"


def slug_from_href(href: str) -> str:
    return href.strip("/").replace("/", "-")


def ext_from_url(url: str, content_type: str) -> str:
    path = urlparse(url).path.lower()
    if path.endswith(".webp"):
        return ".webp"
    if path.endswith(".png"):
        return ".png"
    if "webp" in content_type:
        return ".webp"
    return ".jpg"


def main() -> None:
    if not MAP_PATH.is_file():
        raise SystemExit(f"Missing {MAP_PATH} — run pull-treatment-images.py first")

    data = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    by_href: dict[str, str] = dict(data.get("byHref") or {})
    remote = dict(data.get("remoteByHref") or {})
    for href, url in by_href.items():
        if url.startswith("/images/railway/"):
            remote.setdefault(href, url)
            continue
        remote[href] = url

    OUT.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers["User-Agent"] = "Vivaci-Mirror/1.0"
    session.headers["Referer"] = "https://vivaci-klinik-production.up.railway.app/"

    local: dict[str, str] = {}
    for href, url in sorted(remote.items()):
        if not url or url.startswith("/images/"):
            local[href] = url
            continue
        try:
            r = session.get(url, timeout=90)
            r.raise_for_status()
        except requests.RequestException as exc:
            print(f"  skip {href}: {exc}")
            continue
        ext = ext_from_url(url, r.headers.get("content-type", ""))
        filename = f"{slug_from_href(href)}{ext}"
        dest = OUT / filename
        dest.write_bytes(r.content)
        local[href] = f"/images/railway/{filename}"
        print(f"  {href} → {filename}")
        time.sleep(0.08)

    out_doc = {
        "sourceUrl": data.get("sourceUrl"),
        "remoteByHref": remote,
        "byHref": local,
    }
    MAP_PATH.write_text(json.dumps(out_doc, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nMirrored {len(local)} images → {OUT}")


if __name__ == "__main__":
    main()
