#!/usr/bin/env python3
"""Copy beforeAfterGallery from Swedish treatment JSON into English locale copies."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SV_ROOT = ROOT / "content" / "treatment-pages"
EN_ROOT = ROOT / "content" / "locales" / "en" / "treatment-pages"


def main() -> None:
    updated = 0
    for sv_path in sorted(SV_ROOT.rglob("*.json")):
        rel = sv_path.relative_to(SV_ROOT)
        en_path = EN_ROOT / rel
        if not en_path.is_file():
            continue
        sv = json.loads(sv_path.read_text(encoding="utf-8"))
        sv_ba = (sv.get("sections") or {}).get("beforeAfterGallery") or {}
        if sv_ba.get("enabled") is False or not sv_ba.get("items"):
            continue
        en = json.loads(en_path.read_text(encoding="utf-8"))
        sections = en.setdefault("sections", {})
        en_ba = sections.get("beforeAfterGallery") or {}
        if en_ba.get("items") and en_ba.get("enabled") is not False:
            continue
        merged = dict(sv_ba)
        for key in ("heading", "intro", "disclaimer"):
            if en_ba.get(key):
                merged[key] = en_ba[key]
        sections["beforeAfterGallery"] = merged
        en_path.write_text(
            json.dumps(en, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        updated += 1
        print(f"  {rel}")
    print(f"Updated beforeAfterGallery on {updated} English treatment page(s)")


if __name__ == "__main__":
    main()
