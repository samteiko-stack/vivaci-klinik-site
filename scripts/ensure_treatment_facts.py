#!/usr/bin/env python3
"""Ensure every treatment page has four Snabba fakta rows (incl. Pris från)."""

from __future__ import annotations

import json
from pathlib import Path

from treatment_content_lib import OUT_DIR, ensure_facts_items, load_production_doc


def main() -> None:
    updated = 0
    for path in sorted(OUT_DIR.rglob("*.json")):
        if path.name == "index.json":
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        category = data.get("category") or path.parent.name
        slug = data.get("slug") or path.stem
        prod = load_production_doc(category, slug)
        facts = data.setdefault("sections", {}).setdefault("facts", {})
        before = json.dumps(facts.get("items") or [], sort_keys=True)
        facts["items"] = ensure_facts_items(
            facts.get("items"),
            category,
            prod,
            page_path=data.get("path") or "",
        )
        after = json.dumps(facts["items"], sort_keys=True)
        if before != after:
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            updated += 1
    print(f"Updated facts on {updated} page(s)")


if __name__ == "__main__":
    main()
