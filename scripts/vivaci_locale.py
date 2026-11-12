"""Locale URL prefixes — Swedish default (no prefix), English under /en/."""

from __future__ import annotations

import re

DEFAULT_LOCALE = "sv"
PREFIXED_LOCALES = frozenset({"en"})

_LOCALE_PREFIX_RE = re.compile(
    r"^/(" + "|".join(sorted(PREFIXED_LOCALES)) + r")(?=/|$)"
)


def split_locale_prefix(path: str) -> tuple[str, str]:
    """Return (locale, path_without_prefix). Unprefixed paths use DEFAULT_LOCALE."""
    path = path or "/"
    if path != "/" and path.endswith("/"):
        path = path.rstrip("/")
    m = _LOCALE_PREFIX_RE.match(path)
    if not m:
        return DEFAULT_LOCALE, path
    locale = m.group(1)
    rest = path[m.end() :] or "/"
    if not rest.startswith("/"):
        rest = "/" + rest
    return locale, rest
