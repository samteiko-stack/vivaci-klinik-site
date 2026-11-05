#!/usr/bin/env python3
"""Pull Varumärken logos from Railway production into local JSON + images."""

from __future__ import annotations

import json
import re
import time
from html import unescape
from pathlib import Path
from urllib.parse import unquote
from urllib.request import Request, urlopen

BASE = "https://vivaci-klinik-production.up.railway.app"
ROOT = Path(__file__).resolve().parents[1]
OUT_JSON = ROOT / "content/from-production/home-brands.json"
OUT_DIR = ROOT / "reference/webflow-export/images/railway/brands"


def fetch_html() -> str:
    req = Request(f"{BASE}/", headers={"User-Agent": "Vivaci-Webflow-Migration/1.0"})
    return unescape(urlopen(req, timeout=45).read().decode("utf-8", errors="replace"))


def parse_brands(html: str) -> tuple[str, list[dict]]:
    idx = html.find("Varumärken")
    if idx < 0:
        raise SystemExit("Varumärken heading not found on production homepage")
    chunk = html[idx : idx + 100_000]

    sub = re.search(
        r"Varumärken</h2>\s*<p[^>]*>([^<]+)",
        chunk,
        re.DOTALL | re.IGNORECASE,
    )
    subtitle = (
        sub.group(1).strip()
        if sub
        else "Vi arbetar endast med ledande produkter och teknologier"
    )

    items: list[dict] = []
    seen: set[str] = set()
    for alt, src in re.findall(r'alt="([^"]*)"[^>]*src="([^"]+)"', chunk):
        if "brands%2F" not in src and "/assets/brands/" not in src:
            continue
        m = re.search(r"brands%2F([^&]+)|/assets/brands/([^\"?]+)", src)
        if not m:
            continue
        filename = unquote(m.group(1) or m.group(2))
        if filename in seen:
            continue
        seen.add(filename)
        slug = re.sub(r"\.[^.]+$", "", filename).lower()
        items.append(
            {
                "name": alt.strip() or slug,
                "slug": slug,
                "remote": f"{BASE}/assets/brands/{filename}",
            }
        )

    if not items:
        raise SystemExit("No brand logos found in Varumärken section")
    return subtitle, items


def download(url: str, dest: Path) -> None:
    req = Request(url, headers={"User-Agent": "Vivaci-Mirror/1.0", "Referer": f"{BASE}/"})
    data = urlopen(req, timeout=60).read()
    dest.write_bytes(data)


def main() -> None:
    subtitle, items = parse_brands(fetch_html())
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for item in items:
        filename = item["remote"].rsplit("/", 1)[-1]
        local = OUT_DIR / filename
        if not local.is_file():
            try:
                download(item["remote"], local)
                print(f"saved {local.name}")
            except OSError as exc:
                print(f"skip {filename}: {exc}")
            time.sleep(0.08)
        item["image"] = f"/images/railway/brands/{filename}"
        del item["remote"]

    payload = {
        "heading": "Varumärken",
        "subtitle": subtitle,
        "items": items,
    }
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(items)} brands → {OUT_JSON.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
