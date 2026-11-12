#!/usr/bin/env python3
"""Mirror content/ → content/locales/en/ with EN strings + HTML replacements."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
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


def purge_identity_entries(cache: dict[str, str]) -> tuple[dict[str, str], int]:
    """Drop cache rows where translation equals source (failed or placeholder runs)."""
    cleaned = {k: v for k, v in cache.items() if k != v}
    removed = len(cache) - len(cleaned)
    return cleaned, removed


def seed_manual_translations(cache: dict[str, str]) -> int:
    """Seed from build_en_locale labels + content/i18n en catalog (no API)."""
    added = 0
    sys.path.insert(0, str(ROOT / "scripts"))
    try:
        from build_en_locale import DESCRIPTIONS, LABELS

        for src, dst in {**LABELS, **DESCRIPTIONS}.items():
            if src and dst and src != dst and cache.get(src) != dst:
                cache[src] = dst
                added += 1
    except ImportError as e:
        print("seed_manual_translations:", e, file=sys.stderr)

    sv_path = CONTENT / "i18n" / "sv.json"
    en_path = CONTENT / "i18n" / "en.json"
    if sv_path.is_file() and en_path.is_file():
        sv = json.loads(sv_path.read_text(encoding="utf-8"))
        en = json.loads(en_path.read_text(encoding="utf-8"))

        def walk(s_obj, e_obj):
            nonlocal added
            if isinstance(s_obj, dict) and isinstance(e_obj, dict):
                for key, s_val in s_obj.items():
                    if key in e_obj:
                        walk(s_val, e_obj[key])
            elif isinstance(s_obj, str) and isinstance(e_obj, str):
                s = s_obj.strip()
                e = e_obj.strip()
                if s and e and s != e and cache.get(s) != e:
                    cache[s] = e
                    added += 1

        walk(sv, en)

    hp_sv = CONTENT / "homepage-copy.json"
    hp_en = OUT / "homepage-copy.json"
    if hp_sv.is_file() and hp_en.is_file():
        walk(
            json.loads(hp_sv.read_text(encoding="utf-8")),
            json.loads(hp_en.read_text(encoding="utf-8")),
        )

    return added


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


def _translate_one(text: str, google, mymemory) -> str | None:
    for attempt, backend in enumerate(("mymemory", "google")):
        try:
            if backend == "google" and google is not None:
                dst = google.translate(text)
            elif backend == "mymemory" and mymemory is not None:
                dst = mymemory.translate(text)
            else:
                continue
            if dst and dst.strip():
                return dst.strip()
        except Exception as e:
            if attempt == 0:
                print(f"  {backend} failed, trying alternate:", e)
            time.sleep(0.25)
    return None


def translate_batch(strings: list[str], cache: dict[str, str], *, retranslate_stale: bool = True) -> None:
    try:
        from deep_translator import GoogleTranslator, MyMemoryTranslator
    except ImportError:
        print("Install deep-translator: pip install deep-translator", file=sys.stderr)
        sys.exit(1)

    todo = []
    for s in strings:
        if s not in cache:
            todo.append(s)
        elif retranslate_stale and cache.get(s) == s:
            todo.append(s)
    if not todo:
        return

    google = GoogleTranslator(source="sv", target="en")
    mymemory = MyMemoryTranslator(source="sv-SE", target="en-GB")
    chunk_size = 12
    for i in range(0, len(todo), chunk_size):
        chunk = todo[i : i + chunk_size]
        for src in chunk:
            dst = _translate_one(src, google, mymemory)
            if dst and dst != src:
                cache[src] = dst
        save_cache(cache)
        print(f"Translated chunk {min(i + chunk_size, len(todo))}/{len(todo)}…")
        time.sleep(0.15)


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
    html_files = sorted(EXPORT.rglob("*.html"))
    strings: set[str] = set()
    for fp in html_files:
        strings |= extract_html_strings(fp)
    pairs = [[s, cache[s]] for s in sorted(strings, key=len, reverse=True) if s in cache and cache[s] != s]
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


def run_build_en_locale() -> None:
    script = ROOT / "scripts" / "build_en_locale.py"
    subprocess.run([sys.executable, str(script)], check=True, cwd=ROOT)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--skip-translate",
        action="store_true",
        help="Only mirror JSON + replacements from cache (for Vercel deploy).",
    )
    parser.add_argument(
        "--purge-identity",
        action="store_true",
        help="Remove cache entries where translation equals source.",
    )
    parser.add_argument(
        "--no-retranslate-stale",
        action="store_true",
        help="Do not re-attempt strings cached as identical to source.",
    )
    parser.add_argument(
        "--skip-build-en-locale",
        action="store_true",
        help="Skip running build_en_locale.py first.",
    )
    args = parser.parse_args()

    if not args.skip_build_en_locale:
        run_build_en_locale()

    cache = load_cache()
    if args.purge_identity:
        cache, n = purge_identity_entries(cache)
        if n:
            print(f"Purged {n} identity cache entries")
            save_cache(cache)

    seeded = seed_manual_translations(cache)
    if seeded:
        print(f"Seeded {seeded} manual translations into cache")
        save_cache(cache)

    all_strings: set[str] = set()
    for path in CONTENT.rglob("*.json"):
        rel = path.relative_to(CONTENT)
        if rel.parts[0] == "locales":
            continue
        if rel.name == ".locale-translate-cache.json":
            continue
        all_strings |= collect_strings(json.loads(path.read_text(encoding="utf-8")))

    for fp in EXPORT.rglob("*.html"):
        all_strings |= extract_html_strings(fp)

    print(f"Unique strings in scope: {len(all_strings)}")
    if not args.skip_translate:
        translate_batch(
            sorted(all_strings),
            cache,
            retranslate_stale=not args.no_retranslate_stale,
        )
    mirror_json_files(cache)
    write_quiz_en(cache)
    build_replacements(cache)
    translated = sum(1 for k, v in cache.items() if k != v)
    print(f"Cache: {translated} translated pairs")
    print("Done →", OUT)


if __name__ == "__main__":
    main()
