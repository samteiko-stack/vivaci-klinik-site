#!/usr/bin/env python3
"""Concatenate Vivaci CSS partials into one site stylesheet (css/vivaci.css)."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS = ROOT / "reference" / "webflow-export" / "css"
OUT = CSS / "vivaci.css"

PARTIALS = [
    "vivaci-tokens.css",
    "vivaci-form-surfaces.css",
    "vivaci-webflow-overrides.css",
    "nav-fixes.css",
    "vivaci-icons.css",
    "vivaci-motion.css",
    "vivaci-swiper.css",
    "vivaci-quiz.css",
    "vivaci-academy.css",
    "vivaci-shop.css",
    "vivaci-blog.css",
    "vivaci-legal.css",
]

IMPORT_RE = re.compile(r'^\s*@import\s+url\([^)]+\)\s*;\s*$', re.M)


def strip_imports(text: str) -> str:
    return IMPORT_RE.sub("", text).strip() + "\n"


def main() -> None:
    chunks: list[str] = [
        "/**\n"
        " * Vivaci site CSS — single bundle.\n"
        " * Source: css/* partials listed in scripts/bundle-vivaci-css.py\n"
        " * Regenerate: python3 scripts/bundle-vivaci-css.py\n"
        " */\n"
    ]
    for name in PARTIALS:
        path = CSS / name
        if not path.is_file():
            raise SystemExit(f"Missing partial: {path}")
        body = strip_imports(path.read_text(encoding="utf-8"))
        chunks.append(f"\n/* ── {name} ── */\n\n")
        chunks.append(body)
        if not body.endswith("\n"):
            chunks.append("\n")

    OUT.write_text("".join(chunks), encoding="utf-8")
    size_kb = OUT.stat().st_size / 1024
    print(f"Wrote {OUT.relative_to(ROOT)} ({size_kb:.1f} KiB, {len(PARTIALS)} partials)")


if __name__ == "__main__":
    main()
