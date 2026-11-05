#!/usr/bin/env python3
"""
Download non-treatment stock images (Unsplash / Pexels / manual Freepik URL).
Treatment cards use Railway — see pull-treatment-images.py.
"""

from __future__ import annotations

import json
import re
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "reference/webflow-export/images/stock"
CATALOG = ROOT / "content/placeholders.json"

# Direct download URLs — matched to slot purpose (not generic stock roulette).
SLOTS: dict[str, dict] = {
    "hero-clinic": {
        "source": "unsplash",
        "url": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=2400&q=85",
        "label": "Clinic environment",
    },
    "section-plastikkirurgi": {
        "source": "unsplash",
        "url": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=85",
        "label": "Medical consultation",
    },
    "section-method": {
        "source": "unsplash",
        "url": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1200&q=85",
        "label": "Calm clinical care",
    },
    "team-1": {
        "source": "unsplash",
        "url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=85",
        "label": "Professional portrait",
    },
    "team-2": {
        "source": "unsplash",
        "url": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=85",
        "label": "Professional portrait",
    },
    "team-3": {
        "source": "unsplash",
        "url": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=800&q=85",
        "label": "Professional portrait",
    },
    "team-4": {
        "source": "unsplash",
        "url": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&q=85",
        "label": "Professional portrait",
    },
    "blog-1": {
        "source": "unsplash",
        "url": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1600&q=85",
        "label": "Wellness editorial",
    },
    "blog-2": {
        "source": "unsplash",
        "url": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1600&q=85",
        "label": "Skincare editorial",
    },
    "blog-3": {
        "source": "unsplash",
        "url": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1600&q=85",
        "label": "Beauty editorial",
    },
    "blog-4": {
        "source": "unsplash",
        "url": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=85",
        "label": "Spa editorial",
    },
    "blog-nav-1": {
        "source": "unsplash",
        "url": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=85",
        "label": "Nav blog thumb",
    },
    "blog-nav-2": {
        "source": "unsplash",
        "url": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=600&q=85",
        "label": "Nav blog thumb",
    },
    "cta-bottom": {
        "source": "unsplash",
        "url": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=2400&q=85",
        "label": "Booking CTA background",
    },
    "blog-author": {
        "source": "unsplash",
        "url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=85",
        "label": "Author portrait",
    },
    "product-1": {
        "source": "unsplash",
        "url": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=800&q=85",
        "label": "Skincare product",
    },
    "product-2": {
        "source": "unsplash",
        "url": "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=800&q=85",
        "label": "Serum bottle",
    },
    "product-3": {
        "source": "unsplash",
        "url": "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=85",
        "label": "Cosmetic jars",
    },
    "product-4": {
        "source": "unsplash",
        "url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=85",
        "label": "Cream product",
    },
    "product-5": {
        "source": "unsplash",
        "url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=85",
        "label": "Bathroom shelf products",
    },
    "product-6": {
        "source": "unsplash",
        "url": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=85",
        "label": "Skincare flat lay",
    },
    "product-7": {
        "source": "unsplash",
        "url": "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=85",
        "label": "Dropper bottle",
    },
    "product-8": {
        "source": "unsplash",
        "url": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=85",
        "label": "Beauty product",
    },
}


def ext_from_url(url: str) -> str:
    if ".webp" in url:
        return "webp"
    return "jpg"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers["User-Agent"] = "Vivaci-Stock-Fetch/1.0"
    session.headers["Referer"] = "https://unsplash.com/"
    session.headers["Accept"] = "image/*"

    catalog: dict = {
        "note": "Non-treatment slots only. Treatments use content/from-production/treatment-images.json.",
        "items": {},
        "pools": {
            "team": ["team-1", "team-2", "team-3", "team-4"],
            "blogCarousel": ["blog-1", "blog-2", "blog-3", "blog-4"],
            "navBlog": ["blog-nav-1", "blog-nav-2"],
            "products": [
                "product-1",
                "product-2",
                "product-3",
                "product-4",
                "product-5",
                "product-6",
                "product-7",
                "product-8",
            ],
        },
    }

    for slot_id, meta in SLOTS.items():
        url = meta["url"]
        ext = ext_from_url(url)
        filename = f"{slot_id}.{ext}"
        dest = OUT / filename
        print(f"  {slot_id} ← {meta['source']}")
        r = session.get(url, timeout=90)
        if not r.ok:
            print(f"    skip ({r.status_code})")
            continue
        dest.write_bytes(r.content)
        catalog["items"][slot_id] = {
            "path": f"/images/stock/{filename}",
            "source": meta["source"],
            "remoteUrl": url,
            "label": meta["label"],
        }
        time.sleep(0.2)

    CATALOG.write_text(json.dumps(catalog, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nWrote {len(catalog['items'])} files → {OUT}")
    print(f"Catalog → {CATALOG}")


if __name__ == "__main__":
    main()
