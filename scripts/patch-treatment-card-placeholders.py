#!/usr/bin/env python3
"""Replace Webflow stock placeholders on treatment layout527 + PDP section imgs."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AK_PLACEHOLDER = "/images/ak/treatments/hydrafacial.jpg"
STOCK_RE = re.compile(r"(Morpheus8_0146|Fillers_0055|2149930751|2149152764)", re.I)
HTML_BASES = (ROOT / "public", ROOT / "reference/webflow-export")
IMG_PATTERNS = (
    re.compile(r'<img[^>]*class="[^"]*layout527_background-image[^"]*"[^>]*>', re.I),
    re.compile(r'<img[^>]*class="[^"]*section-img[^"]*"[^>]*>', re.I),
    re.compile(r'<img[^>]*class="[^"]*navbar10_blog-item-image[^"]*"[^>]*>', re.I),
)


def patch_stock_img(tag: str) -> str:
    if not STOCK_RE.search(tag):
        return tag
    tag = re.sub(r'\s+srcset="[^"]*"', "", tag)
    tag = re.sub(r'\s+sizes="[^"]*"', "", tag)
    if " src=" in tag:
        tag = re.sub(r'\s+src="[^"]*"', f' src="{AK_PLACEHOLDER}"', tag)
    else:
        tag = tag.replace("<img", f'<img src="{AK_PLACEHOLDER}"', 1)
    return tag


def patch_file(path: Path) -> bool:
    raw = path.read_text(encoding="utf-8")
    new = raw
    for pat in IMG_PATTERNS:
        new = pat.sub(lambda m: patch_stock_img(m.group(0)), new)
    if new != raw:
        path.write_text(new, encoding="utf-8")
        return True
    return False


def main() -> None:
    changed = 0
    for base in HTML_BASES:
        if not base.is_dir():
            continue
        for html in sorted(base.glob("*.html")):
            if patch_file(html):
                print(f"Patched {html.relative_to(ROOT)}")
                changed += 1
    print(f"Done ({changed} HTML files)")


if __name__ == "__main__":
    main()
