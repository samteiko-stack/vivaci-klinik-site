#!/usr/bin/env python3
"""Pre-render Vivaci HTML for Vercel static hosting (same output as dev-server)."""

from __future__ import annotations

import importlib.util
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
EXPORT = ROOT / "reference" / "webflow-export"
PUBLIC = ROOT / "public"

_spec = importlib.util.spec_from_file_location("vivaci_dev_server", SCRIPTS / "dev-server.py")
_mod = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
sys.path.insert(0, str(SCRIPTS))
_spec.loader.exec_module(_mod)
build_get_response = _mod.build_get_response


def main() -> None:
    if PUBLIC.exists():
        shutil.rmtree(PUBLIC)
    PUBLIC.mkdir()

    for item in EXPORT.rglob("*"):
        if not item.is_file():
            continue
        rel = item.relative_to(EXPORT)
        if item.suffix.lower() in {".html", ".htm"}:
            continue
        dest = PUBLIC / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(item, dest)

    shutil.copytree(ROOT / "content", PUBLIC / "content", dirs_exist_ok=True)

    for html in EXPORT.rglob("*.html"):
        rel = html.relative_to(EXPORT).as_posix()
        if rel == "index.html":
            req_path = "/"
        else:
            req_path = "/" + rel.removesuffix(".html")
        _status, _headers, body = build_get_response(req_path)
        out = PUBLIC / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(body)

    print(f"Wrote static site to {PUBLIC}")


if __name__ == "__main__":
    main()
