#!/usr/bin/env python3
"""Inject nav-preview.js into Webflow export HTML pages."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPORT = ROOT / "reference/webflow-export"
SNIPPET = '<script src="js/nav-preview.js" type="text/javascript"></script>\n'

for path in EXPORT.glob("*.html"):
    text = path.read_text(encoding="utf-8")
    if "nav-preview.js" in text:
        continue
    if "</body>" not in text:
        continue
    path.write_text(text.replace("</body>", SNIPPET + "</body>", 1), encoding="utf-8")
    print("patched", path.name)
