#!/usr/bin/env python3
"""
Assign each treatment (behandlingar + plastikkirurgi) a stable random beige Pexels image.

Downloads → reference/webflow-export/images/pexels/treatments/{slug}.jpg
Updates → content/from-production/treatment-images.json (+ public mirror)
Leaves /problem/* on existing clinical paths.
"""

from __future__ import annotations

import hashlib
import json
import shutil
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
POOL_PATH = ROOT / "content/pexels-beige-pool.json"
MAP_PATH = ROOT / "content/from-production/treatment-images.json"
PUBLIC_MAP = ROOT / "public/content/from-production/treatment-images.json"
VISUALS_PATH = ROOT / "content/treatment-visuals.json"
PUBLIC_VISUALS = ROOT / "public/content/treatment-visuals.json"
OUT_DIR = ROOT / "reference/webflow-export/images/pexels/treatments"
PUBLIC_IMG = ROOT / "public/images/pexels/treatments"
PEXELS_IMG = "https://images.pexels.com/photos/{id}/pexels-photo-{id}.jpeg?auto=compress&cs=tinysrgb&w=1400"


def slug_from_href(href: str) -> str:
    parts = href.strip("/").split("/")
    return parts[-1] if parts else "treatment"


def pick_photo_ids(href: str, pool: list[int]) -> list[int]:
    digest = hashlib.sha256(href.encode("utf-8")).hexdigest()
    start = int(digest[:8], 16) % len(pool)
    return [pool[(start + i) % len(pool)] for i in range(min(8, len(pool)))]


def should_pexels(href: str) -> bool:
    return href.startswith("/behandlingar/") or href.startswith("/plastikkirurgi")


def download(session: requests.Session, photo_id: int, dest: Path) -> bool:
    if dest.is_file() and dest.stat().st_size > 10_000:
        return True
    url = PEXELS_IMG.format(id=photo_id)
    r = session.get(url, timeout=90)
    if not r.ok:
        print(f"    failed {photo_id} ({r.status_code})")
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(r.content)
    return True


def main() -> None:
    if not POOL_PATH.is_file():
        raise SystemExit(f"Missing {POOL_PATH}")
    if not MAP_PATH.is_file():
        raise SystemExit(f"Missing {MAP_PATH}")

    pool = json.loads(POOL_PATH.read_text(encoding="utf-8")).get("photoIds") or []
    pool = sorted({int(x) for x in pool})
    if len(pool) < 10:
        raise SystemExit("Beige pool too small")

    data = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    by_href: dict[str, str] = dict(data.get("byHref") or {})

    session = requests.Session()
    session.headers["User-Agent"] = "Vivaci-Treatment-Pexels/1.0"
    session.headers["Accept"] = "image/*"

    cache: dict[int, bytes] = {}
    updated = 0
    failed: list[str] = []

    for href in sorted(by_href.keys()):
        if not should_pexels(href):
            continue
        slug = slug_from_href(href)
        rel = f"/images/pexels/treatments/{slug}.jpg"
        dest = OUT_DIR / f"{slug}.jpg"

        photo_id = None
        for candidate in pick_photo_ids(href, pool):
            if candidate in cache:
                photo_id = candidate
                break
            if download(session, photo_id=candidate, dest=dest):
                cache[candidate] = dest.read_bytes()
                photo_id = candidate
                time.sleep(0.12)
                break
        if photo_id is None:
            failed.append(href)
            continue
        if not dest.is_file():
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(cache[photo_id])

        if by_href.get(href) != rel:
            by_href[href] = rel
            updated += 1
        else:
            by_href[href] = rel

    data["byHref"] = by_href
    data["treatmentPexels"] = {
        "source": "pexels-beige-pool",
        "assignedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "count": sum(1 for k in by_href if should_pexels(k)),
    }
    MAP_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    PUBLIC_MAP.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(MAP_PATH, PUBLIC_MAP)

    if VISUALS_PATH.is_file():
        visuals = json.loads(VISUALS_PATH.read_text(encoding="utf-8"))
        vmap = dict(visuals.get("byHref") or {})
        for href, path in by_href.items():
            if should_pexels(href):
                vmap[href] = path
        visuals["byHref"] = vmap
        visuals["treatmentPexels"] = data.get("treatmentPexels")
        VISUALS_PATH.write_text(
            json.dumps(visuals, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        if PUBLIC_VISUALS.parent.is_dir():
            shutil.copy2(VISUALS_PATH, PUBLIC_VISUALS)

    if PUBLIC_IMG.parent.parent.exists():
        PUBLIC_IMG.mkdir(parents=True, exist_ok=True)
        for jpg in OUT_DIR.glob("*.jpg"):
            shutil.copy2(jpg, PUBLIC_IMG / jpg.name)

    print(f"Pexels treatments: {len(cache)} unique photos, {updated} hrefs updated")
    print(f"Images → {OUT_DIR}")
    print(f"Map → {MAP_PATH}")
    if failed:
        print(f"Failed ({len(failed)}):", ", ".join(failed[:5]), "…" if len(failed) > 5 else "")


if __name__ == "__main__":
    main()
