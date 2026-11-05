#!/usr/bin/env python3
"""Print which template sections are enabled per treatment page (after sync_section_enabled)."""

from __future__ import annotations

import json
from pathlib import Path

from treatment_content_lib import OUT_DIR, sync_section_enabled

TRACK = (
    "overview",
    "suitability",
    "benefits",
    "howItWorks",
    "resultsTimeline",
    "treatmentAreas",
    "beforeAfterCare",
    "faq",
    "related",
)


def main() -> None:
    rows: list[tuple[str, str, str]] = []
    for path in sorted(OUT_DIR.rglob("*.json")):
        if path.name == "index.json":
            continue
        doc = json.loads(path.read_text(encoding="utf-8"))
        sections = doc.get("sections") or {}
        sync_section_enabled(sections)
        rel = path.relative_to(OUT_DIR)
        category = rel.parts[0]
        slug = rel.stem
        on = [k for k in TRACK if (sections.get(k) or {}).get("enabled")]
        rows.append((category, slug, ",".join(on) if on else "—"))

    print(f"{'category':<18} {'slug':<32} sections")
    print("-" * 90)
    for category, slug, sec in rows:
        print(f"{category:<18} {slug:<32} {sec}")


if __name__ == "__main__":
    main()
