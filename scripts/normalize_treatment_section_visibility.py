#!/usr/bin/env python3
"""Re-apply sync_section_enabled to every built treatment page JSON."""

from __future__ import annotations

import json
from pathlib import Path

from treatment_content_lib import OUT_DIR, sync_section_enabled


def main() -> None:
    updated = 0
    for path in sorted(OUT_DIR.rglob("*.json")):
        if path.name == "index.json":
            continue
        doc = json.loads(path.read_text(encoding="utf-8"))
        sections = doc.setdefault("sections", {})
        before = json.dumps(sections, sort_keys=True, ensure_ascii=False)
        sync_section_enabled(sections)
        after = json.dumps(sections, sort_keys=True, ensure_ascii=False)
        if before != after:
            path.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            updated += 1
    print(f"Normalized section visibility on {updated} page(s)")


if __name__ == "__main__":
    main()
