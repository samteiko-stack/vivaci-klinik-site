"""Read / write treatment-page JSON under content/treatment-pages/."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
PAGES_ROOT = ROOT / "content" / "treatment-pages"
INDEX_PATH = PAGES_ROOT / "index.json"

SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
CATEGORIES = frozenset({"behandlingar", "problem", "plastikkirurgi"})


class StoreError(Exception):
    def __init__(self, message: str, status: int = 400) -> None:
        super().__init__(message)
        self.status = status


def _page_path(category: str, slug: str) -> Path:
    if category not in CATEGORIES:
        raise StoreError("Invalid category", 404)
    if not SLUG_RE.match(slug or ""):
        raise StoreError("Invalid slug", 404)
    path = PAGES_ROOT / category / f"{slug}.json"
    if not path.is_file():
        raise StoreError("Page not found", 404)
    resolved = path.resolve()
    if PAGES_ROOT.resolve() not in resolved.parents:
        raise StoreError("Invalid path", 400)
    return path


def list_pages() -> list[dict[str, Any]]:
    pages: list[dict[str, Any]] = []
    for category in sorted(CATEGORIES):
        cat_dir = PAGES_ROOT / category
        if not cat_dir.is_dir():
            continue
        for path in sorted(cat_dir.glob("*.json")):
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                data = {}
            pages.append(
                {
                    "category": category,
                    "slug": path.stem,
                    "title": data.get("title") or path.stem,
                    "path": data.get("path") or f"/{category}/{path.stem}",
                }
            )
    pages.sort(key=lambda p: (p["category"], p["title"].lower()))
    return pages


def load_page(category: str, slug: str) -> dict[str, Any]:
    path = _page_path(category, slug)
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise StoreError(f"Invalid JSON on disk: {exc}", 500) from exc


def save_page(category: str, slug: str, data: dict[str, Any]) -> None:
    path = _page_path(category, slug)
    if not isinstance(data, dict):
        raise StoreError("Body must be a JSON object")
    if data.get("category") != category or data.get("slug") != slug:
        raise StoreError("category/slug in body must match URL")
    if "sections" not in data or not isinstance(data["sections"], dict):
        raise StoreError("Missing sections object")

    serialized = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(serialized, encoding="utf-8")
    tmp.replace(path)


def match_api_path(path: str) -> tuple[str, ...] | None:
    """Return ('login'|...) or ('page', category, slug)."""
    path = path.rstrip("/")
    if path == "/admin/api/session":
        return ("session",)
    if path == "/admin/api/login":
        return ("login",)
    if path == "/admin/api/logout":
        return ("logout",)
    if path == "/admin/api/pages":
        return ("pages",)
    m = re.match(r"^/admin/api/pages/([^/]+)/([^/]+)$", path)
    if m:
        return ("page", m.group(1), m.group(2))
    return None
