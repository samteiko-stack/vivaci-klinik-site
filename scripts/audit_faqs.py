#!/usr/bin/env python3
"""Compare local FAQ JSON to vivaci-klinik-production (Railway)."""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "pull_prod", ROOT / "scripts/pull-production-content.py"
)
pull = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(pull)

TP = ROOT / "content/treatment-pages"
HOME_FAQ = ROOT / "content/from-production/home-faq.json"
UTB = ROOT / "content/utbildning"


def local_treatment_faq(rel: str) -> list[dict[str, str]]:
    doc = json.loads((ROOT / rel).read_text(encoding="utf-8"))
    return (doc.get("sections", {}).get("faq", {}) or {}).get("items") or []


def prod_faq(path: str) -> list[dict[str, str]]:
    html = pull.fetch(path)
    main = BeautifulSoup(html, "html.parser").find(id="main-content")
    if not main:
        return []
    return pull.parse_faq_from_main(main)


def main() -> int:
    failures: list[str] = []

    index = json.loads((TP / "index.json").read_text(encoding="utf-8"))
    for rel in index.get("paths", []):
        doc = json.loads((ROOT / rel).read_text(encoding="utf-8"))
        url = doc.get("path")
        if not url:
            continue
        try:
            remote = prod_faq(url)
        except Exception as exc:
            failures.append(f"{url}: fetch failed ({exc})")
            continue
        local = local_treatment_faq(rel)
        if remote != local:
            failures.append(
                f"{url}: FAQ mismatch (prod {len(remote)} vs local {len(local)})"
            )

    try:
        remote_home = pull.parse_home_faq(pull.fetch("/"))["items"]
        local_home = json.loads(HOME_FAQ.read_text(encoding="utf-8"))["items"]
        if remote_home != local_home:
            failures.append(
                f"/: home FAQ mismatch (prod {len(remote_home)} vs local {len(local_home)})"
            )
    except Exception as exc:
        failures.append(f"/: home FAQ check failed ({exc})")

    if failures:
        print("FAQ audit FAILED:\n")
        for line in failures:
            print(" ", line)
        return 1

    print(
        f"FAQ audit OK — {len(index.get('paths', []))} treatment/problem pages + homepage "
        f"match {pull.BASE}"
    )
    print(f"Note: {UTB.name}/ courses are new-site only (not on Railway).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
