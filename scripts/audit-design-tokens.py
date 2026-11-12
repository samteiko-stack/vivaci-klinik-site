#!/usr/bin/env python3
"""Fail if Vivaci-owned CSS uses raw hex/rgb colors outside vivaci-tokens.css."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS_DIR = ROOT / "reference" / "webflow-export" / "css"

SCAN = [
    "nav-fixes.css",
    "vivaci-academy.css",
    "vivaci-blog.css",
    "vivaci-motion.css",
    "vivaci-quiz.css",
    "vivaci-shop.css",
    "vivaci-swiper.css",
    "vivaci-legal.css",
    "vivaci-icons.css",
]

ALLOWLIST_FILES = {
    "vivaci-tokens.css",
    "vivaci-dev.webflow.css",
    "vivaci.css",
}

HEX_RE = re.compile(r"#[0-9a-fA-F]{3,8}\b")
RGB_RE = re.compile(r"\brgba?\([^)]+\)")
LEGACY_VAR_RE = re.compile(
    r"var\s*\(\s*--(?:color-scheme-1--|_primitives---)"
)


def strip_comments(text: str) -> str:
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    return text


def audit_file(path: Path) -> list[tuple[int, str]]:
    raw = path.read_text(encoding="utf-8")
    body = strip_comments(raw)
    issues: list[tuple[int, str]] = []
    for i, line in enumerate(raw.splitlines(), start=1):
        if line.strip().startswith("/*") or "*/" in line and not HEX_RE.search(line):
            continue
        clean = strip_comments(line)
        for match in HEX_RE.finditer(clean):
            issues.append((i, match.group(0)))
        for match in RGB_RE.finditer(clean):
            issues.append((i, match.group(0)))
        for match in LEGACY_VAR_RE.finditer(clean):
            issues.append((i, "legacy Webflow var"))
    return issues


def main() -> int:
    bad: list[str] = []
    for name in SCAN:
        path = CSS_DIR / name
        if not path.is_file():
            continue
        for line_no, token in audit_file(path):
            bad.append(f"{path.relative_to(ROOT)}:{line_no}: {token}")

    extra = sorted(CSS_DIR.glob("vivaci-*.css"))
    for path in extra:
        if path.name in ALLOWLIST_FILES or path.name in SCAN:
            continue
        for line_no, token in audit_file(path):
            bad.append(f"{path.relative_to(ROOT)}:{line_no}: {token}")

    if bad:
        print(
            "Hardcoded colors in Vivaci CSS (use variables from vivaci-tokens.css):\n",
            file=sys.stderr,
        )
        for row in bad:
            print(f"  {row}", file=sys.stderr)
        print(
            f"\n{len(bad)} issue(s). Define colors in css/vivaci-tokens.css only.",
            file=sys.stderr,
        )
        return 1

    print("OK — Vivaci-owned CSS has no raw color literals outside vivaci-tokens.css")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
