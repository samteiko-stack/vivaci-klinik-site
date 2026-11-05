#!/usr/bin/env python3
"""Build content/prislista.json from treatment-prices.json + listing labels."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRICES_PATH = ROOT / "content" / "treatment-prices.json"
LISTING_PATH = ROOT / "content" / "behandlingar" / "listing.json"
OUT_PATH = ROOT / "content" / "prislista.json"
TREATMENT_PAGES = ROOT / "content" / "treatment-pages"


def format_display_price(raw: str) -> str:
    v = (raw or "").strip()
    if not v:
        return "—"
    if re.search(r"\d", v) and not re.match(r"^fr\.?\s", v, re.I):
        return f"fr. {v}"
    return v


def title_for_path(path: str) -> str:
    parts = path.strip("/").split("/")
    if len(parts) < 2:
        return path
    category, slug = parts[0], parts[-1]
    page = TREATMENT_PAGES / category / f"{slug}.json"
    if page.is_file():
        data = json.loads(page.read_text(encoding="utf-8"))
        if data.get("title"):
            return str(data["title"])
    return slug.replace("-", " ").title()


def main() -> None:
    prices = json.loads(PRICES_PATH.read_text(encoding="utf-8"))
    by_path: dict[str, str] = dict(prices.get("byPath") or {})
    defaults = prices.get("defaults") or {}

    sections: list[dict] = []

    if LISTING_PATH.is_file():
        listing = json.loads(LISTING_PATH.read_text(encoding="utf-8"))
        for cat in listing.get("categories") or []:
            title = (cat.get("label") or "").strip()
            rows: list[dict[str, str]] = []
            for item in cat.get("items") or []:
                href = (item.get("href") or "").strip()
                if not href:
                    continue
                raw = by_path.get(href.rstrip("/")) or by_path.get(href) or defaults.get(
                    "behandlingar", ""
                )
                rows.append(
                    {
                        "label": item.get("label") or title_for_path(href),
                        "href": href,
                        "price": format_display_price(str(raw)),
                    }
                )
            if rows:
                sections.append({"title": title, "items": rows})

    has_plastik_section = any(
        (s.get("title") or "").strip().lower() == "plastikkirurgi" for s in sections
    )
    if not has_plastik_section:
        plastik_rows: list[dict[str, str]] = []
        for path, raw in sorted(by_path.items()):
            if not path.startswith("/plastikkirurgi/"):
                continue
            plastik_rows.append(
                {
                    "label": title_for_path(path),
                    "href": path,
                    "price": format_display_price(str(raw)),
                }
            )
        if plastik_rows:
            sections.append({"title": "Plastikkirurgi", "items": plastik_rows})

    payload = {
        "title": "Prislista",
        "intro": (
            "Indikativa från-priser per behandling. Exakt kostnad fastställs vid "
            "kostnadsfri konsultation utifrån omfattning och individuell plan."
        ),
        "disclaimer": "Alla priser är vägledande tills de bekräftas i kliniken.",
        "sections": sections,
    }
    OUT_PATH.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUT_PATH} — {sum(len(s['items']) for s in sections)} rows")


if __name__ == "__main__":
    main()
