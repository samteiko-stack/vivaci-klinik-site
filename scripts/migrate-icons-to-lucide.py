#!/usr/bin/env python3
"""Replace embedded Iconify (iconoir/ic/…) SVGs with inline Lucide equivalents."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPORT = ROOT / "reference/webflow-export"

SVG_OPEN = (
    '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" '
    'viewbox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
    'stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-{name}" '
    'preserveaspectratio="xMidYMid meet" aria-hidden="true" role="img">'
)

# Match on path signature inside SVGs (longest / most specific first).
PATH_TO_LUCIDE: list[tuple[str, str, str]] = [
    (
        "M20.9728 6.7174C20.5084 7.33692",
        "twitter",
        '<path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>',
    ),
    (
        "M20.9999 7.66008V8.00008",
        "link-2",
        '<path d="M9 17H7A5 5 0 0 1 7 7h2"/>'
        '<path d="M15 7h2a5 5 0 1 1 0 10h-2"/>'
        '<line x1="8" x2="16" y1="12" y2="12"/>',
    ),
    (
        "M5 3H19C20.1046 3 21 3.89543 21 5V19",
        "linkedin",
        '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>'
        '<rect width="4" height="12" x="2" y="9"/>'
        '<circle cx="4" cy="4" r="2"/>',
    ),
    (
        "M16.5 6H13.5C12.9477 6 12.5 6.44772",
        "facebook",
        '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    ),
    (
        "M17.5 15.8333V11.25C17.5 11.0199",
        "external-link",
        '<path d="M15 3h6v6"/>'
        '<path d="M10 14 21 3"/>'
        '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    ),
    (
        "M20.73 7.12L20.59 6.87C20.4094",
        "package",
        '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/>'
        '<path d="M12 22V12"/>'
        '<polyline points="3.29 7 12 12 20.71 7"/>'
        '<path d="m7.5 4.27 9 5.15"/>',
    ),
    (
        "M10 18C11.775 17.9996 13.4988 17.4054",
        "search",
        '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    ),
    (
        "M7.08691 9.02344C7.18774 9.02344",
        "chevron-down",
        '<path d="m6 9 6 6 6-6"/>',
    ),
    (
        "M12.6893 7.25L6.96967 1.53033",
        "chevron-right",
        '<path d="m9 18 6-6-6-6"/>',
    ),
    (
        "M3.31066 8.75001L9.03033 14.4697",
        "chevron-left",
        '<path d="m15 18-6-6 6-6"/>',
    ),
    (
        "M16.5303 20.8839C16.2374 21.1768",
        "chevron-down",
        '<path d="m6 9 6 6 6-6"/>',
    ),
    (
        "M2.55806 6.29544C2.46043 6.19781",
        "chevron-down",
        '<path d="m6 9 6 6 6-6"/>',
    ),
    (
        "M6 3L11 8L6 13",
        "chevron-right",
        '<path d="m9 18 6-6-6-6"/>',
    ),
    (
        "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58",
        "shopping-cart",
        '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>'
        '<path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    ),
    (
        "m21 21-4.3-4.3",
        "search",
        '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    ),
    (
        "M6 12h12.5m0 0l-6-6m6 6l-6 6",
        "chevron-right",
        '<path d="m9 18 6-6-6-6"/>',
    ),
    (
        "M6 12h6m6 0h-6m0 0V6m0 6v6",
        "plus",
        '<path d="M5 12h14"/><path d="M12 5v14"/>',
    ),
    (
        "m7 12.5l3 3l7-7",
        "circle-check-big",
        '<path d="M21.801 10A10 10 0 1 1 17 3.335"/>'
        '<path d="m9 11 3 3L22 4"/>',
    ),
    (
        "M5 19.5V5a2 2 0 0 1 2-2h11.4",
        "book-open",
        '<path d="M12 7v14"/>'
        '<path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    ),
    (
        "M18.118 14.702L14 15.5",
        "mail",
        '<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/>'
        '<rect x="2" y="4" width="20" height="16" rx="2"/>',
    ),
    (
        "M21 7.353v9.294",
        "package",
        '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/>'
        '<path d="M12 22V12"/>'
        '<polyline points="3.29 7 12 12 20.71 7"/>'
        '<path d="m7.5 4.27 9 5.15"/>',
    ),
    (
        "m7 9l5 3.5L17 9",
        "map-pin",
        '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>'
        '<circle cx="12" cy="10" r="3"/>',
    ),
    (
        "m6 15l6-6l6 6",
        "chevron-up",
        '<path d="m18 15-6-6-6 6"/>',
    ),
    (
        "m9 19l-5.21 1.737",
        "instagram",
        '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>'
        '<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>'
        '<line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>',
    ),
    (
        "M8 7a4 4 0 1 0 8 0",
        "user",
        '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>'
        '<circle cx="12" cy="7" r="4"/>',
    ),
    (
        "M20 4H4c-1.1 0-1.99.9-1.99 2",
        "mail",
        '<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/>'
        '<rect x="2" y="4" width="20" height="16" rx="2"/>',
    ),
    (
        "M11.99 2C6.47 2 2 6.48 2 12",
        "clock",
        '<path d="M12 6v6l4 2"/>'
        '<circle cx="12" cy="12" r="10"/>',
    ),
    (
        "M128 16a88.1 88.1 0 0 0-88 88",
        "map-pin",
        '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>'
        '<circle cx="12" cy="10" r="3"/>',
    ),
    (
        "m20.916 4.674l-1.85 14.8",
        "shopping-bag",
        '<path d="M16 10a4 4 0 0 1-8 0"/>'
        '<path d="M3.103 6.034h17.794"/>'
        '<path d="M6 18v-5.75"/>'
        '<path d="M18 18v-5.75"/>'
        '<path d="M6 8.75V6.5a6 6 0 0 1 12 0v2.25"/>',
    ),
    (
        "M3 21V3.6a.6.6 0 0 1 .6-.6H21",
        "calendar",
        '<path d="M8 2v4"/>'
        '<path d="M16 2v4"/>'
        '<rect width="18" height="18" x="3" y="4" rx="2"/>'
        '<path d="M3 10h18"/>',
    ),
]

ICONIFY_SVG = re.compile(
    r"<svg\b[^>]*class=\"iconify iconify--(?:iconoir|ic|ph|tabler)[^\"]*\"[^>]*>.*?</svg>",
    re.IGNORECASE | re.DOTALL,
)

MATERIAL_ARROW = re.compile(
    r'<svg\b[^>]*class="iconify iconify--ic"[^>]*>\s*'
    r'<path fill="currentColor" d="M6\.23 20\.23[^"]*"></path>\s*</svg>',
    re.IGNORECASE | re.DOTALL,
)

ANY_SVG = re.compile(r"<svg\b[^>]*>.*?</svg>", re.IGNORECASE | re.DOTALL)


def is_lucide_svg(svg: str) -> bool:
    return bool(re.search(r'\blucide\b', svg, re.IGNORECASE))


def lucide_svg(name: str, inner: str) -> str:
    return SVG_OPEN.format(name=name) + inner + "</svg>"


def replace_iconify_svg(svg: str) -> str:
    paths = " ".join(re.findall(r'\bd="([^"]+)"', svg))
    for needle, name, inner in PATH_TO_LUCIDE:
        if needle in paths:
            return lucide_svg(name, inner)
    return svg


def migrate_text(text: str) -> tuple[str, int]:
    count = 0

    def sub_iconify(m: re.Match[str]) -> str:
        nonlocal count
        old = m.group(0)
        new = replace_iconify_svg(old)
        if new != old:
            count += 1
        return new

    text = ICONIFY_SVG.sub(sub_iconify, text)
    text, n = MATERIAL_ARROW.subn(lucide_svg("chevron-right", '<path d="m9 18 6-6-6-6"/>'), text)
    count += n

    def sub_any(m: re.Match[str]) -> str:
        nonlocal count
        old = m.group(0)
        if is_lucide_svg(old):
            return old
        new = replace_iconify_svg(old)
        if new != old:
            count += 1
        return new

    text = ANY_SVG.sub(sub_any, text)
    return text, count


def main() -> int:
    total = 0
    paths = sorted(EXPORT.rglob("*.html")) + sorted((EXPORT / "js").glob("*.js"))
    for path in paths:
        if not path.is_file():
            continue
        raw = path.read_text(encoding="utf-8")
        updated, n = migrate_text(raw)
        if n:
            path.write_text(updated, encoding="utf-8")
            print(f"{path.relative_to(ROOT)}: {n} icon(s)")
            total += n
    print(f"Done. Replaced {total} icon(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
