#!/usr/bin/env python3
"""Mirror content/ → content/locales/en/ with EN strings + HTML replacements."""

from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content"
OUT = CONTENT / "locales" / "en"
EXPORT = ROOT / "reference" / "webflow-export"
CACHE_PATH = CONTENT / ".locale-translate-cache.json"

SKIP_KEYS = frozenset(
    {
        "slug",
        "href",
        "path",
        "image",
        "heroImage",
        "sourceUrl",
        "source",
        "version",
        "locale",
        "network",
        "id",
        "sku",
        "handle",
        "gid",
        "checkoutUrl",
        "email",
    }
)

SKIP_VALUE_RE = re.compile(
    r"^(https?://|/|mailto:|tel:|#|[\d\s\W]+$|[a-z0-9_-]+\.(json|webp|jpg|png|svg|html|woff2?)$)",
    re.I,
)


def load_cache() -> dict[str, str]:
    if CACHE_PATH.is_file():
        return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    return {}


def save_cache(cache: dict[str, str]) -> None:
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def should_translate(key: str, value: str) -> bool:
    if not isinstance(value, str):
        return False
    text = value.strip()
    if len(text) < 2:
        return False
    if key in SKIP_KEYS:
        return False
    if SKIP_VALUE_RE.match(text):
        return False
    if "@" in text and "." in text and " " not in text:
        return False
    if text.startswith("/content/") or text.startswith("/images/"):
        return False
    return True


def collect_strings(obj, key: str = "", out: set[str] | None = None) -> set[str]:
    if out is None:
        out = set()
    if isinstance(obj, dict):
        for k, v in obj.items():
            collect_strings(v, k, out)
    elif isinstance(obj, list):
        for item in obj:
            collect_strings(item, key, out)
    elif isinstance(obj, str) and should_translate(key, obj):
        out.add(obj.strip())
    return out


def apply_translations(obj, cache: dict[str, str], key: str = ""):
    if isinstance(obj, dict):
        return {k: apply_translations(v, cache, k) for k, v in obj.items()}
    if isinstance(obj, list):
        return [apply_translations(v, cache, key) for v in obj]
    if isinstance(obj, str) and should_translate(key, obj):
        return cache.get(obj.strip(), obj)
    return obj


def translate_batch(strings: list[str], cache: dict[str, str]) -> None:
    try:
        from deep_translator import GoogleTranslator
    except ImportError:
        print("Install deep-translator: pip install deep-translator", file=sys.stderr)
        sys.exit(1)

    todo = [s for s in strings if s not in cache]
    if not todo:
        return

    translator = GoogleTranslator(source="sv", target="en")
    chunk_size = 40
    for i in range(0, len(todo), chunk_size):
        chunk = todo[i : i + chunk_size]
        try:
            results = translator.translate_batch(chunk)
        except Exception as e:
            print("Batch failed, falling back one-by-one:", e)
            results = []
            for s in chunk:
                try:
                    results.append(translator.translate(s))
                    time.sleep(0.15)
                except Exception:
                    results.append(s)
        for src, dst in zip(chunk, results):
            cache[src] = dst or src
        save_cache(cache)
        print(f"Translated {min(i + chunk_size, len(todo))}/{len(todo)} strings…")
        time.sleep(0.3)


def mirror_json_files(cache: dict[str, str]) -> None:
    for path in sorted(CONTENT.rglob("*.json")):
        rel = path.relative_to(CONTENT)
        if rel.parts[0] == "locales":
            continue
        if rel.name == ".locale-translate-cache.json":
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        en_data = apply_translations(data, cache)
        out_path = OUT / rel
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(en_data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def extract_html_strings(html_path: Path) -> set[str]:
    if not html_path.is_file():
        return set()
    soup = BeautifulSoup(html_path.read_text(encoding="utf-8"), "html.parser")
    for tag in soup.select("script, style, noscript, svg, .navbar2_component, footer"):
        tag.decompose()
    texts: set[str] = set()
    for el in soup.find_all(string=True):
        t = str(el).strip()
        if len(t) < 3:
            continue
        if SKIP_VALUE_RE.match(t):
            continue
        texts.add(t)
    return texts


def build_replacements(cache: dict[str, str]) -> None:
    html_files = sorted(EXPORT.glob("*.html"))
    html_files.extend(sorted((EXPORT / "legal").glob("*.html")) if (EXPORT / "legal").is_dir() else [])
    strings: set[str] = set()
    for fp in html_files:
        strings |= extract_html_strings(fp)
    pairs = [[s, cache.get(s, s)] for s in sorted(strings, key=len, reverse=True) if cache.get(s, s) != s]
    out = OUT / "replacements.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"pairs": pairs}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(pairs)} HTML replacement pairs → {out}")


def write_quiz_en(cache: dict[str, str]) -> None:
    quiz_sv = CONTENT / "quiz" / "locales" / "sv.json"
    if not quiz_sv.is_file():
        return
    data = json.loads(quiz_sv.read_text(encoding="utf-8"))
    en_data = apply_translations(data, cache)
    out = CONTENT / "quiz" / "locales" / "en.json"
    out.write_text(json.dumps(en_data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Wrote", out)


def main() -> None:
    cache = load_cache()
    all_strings: set[str] = set()
    for path in CONTENT.rglob("*.json"):
        rel = path.relative_to(CONTENT)
        if rel.parts[0] == "locales":
            continue
        all_strings |= collect_strings(json.loads(path.read_text(encoding="utf-8")))

    for fp in [
        EXPORT / "index.html",
        EXPORT / "kontakt.html",
        EXPORT / "behandlingar.html",
    ]:
        all_strings |= extract_html_strings(fp)

    print(f"Unique strings to translate: {len(all_strings)}")
    translate_batch(sorted(all_strings), cache)
    mirror_json_files(cache)
    write_quiz_en(cache)
    build_replacements(cache)
    print("Done →", OUT)


if __name__ == "__main__":
    main()
