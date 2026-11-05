#!/usr/bin/env python3
"""
Railway vs template: shell blocks are always on; only treatment-specific slots vary.

Uses content/from-production/*.json (Railway scrape) + built treatment-pages after sync.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FROM = ROOT / "content" / "from-production"
OUT = ROOT / "content" / "treatment-pages"

sys.path.insert(0, str(ROOT / "scripts"))
from treatment_content_lib import (  # noqa: E402
    ALWAYS_ON_SHELL_KEYS,
    sync_section_enabled,
)

# v2 catalog IDs we hydrate from Railway body (not shell).
VARIABLE_SLOTS = (
    "hero",
    "facts",
    "about",
    "suitability",
    "benefits",
    "howItWorks",
    "resultsTimeline",
    "treatmentAreas",
    "beforeAfterCare",
    "beforeAfterGallery",
    "related",
)

# Map built JSON section keys → catalog IDs for display
BUILT_KEY_TO_CATALOG = {
    "overview": "about",
}


def production_path(category: str, slug: str) -> Path | None:
    folder = {"problem": "problems"}.get(category, category)
    p = FROM / folder / f"{slug}.json"
    return p if p.is_file() else None


def variable_slots_from_built(sections: dict) -> set[str]:
    sync_section_enabled(sections)
    on: set[str] = set()
    hero = sections.get("hero") or {}
    if hero.get("enabled"):
        on.add("hero")
    facts = sections.get("facts") or {}
    if facts.get("enabled"):
        on.add("facts")
    overview = sections.get("overview") or {}
    if overview.get("enabled"):
        on.add("about")
    suit = sections.get("suitability") or {}
    if suit.get("enabled"):
        on.add("suitability")
    for key, catalog in (
        ("benefits", "benefits"),
        ("howItWorks", "howItWorks"),
        ("resultsTimeline", "resultsTimeline"),
        ("treatmentAreas", "treatmentAreas"),
        ("beforeAfterCare", "beforeAfterCare"),
        ("beforeAfterGallery", "beforeAfterGallery"),
        ("related", "related"),
    ):
        if (sections.get(key) or {}).get("enabled"):
            on.add(catalog)
    return on


def main() -> None:
    print("ALWAYS ON (Railway page shell — every behandling / problem / plastikkirurgi):")
    print("  " + ", ".join(ALWAYS_ON_SHELL_KEYS))
    print()
    print("VARIABLE (depends on treatment content on Railway):")
    print("  " + ", ".join(VARIABLE_SLOTS))
    print()

    rows: list[tuple[str, str, str, str]] = []
    for path in sorted(OUT.rglob("*.json")):
        if path.name == "index.json":
            continue
        doc = json.loads(path.read_text(encoding="utf-8"))
        sections = doc.get("sections") or {}
        rel = path.relative_to(OUT)
        category, slug = rel.parts[0], rel.stem
        variable = sorted(variable_slots_from_built(sections))
        faq_items = len((sections.get("faq") or {}).get("items") or [])
        rows.append(
            (
                category,
                slug,
                ",".join(variable) if variable else "—",
                str(faq_items),
            )
        )

    print(f"{'category':<16} {'slug':<28} {'variable slots':<52} faq#")
    print("-" * 110)
    for category, slug, var, faq_n in rows:
        print(f"{category:<16} {slug:<28} {var:<52} {faq_n}")


if __name__ == "__main__":
    main()
