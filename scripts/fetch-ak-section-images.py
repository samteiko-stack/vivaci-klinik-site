#!/usr/bin/env python3
"""Homepage sections + experter (team) images from ak.se → placeholders.json."""

from __future__ import annotations

import json
import re
import shutil
from pathlib import Path
from urllib.parse import urlparse

import requests

ROOT = Path(__file__).resolve().parents[1]
MAP_PATH = ROOT / "content/ak-section-map.json"
PLACEHOLDERS = [
    ROOT / "content/placeholders.json",
    ROOT / "public/content/placeholders.json",
    ROOT / "content/locales/en/placeholders.json",
    ROOT / "public/content/locales/en/placeholders.json",
]
SECTION_OUT = ROOT / "reference/webflow-export/images/ak/sections"
TEAM_OUT = ROOT / "reference/webflow-export/images/ak/team"
CTA_OUT = ROOT / "reference/webflow-export/images/ak/cta"
PUBLIC_SECTION = ROOT / "public/images/ak/sections"
PUBLIC_TEAM = ROOT / "public/images/ak/team"
PUBLIC_CTA = ROOT / "public/images/ak/cta"

OG_RE = re.compile(
    r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']',
    re.I,
)
HEADER6_IMG_RE = re.compile(
    r"<img\b[^>]*\bclass=[\"']header6_background-image[\"'][^>]*>",
    re.I,
)


def ext_from_url(url: str) -> str:
    path = urlparse(url.split("?")[0]).path.lower()
    for ext in (".jpeg", ".jpg", ".webp", ".png"):
        if path.endswith(ext):
            return ".jpg" if ext == ".jpeg" else ext
    return ".jpg"


def og_image(session: requests.Session, page_url: str) -> str | None:
    r = session.get(page_url, timeout=90)
    if not r.ok:
        return None
    m = OG_RE.search(r.text)
    return m.group(1).strip() if m else None


def download_slot(
    session: requests.Session,
    slot_id: str,
    meta: dict,
    dest_dir: Path,
    url_prefix: str,
) -> str | None:
    img_url = (meta.get("imageUrl") or "").strip() or None
    page = meta.get("pageUrl")
    if not img_url and page:
        img_url = og_image(session, page)
    if not img_url:
        print(f"  skip {slot_id}: no og:image")
        return None
    ext = ext_from_url(img_url)
    rel = f"{url_prefix}/{slot_id}{ext}"
    dest = dest_dir / f"{slot_id}{ext}"
    r = session.get(img_url, timeout=120)
    if (not r.ok or len(r.content) < 1500) and img_url.endswith(".jpg"):
        alt = img_url[:-4] + ".png"
        r = session.get(alt, timeout=120)
        if r.ok and len(r.content) >= 1500:
            img_url = alt
    if not r.ok or len(r.content) < 1500:
        print(f"  skip {slot_id}: download failed")
        return None
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(r.content)
    meta["imageUrl"] = img_url
    meta["path"] = rel
    print(f"  {slot_id} → {rel}")
    return rel


def patch_header6_cta_src(cta_path: str) -> int:
    """Default src for bottom booking band (before placeholders.js hydrates)."""
    replacement = (
        f'<img alt="" src="{cta_path}" loading="eager" class="header6_background-image">'
    )
    touched = 0
    for base in (ROOT / "reference/webflow-export", ROOT / "public"):
        if not base.is_dir():
            continue
        for html in base.rglob("*.html"):
            if "node_modules" in html.parts:
                continue
            text = html.read_text(encoding="utf-8")
            if "header6_background-image" not in text:
                continue
            new_text, n = HEADER6_IMG_RE.subn(replacement, text)
            if n:
                html.write_text(new_text, encoding="utf-8")
                touched += 1
                print(f"  header6 default ← {html.relative_to(ROOT)} ({n})")
    return touched


def main() -> None:
    data = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    sections = data.get("sections") or {}
    team = data.get("team") or {}
    cta = data.get("cta") or {}

    session = requests.Session()
    session.headers["User-Agent"] = "Vivaci-AK-Section-Images/1.0"

    paths_by_id: dict[str, str] = {}

    for section_id, meta in sections.items():
        rel = download_slot(
            session, section_id, meta, SECTION_OUT, "/images/ak/sections"
        )
        if rel:
            paths_by_id[section_id] = rel

    for team_id, meta in team.items():
        rel = download_slot(session, team_id, meta, TEAM_OUT, "/images/ak/team")
        if rel:
            paths_by_id[team_id] = rel

    for cta_id, meta in cta.items():
        rel = download_slot(session, cta_id, meta, CTA_OUT, "/images/ak/cta")
        if rel:
            paths_by_id[cta_id] = rel

    MAP_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    shutil.copy2(MAP_PATH, ROOT / "public/content/ak-section-map.json")

    for src_dir, pub_dir in (
        (SECTION_OUT, PUBLIC_SECTION),
        (TEAM_OUT, PUBLIC_TEAM),
        (CTA_OUT, PUBLIC_CTA),
    ):
        if not src_dir.is_dir():
            continue
        pub_dir.mkdir(parents=True, exist_ok=True)
        for f in src_dir.iterdir():
            if f.is_file():
                shutil.copy2(f, pub_dir / f.name)

    cta_path = paths_by_id.get("cta-bottom")
    if cta_path:
        patch_header6_cta_src(cta_path)

    all_meta = {**sections, **team, **cta}
    for ph_path in PLACEHOLDERS:
        if not ph_path.is_file():
            continue
        catalog = json.loads(ph_path.read_text(encoding="utf-8"))
        items = catalog.setdefault("items", {})
        for slot_id, rel in paths_by_id.items():
            meta = all_meta.get(slot_id) or {}
            entry = dict(items.get(slot_id) or {})
            entry.update(
                {
                    "path": rel,
                    "source": "ak.se",
                    "pageUrl": meta.get("pageUrl"),
                    "label": meta.get("label", slot_id),
                    "attribution": "Akademikliniken (ak.se)",
                }
            )
            items[slot_id] = entry
        ph_path.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"Updated {ph_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
