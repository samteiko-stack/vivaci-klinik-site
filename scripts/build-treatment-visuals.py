#!/usr/bin/env python3
"""
Build cohesive treatment images (one photoshoot) from treatment-visuals.manifest.json.

Downloads Pexels / Freepik frames → reference/webflow-export/images/photoshoot/
Assigns round-robin to every path in treatment-images.json (or nav).
Writes content/treatment-visuals.json (site prefers this over Railway mirror).
"""

from __future__ import annotations

import json
import re
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "content/treatment-visuals.manifest.json"
MAP_PATH = ROOT / "content/from-production/treatment-images.json"
NAV_PATH = ROOT / "content/from-production/nav.json"
OUT_DIR = ROOT / "reference/webflow-export/images/photoshoot"
CATALOG = ROOT / "content/treatment-visuals.json"

PEXELS = "https://images.pexels.com/photos/{id}/pexels-photo-{id}.jpeg"


def slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def collect_hrefs() -> list[str]:
    hrefs: set[str] = set()
    if MAP_PATH.is_file():
        data = json.loads(MAP_PATH.read_text(encoding="utf-8"))
        hrefs.update((data.get("byHref") or {}).keys())
        hrefs.update((data.get("remoteByHref") or {}).keys())
    if NAV_PATH.is_file():
        nav = json.loads(NAV_PATH.read_text(encoding="utf-8"))
        for cat in nav.get("categories") or []:
            for item in cat.get("items") or []:
                h = item.get("href")
                if h and h.startswith("/") and h.count("/") >= 2:
                    hrefs.add(h.rstrip("/"))
    return sorted(hrefs)


def download_frame(session: requests.Session, frame: dict) -> tuple[str, bytes] | None:
    source = frame.get("source", "pexels")
    if source == "pexels":
        pid = frame.get("photoId")
        if not pid:
            return None
        url = PEXELS.format(id=pid) + "?auto=compress&cs=tinysrgb&w=1400"
    elif source == "freepik":
        url = (frame.get("url") or "").strip()
        if not url:
            return None
    else:
        url = (frame.get("url") or "").strip()
        if not url:
            return None

    r = session.get(url, timeout=90)
    if not r.ok:
        print(f"    skip {frame.get('id')} ({r.status_code})")
        return None
    ext = ".webp" if "webp" in r.headers.get("content-type", "") else ".jpg"
    return ext, r.content


def main() -> None:
    if not MANIFEST.is_file():
        raise SystemExit(f"Missing {MANIFEST}")

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    frames = [f for f in manifest.get("frames") or [] if f.get("id")]
    if not frames:
        raise SystemExit("No frames in manifest")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers["User-Agent"] = "Vivaci-Photoshoot/1.0"
    session.headers["Referer"] = "https://www.pexels.com/"
    session.headers["Accept"] = "image/*"

    frame_paths: list[dict] = []
    for frame in frames:
        fid = frame["id"]
        print(f"  {fid} ({frame.get('source')})")
        got = download_frame(session, frame)
        if not got:
            continue
        ext, body = got
        filename = f"{slug(fid)}{ext}"
        (OUT_DIR / filename).write_bytes(body)
        frame_paths.append(
            {
                "id": fid,
                "path": f"/images/photoshoot/{filename}",
                "source": frame.get("source"),
                "label": frame.get("label", ""),
                "attribution": frame.get("attribution")
                or (
                    f"Pexels #{frame['photoId']}"
                    if frame.get("source") == "pexels"
                    else frame.get("source", "")
                ),
            }
        )
        time.sleep(0.15)

    if not frame_paths:
        raise SystemExit("No frames downloaded — check manifest URLs/IDs")

    hrefs = collect_hrefs()
    problem_mode = manifest.get("problemImages", "photoshoot")
    by_href: dict[str, str] = {}
    railway = json.loads(MAP_PATH.read_text(encoding="utf-8")) if MAP_PATH.is_file() else {}
    railway_by = railway.get("byHref") or {}

    idx = 0
    for href in hrefs:
        if problem_mode == "clinical" and href.startswith("/problem/"):
            if href in railway_by:
                by_href[href] = railway_by[href]
            continue
        by_href[href] = frame_paths[idx % len(frame_paths)]["path"]
        idx += 1

    catalog = {
        "photoshootId": manifest.get("photoshootId"),
        "description": manifest.get("description"),
        "frames": frame_paths,
        "byHref": by_href,
    }
    CATALOG.write_text(json.dumps(catalog, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nAssigned {len(by_href)} paths → {CATALOG}")
    print(f"Images → {OUT_DIR}")


if __name__ == "__main__":
    main()
