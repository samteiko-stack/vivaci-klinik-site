#!/usr/bin/env python3
"""Download curated Pexels photos by ID (no API key). Updates content/placeholders.json."""

from __future__ import annotations

import json
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "reference/webflow-export/images/pexels"
CATALOG = ROOT / "content/placeholders.json"

# Photo IDs from pexels.com — aesthetic / clinic / team / editorial
CURATED: dict[str, dict] = {
    "hero-clinic": {"photoId": 5069437, "query": "luxury spa clinic interior"},
    "treatment-card-1": {"photoId": 5478164, "query": "facial skin treatment"},
    "treatment-card-2": {"photoId": 4021775, "query": "skincare professional"},
    "treatment-card-3": {"photoId": 3865929, "query": "cosmetic treatment clinic"},
    "treatment-card-4": {"photoId": 6621337, "query": "aesthetic medicine"},
    "treatment-card-5": {"photoId": 4140296, "query": "dermatology care"},
    "featured-treatment-1": {"photoId": 7089019, "query": "hydrafacial style treatment"},
    "featured-treatment-2": {"photoId": 3756111, "query": "injectable aesthetic care"},
    "featured-treatment-3": {"photoId": 5327585, "query": "glowing skin treatment"},
    "featured-treatment-4": {"photoId": 3993449, "query": "wellness clinic"},
    "section-plastikkirurgi": {"photoId": 4021775, "query": "medical consultation"},
    "section-method": {"photoId": 3865929, "query": "calm clinic environment"},
    "team-1": {"photoId": 1181519, "query": "professional portrait woman"},
    "team-2": {"photoId": 91227, "query": "professional portrait man"},
    "team-3": {"photoId": 774909, "query": "professional woman portrait"},
    "team-4": {"photoId": 2379004, "query": "professional man portrait"},
    "blog-1": {"photoId": 3825573, "query": "health wellness editorial"},
    "blog-2": {"photoId": 4041392, "query": "skincare routine editorial"},
    "blog-3": {"photoId": 3762873, "query": "self care editorial"},
    "blog-4": {"photoId": 5215022, "query": "medical wellness editorial"},
    "blog-nav-1": {"photoId": 3825573, "query": "nav blog thumb"},
    "blog-nav-2": {"photoId": 4041392, "query": "nav blog thumb"},
    "cta-bottom": {"photoId": 5478164, "query": "booking consultation bg"},
    "blog-author": {"photoId": 1181519, "query": "author portrait"},
    "product-1": {"photoId": 4041392, "query": "skincare product"},
    "product-2": {"photoId": 4467687, "query": "beauty product flat lay"},
    "product-3": {"photoId": 3685530, "query": "cosmetic serum bottle"},
    "product-4": {"photoId": 6633914, "query": "skincare bottles"},
    "product-5": {"photoId": 3373736, "query": "wellness product"},
    "product-6": {"photoId": 3865679, "query": "spa product"},
    "product-7": {"photoId": 3785147, "query": "cream jar skincare"},
    "product-8": {"photoId": 4041391, "query": "beauty routine product"},
}

PEXELS_IMG = "https://images.pexels.com/photos/{id}/pexels-photo-{id}.jpeg"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers["User-Agent"] = "Vivaci-Placeholder-Fetch/1.0"

    catalog: dict = {
        "source": "https://www.pexels.com",
        "license": "https://www.pexels.com/license/",
        "items": {},
        "pools": {
            "treatmentFinderCards": [
                "treatment-card-1",
                "treatment-card-2",
                "treatment-card-3",
                "treatment-card-4",
                "treatment-card-5",
            ],
            "featuredTreatmentsSlider": [
                "featured-treatment-1",
                "featured-treatment-2",
                "featured-treatment-3",
                "featured-treatment-4",
            ],
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

    for slot_id, meta in CURATED.items():
        pid = meta["photoId"]
        url = PEXELS_IMG.format(id=pid) + "?auto=compress&cs=tinysrgb&w=1920"
        filename = f"{slot_id}.jpg"
        dest = OUT / filename
        print(f"  {slot_id} ← photo {pid}")
        r = session.get(url, timeout=90)
        if not r.ok:
            print(f"    skip ({r.status_code})")
            continue
        dest.write_bytes(r.content)
        catalog["items"][slot_id] = {
            "path": f"/images/pexels/{filename}",
            "pexelsPhotoId": pid,
            "query": meta["query"],
            "attribution": f"Photo on Pexels (#{pid})",
        }
        time.sleep(0.25)

    CATALOG.write_text(json.dumps(catalog, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nWrote {len(catalog['items'])} files → {OUT}")
    print(f"Catalog → {CATALOG}")


if __name__ == "__main__":
    main()
