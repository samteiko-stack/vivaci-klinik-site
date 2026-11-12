#!/usr/bin/env python3
"""Align header6 bottom CTA bands with partials/vivaci-bottom-cta.html (homepage shell)."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASES = (ROOT / "reference" / "webflow-export", ROOT / "public")

HEADER_RE = re.compile(
    r"<header\b([^>]*)>(.*?)</header>",
    re.IGNORECASE | re.DOTALL,
)


def _strip_class_token(attrs: str, token: str) -> tuple[str, bool]:
    m = re.search(r'\bclass=(["\'])(.*?)\1', attrs, re.IGNORECASE)
    if not m:
        return attrs, False
    classes = [c for c in m.group(2).split() if c != token]
    if len(classes) == len(m.group(2).split()):
        return attrs, False
    quote = m.group(1)
    new_attrs = attrs[: m.start()] + f"class={quote}{' '.join(classes)}{quote}" + attrs[m.end() :]
    return new_attrs, True


def _patch_header_block(attrs: str, body: str) -> tuple[str, str, bool]:
    if "header6_background-image" not in body:
        return attrs, body, False
    changed = False
    attrs, c = _strip_class_token(attrs, "vivaci-bottom-cta")
    changed = changed or c

    def patch_pg(m: re.Match[str]) -> str:
        nonlocal changed
        tag = m.group(0)
        if "z-index-2" in tag:
            return tag
        changed = True
        return '<div class="padding-global z-index-2">'

    new_body = re.sub(
        r'<div class="padding-global(?:\s+z-index-2)?">',
        patch_pg,
        body,
        count=1,
    )
    if new_body != body:
        changed = True
    return attrs, new_body, changed


def patch_text(text: str) -> tuple[str, bool]:
    changed = False

    def repl(m: re.Match[str]) -> str:
        nonlocal changed
        attrs, body = m.group(1), m.group(2)
        new_attrs, new_body, c = _patch_header_block(attrs, body)
        if not c:
            return m.group(0)
        changed = True
        return f"<header{new_attrs}>{new_body}</header>"

    return HEADER_RE.sub(repl, text), changed


def patch_html(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    new_text, changed = patch_text(text)
    if changed:
        path.write_text(new_text, encoding="utf-8")
    return changed


def main() -> None:
    n = 0
    for base in BASES:
        if not base.is_dir():
            continue
        for html in sorted(base.rglob("*.html")):
            if "node_modules" in html.parts:
                continue
            if "partials" in html.parts:
                continue
            if "header6_background-image" not in html.read_text(encoding="utf-8"):
                continue
            if patch_html(html):
                n += 1
                print(f"  patched {html.relative_to(ROOT)}")
    print(f"Done ({n} files)")


if __name__ == "__main__":
    main()
