#!/usr/bin/env python3
"""
Download curated placeholder photos from Pexels into the Webflow export.

Requires a free API key: https://www.pexels.com/api/
  export PEXELS_API_KEY=your_key

Uses content/pexels-manifest.json for search queries.
Writes images under reference/webflow-export/images/pexels/
and content/placeholders.json (paths + photographer credit for attribution).

Pexels license: https://www.pexels.com/license/ — free for commercial use;
credit is appreciated (we store it in placeholders.json).
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

import requests

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "content" / "pexels-manifest.json"
API = "https://api.pexels.com/v1/search"


def slug(s: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s[:60] or "photo"


def pick_photo(results: list, orientation: str | None) -> dict | None:
    for photo in results:
        if orientation and photo.get("width", 0) < photo.get("height", 0):
            if orientation == "landscape":
                continue
        if orientation and photo.get("width", 0) > photo.get("height", 0):
            if orientation == "portrait":
                continue
        return photo
    return results[0] if results else None


def main() -> None:
    key = os.environ.get("PEXELS_API_KEY", "").strip()
    if not key:
        print("Set PEXELS_API_KEY (https://www.pexels.com/api/)", file=sys.stderr)
        sys.exit(1)

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    out_dir = ROOT / manifest.get("outputDir", "reference/webflow-export/images/pexels")
    out_dir.mkdir(parents=True, exist_ok=True)

    session = requests.Session()
    session.headers["Authorization"] = key

    catalog: dict = {
        "source": "https://www.pexels.com",
        "fetchedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "items": {},
    }

    for item in manifest.get("items", []):
        item_id = item["id"]
        query = item["query"]
        orientation = item.get("orientation")
        print(f"  {item_id}: {query!r}")

        r = session.get(
            API,
            params={"query": query, "per_page": 15, "page": 1},
            timeout=30,
        )
        r.raise_for_status()
        photos = r.json().get("photos") or []
        photo = pick_photo(photos, orientation)
        if not photo:
            print(f"    no results, skip")
            continue

        src = photo.get("src") or {}
        url = src.get("large2x") or src.get("large") or src.get("original")
        if not url:
            print(f"    no url, skip")
            continue

        ext = Path(urlparse(url).path).suffix or ".jpg"
        filename = f"{slug(item_id)}{ext}"
        dest = out_dir / filename

        img = session.get(url, timeout=60)
        img.raise_for_status()
        dest.write_bytes(img.content)

        photographer = photo.get("photographer") or "Unknown"
        photo_url = photo.get("url") or ""
        catalog["items"][item_id] = {
            "path": f"/images/pexels/{filename}",
            "pexelsId": photo.get("id"),
            "query": query,
            "photographer": photographer,
            "photographerUrl": photo.get("photographer_url"),
            "photoUrl": photo_url,
            "attribution": f"Photo by {photographer} on Pexels",
        }
        time.sleep(0.4)

    catalog_path = ROOT / manifest.get("catalogFile", "content/placeholders.json")
    catalog_path.write_text(json.dumps(catalog, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nWrote {len(catalog['items'])} images → {out_dir}")
    print(f"Catalog → {catalog_path}")


if __name__ == "__main__":
    main()
