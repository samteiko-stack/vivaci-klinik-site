"""Canonical pretty URLs and HTML href normalization for legal pages."""

from __future__ import annotations

# slug → site path (no .html)
LEGAL_PAGE_PATHS: dict[str, str] = {
    "integritetspolicy": "/integritetspolicy",
    "kopvillkor": "/villkor",
    "avbokning": "/avbokning",
    "cookies": "/cookies",
}

LEGAL_HTML_REPLACEMENTS: tuple[tuple[str, str], ...] = (
    ('href="legal/integritetspolicy.html"', 'href="/integritetspolicy"'),
    ('href="legal/kopvillkor.html"', 'href="/villkor"'),
    ('href="legal/avbokning.html"', 'href="/avbokning"'),
    ('href="legal/cookies.html"', 'href="/cookies"'),
    ("href='legal/integritetspolicy.html'", "href='/integritetspolicy'"),
    ("href='legal/kopvillkor.html'", "href='/villkor'"),
    ("href='legal/avbokning.html'", "href='/avbokning'"),
    ("href='legal/cookies.html'", "href='/cookies'"),
    ('href="/legal/integritetspolicy.html"', 'href="/integritetspolicy"'),
    ('href="/legal/kopvillkor.html"', 'href="/villkor"'),
    ('href="/legal/avbokning.html"', 'href="/avbokning"'),
    ('href="/legal/cookies.html"', 'href="/cookies"'),
    ('href="/legal/integritetspolicy"', 'href="/integritetspolicy"'),
    ('href="/legal/kopvillkor"', 'href="/villkor"'),
    ('href="/legal/avbokning"', 'href="/avbokning"'),
    ('href="/legal/cookies"', 'href="/cookies"'),
)


def normalize_site_legal_hrefs(html: str) -> str:
    out = html
    for old, new in LEGAL_HTML_REPLACEMENTS:
        out = out.replace(old, new)
    return out


def normalize_legal_json_hrefs(fragment: str) -> str:
    """Apply the same href rules to JSON bodyHtml fragments."""
    return normalize_site_legal_hrefs(fragment)
