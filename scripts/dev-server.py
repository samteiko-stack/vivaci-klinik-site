#!/usr/bin/env python3
"""
Vivaci site server — local dev and production (Railway).

  /                          → home
  /problem/{slug}            → treatment template
  /behandlingar              → treatment listing
  /utbildning                → course listing
  /utbildning/{slug}         → course template
  /blogg                     → blog listing (alias)
  /nyheter                   → news listing
  /nyheter/{slug}            → blog post template
  /behandlingar/{slug}       → treatment template
  /plastikkirurgi            → home (listing TBD)
  /plastikkirurgi/{slug}     → treatment template
  /kontakt                   → contact page
  /om-oss                    → about page
  /en, /en/*                 → English (same templates, /en URL prefix)
  /css, /js, /images, …      → Webflow export assets
"""

from __future__ import annotations

import mimetypes
import os
import re
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

from vivaci_locale import split_locale_prefix

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))
EXPORT = ROOT / "reference/webflow-export"
DEFAULT_PORT = 8765
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", str(DEFAULT_PORT)))
CONTENT_ADMIN_ORIGIN = os.environ.get("CONTENT_ADMIN_ORIGIN", "same-origin")

HTML_ROUTES: dict[str, str] = {
    "/": "index.html",
    "/kontakt": "kontakt.html",
    "/om-oss": "om-oss.html",
    "/prislista": "prislista.html",
    "/behandlingar": "behandlingar.html",
    "/utbildning": "utbildning.html",
    "/plastikkirurgi": "index.html",
    "/problem": "index.html",
    "/faq": "index.html",
    "/produkter": "webshop.html",
    "/blogg": "nyheter.html",
    "/nyheter": "nyheter.html",
    "/integritetspolicy": "legal/integritetspolicy.html",
    "/villkor": "legal/kopvillkor.html",
    "/avbokning": "legal/avbokning.html",
    "/legal/cookies.html": "legal/cookies.html",
    "/legal/integritetspolicy.html": "legal/integritetspolicy.html",
    "/cookies": "legal/cookies.html",
    "/404": "404.html",
}

NOT_FOUND_HTML = EXPORT / "404.html"

ASSET_SUFFIXES = frozenset(
    {
        ".css",
        ".js",
        ".json",
        ".map",
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
        ".gif",
        ".svg",
        ".ico",
        ".woff",
        ".woff2",
        ".ttf",
        ".pdf",
        ".xml",
        ".txt",
    }
)

TEMPLATE_SLUG = re.compile(
    r"^/(problem|behandlingar|plastikkirurgi)/[^/]+/?$"
)

PRODUCT_SLUG = re.compile(r"^/produkter/[^/]+/?$")

COURSE_SLUG = re.compile(r"^/utbildning/[^/]+/?$")

NYHET_SLUG = re.compile(r"^/nyheter/[^/]+/?$")


def resolve_file(path: str) -> Path | None:
    path = unquote(path)
    if path != "/" and path.endswith("/"):
        path = path.rstrip("/")

    if path in HTML_ROUTES:
        return EXPORT / HTML_ROUTES[path]

    # Pretty URL → export root HTML (e.g. /prislista → prislista.html)
    segment = path.lstrip("/")
    if segment and "/" not in segment and not segment.endswith(".html"):
        flat_html = EXPORT / f"{segment}.html"
        if flat_html.is_file():
            return flat_html

    if path in ("/404.html", "/404"):
        return EXPORT / "404.html"

    if path == "/index.html":
        return EXPORT / "index.html"

    if TEMPLATE_SLUG.match(path):
        return EXPORT / "treatment-page.html"

    if PRODUCT_SLUG.match(path):
        return EXPORT / "product-detail-page.html"

    if COURSE_SLUG.match(path):
        slug = path.strip("/").split("/")[-1]
        prebuilt = EXPORT / "utbildning" / f"{slug}.html"
        if prebuilt.is_file():
            return prebuilt
        return EXPORT / "course-page.html"

    if NYHET_SLUG.match(path):
        slug = path.strip("/").split("/")[-1]
        prebuilt = EXPORT / "nyheter" / f"{slug}.html"
        if prebuilt.is_file():
            return prebuilt
        return EXPORT / "blog-page.html"

    if path.startswith("/content/"):
        candidate = ROOT / path.lstrip("/")
        if candidate.is_file():
            return candidate

    # Static export assets at site root (production-style paths)
    for prefix in ("css", "js", "images", "fonts", "documents", "legal"):
        if path == f"/{prefix}" or path.startswith(f"/{prefix}/"):
            rel = path.lstrip("/")
            candidate = EXPORT / rel
            if candidate.is_file():
                return candidate

    # Legacy export paths (style guide, etc.)
    if path.startswith("/reference/webflow-export/"):
        candidate = ROOT / path.lstrip("/")
        if candidate.is_file():
            return candidate

    return None


def _inject_after_head(raw: str, snippet: str) -> str:
    if snippet in raw:
        return raw
    return raw.replace("<head>", "<head>\n" + snippet, 1)


def _inject_before_head_close(raw: str, snippet: str) -> str:
    if snippet in raw:
        return raw
    return raw.replace("</head>", snippet + "\n</head>", 1)


def _strip_async_webfont_loader(raw: str) -> str:
    raw = re.sub(
        r'<script src="https://ajax\.googleapis\.com/ajax/libs/webfont/1\.6\.26/webfont\.js"[^>]*></script>\s*',
        "",
        raw,
    )
    return re.sub(
        r'<script type="text/javascript">WebFont\.load\(\{[^<]*\}\);</script>\s*',
        "",
        raw,
    )


_NAVBAR_SCROLL_ANIM_RE = re.compile(
    r"  // =+\r?\n  // NAVBAR SCROLL ANIMATION\r?\n  // =+\r?\n"
    r'  const navbar = document\.querySelector\("\.navbar2_component"\);[\s\S]*?^  \}\r?\n',
    re.MULTILINE,
)

_WEBFLOW_IX_PREROLL_STYLE = re.compile(
    r"<style>@media[^<]*w-mod-js:not\(\.w-mod-ix\)[^<]*</style>\s*",
    re.IGNORECASE,
)


def _strip_navbar_scroll_animation(raw: str) -> str:
    """Full-width nav — drop legacy pill shrink (GSAP scale on scroll)."""
    return _NAVBAR_SCROLL_ANIM_RE.sub("", raw)


def _strip_webflow_ix_preroll_styles(raw: str) -> str:
    """Remove Webflow export IX initial-state styles that hide content before ix2 boots."""
    return _WEBFLOW_IX_PREROLL_STYLE.sub("", raw)


def nyhet_slug_from_path(request_path: str) -> str | None:
    path = unquote(request_path.split("?", 1)[0])
    if path.endswith("/") and path != "/":
        path = path.rstrip("/")
    m = re.match(r"^/nyheter/([^/]+)$", path)
    return m.group(1) if m else None


def hydrate_blog_post_response(raw: str, request_path: str) -> str:
    slug = nyhet_slug_from_path(request_path)
    if not slug:
        return raw
    from hydrate_blog_post import hydrate_blog_post

    return hydrate_blog_post(raw, slug)


def course_slug_from_path(request_path: str) -> str | None:
    path = unquote(request_path.split("?", 1)[0])
    if path.endswith("/") and path != "/":
        path = path.rstrip("/")
    m = re.match(r"^/utbildning/([^/]+)$", path)
    return m.group(1) if m else None


def hydrate_course_page_response(raw: str, request_path: str) -> str:
    slug = course_slug_from_path(request_path)
    if not slug:
        return raw
    if f'data-vivaci-course-hydrated="{slug}"' in raw:
        return raw
    from hydrate_course_page import hydrate_course_page

    return hydrate_course_page(raw, slug)


def _is_home_html(raw: str) -> bool:
    return 'id="vivaci-home-hero"' in raw


def _is_course_html(raw: str) -> bool:
    return "data-vivaci-course-enroll" in raw and "academy-hero-image" in raw


def _is_treatment_html(raw: str) -> bool:
    return 'data-vivaci-section="hero"' in raw


def _is_shop_html(raw: str) -> bool:
    return 'id="vivaci-shop"' in raw or 'id="vivaci-product"' in raw


def wrap_html(raw: str) -> bytes:
    if "<head>" in raw:
        if "vivaci-fonts.css" not in raw:
            raw = _inject_after_head(
                raw,
                "\n".join(
                    [
                        '<script src="/js/vivaci-fonts.js"></script>',
                        '<link rel="preload" href="/fonts/dm-sans-latin.woff2" as="font" type="font/woff2" crossorigin>',
                        '<link rel="preload" href="/fonts/dm-sans-latin-ext.woff2" as="font" type="font/woff2" crossorigin>',
                        '<link href="/css/vivaci-fonts.css" rel="stylesheet" type="text/css">',
                    ]
                ),
            )
        raw = _strip_async_webfont_loader(raw)
        raw = _strip_navbar_scroll_animation(raw)
        raw = _strip_webflow_ix_preroll_styles(raw)
        raw = _inject_after_head(raw, '<base href="/">')
        _locale_tag = (
            '<script src="/js/vivaci-locale-routing.js" type="text/javascript"></script>'
        )
        if "vivaci-locale-routing.js" not in raw:
            if "vivaci-i18n.js" in raw:
                raw = re.sub(
                    r"(<script[^>]*vivaci-i18n\.js[^>]*></script>)",
                    _locale_tag + r"\n\1",
                    raw,
                    count=1,
                )
            else:
                raw = _inject_after_head(raw, _locale_tag)
        if "vivaci-i18n.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-i18n.js" type="text/javascript" defer></script>',
            )
        if "vivaci-content-fetch.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-content-fetch.js" type="text/javascript" defer></script>',
            )
        if 'data-vivaci-field="legal-body"' in raw and "vivaci-legal-page.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-legal-page.js" type="text/javascript" defer></script>',
            )
        if "vivaci-motion.css" not in raw:
            raw = _inject_after_head(
                raw,
                '<link href="/css/vivaci-motion.css" rel="stylesheet" type="text/css">',
            )
        raw = _inject_after_head(
            raw,
            '<script src="/js/nav-mobile.js" type="text/javascript" defer></script>',
        )
        if "vivaci-i18n.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-i18n.js" type="text/javascript" defer></script>',
            )
        if "vivaci-nav-actions.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-nav-actions.js" type="text/javascript" defer></script>',
            )
        if "navbar2_component" in raw and "vivaci-nav-scroll.js" not in raw:
            home_boot = ""
            if 'id="vivaci-home-hero"' in raw:
                home_boot = (
                    '<script>document.documentElement.setAttribute("data-vivaci-page","home");</script>\n'
                )
            raw = _inject_after_head(
                raw,
                home_boot
                + '<script src="/js/vivaci-nav-scroll.js" type="text/javascript" defer></script>',
            )
        if (
            not _is_course_html(raw)
            and "treatment-finder.js" not in raw
            and (
                _is_home_html(raw)
                or "data-vivaci-category-finder" in raw
                or 'id="vivaci-treatment-finder"' in raw
            )
        ):
            raw = _inject_after_head(
                raw,
                '<script src="/js/treatment-finder.js" type="text/javascript" defer></script>',
            )
        needs_treatment_imagery = (
            _is_treatment_html(raw)
            or "data-vivaci-category-finder" in raw
            or 'id="vivaci-treatment-finder"' in raw
        )
        if needs_treatment_imagery and "vivaci-treatment-images.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-treatment-images.js" type="text/javascript" defer></script>',
            )
        if not _is_course_html(raw) and "vivaci-placeholders.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-placeholders.js" type="text/javascript" defer></script>',
            )
        if _is_home_html(raw) and "homepage-featured-treatments.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/homepage-featured-treatments.js" type="text/javascript" defer></script>',
            )
        if _is_home_html(raw) and "homepage-copy.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/homepage-copy.js" type="text/javascript" defer></script>',
            )
        if _is_home_html(raw) and "homepage-problems-slider.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/homepage-problems-slider.js" type="text/javascript" defer></script>',
            )
        if _is_home_html(raw) and "vivaci-logo-marquee.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-logo-marquee.js" type="text/javascript" defer></script>',
            )
        if _is_home_html(raw) and "homepage-brands-marquee.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/homepage-brands-marquee.js" type="text/javascript" defer></script>',
            )
        if _is_home_html(raw) and "vivaci-home-blog.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-home-blog.js" type="text/javascript" defer></script>',
            )
        if "vivaci-footer.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-footer.js" type="text/javascript" defer></script>',
            )
        if "vivaci-motion.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-motion.js" type="text/javascript" defer></script>',
            )
        if "vivaci-section-reveals-off.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-section-reveals-off.js" type="text/javascript" defer></script>',
            )
        if "vivaci-page-transition.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-page-transition.js" type="text/javascript" defer></script>',
            )
        if "vivaci-quiz.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-quiz.js" type="text/javascript" defer></script>',
            )
        if 'src="/js/vivaci-faq-accordion.js"' not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-faq-accordion.js" type="text/javascript" defer></script>',
            )
        if 'src="/js/vivaci-course-enroll.js"' not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-course-enroll.js" type="text/javascript" defer></script>',
            )
        needs_swiper = "swiper-tuesday" in raw or "swiper3" in raw or 'class="swiper ' in raw
        if needs_swiper and "swiper-bundle.min.js" not in raw:
            raw = _inject_after_head(
                raw,
                "\n".join(
                    [
                        '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">',
                        '<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>',
                    ]
                ),
            )
        if needs_swiper and "vivaci-swiper-arrows.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-swiper-arrows.js" type="text/javascript" defer></script>',
            )
        if needs_swiper and "vivaci-swiper-tuesday.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-swiper-tuesday.js" type="text/javascript" defer></script>',
            )
        if "swiper3" in raw and "vivaci-swiper-blog.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-swiper-blog.js" type="text/javascript" defer></script>',
            )
        if "vivaci-image.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-image.js" defer></script>',
            )
        if (
            _is_shop_html(raw)
            and "vivaci-shopify-client.js" not in raw
            and "shopify-webshop.js" not in raw
        ):
            if "vivaci-i18n.js" not in raw:
                raw = _inject_after_head(
                    raw,
                    '<script src="/js/vivaci-i18n.js" type="text/javascript" defer></script>',
                )
            if "vivaci-nav-actions.js" not in raw:
                raw = _inject_after_head(
                    raw,
                    '<script src="/js/vivaci-nav-actions.js" type="text/javascript" defer></script>',
                )
            raw = _inject_after_head(
                raw,
                "\n".join(
                    [
                        '<script src="/js/vivaci-shopify-client.js" defer></script>',
                        '<script src="/js/vivaci-shopify-cart.js" defer></script>',
                        '<script src="/js/shopify-webshop.js" defer></script>',
                        '<script src="/js/shopify-product-page.js" defer></script>',
                    ]
                ),
            )
        if "vivaci.css" not in raw:
            raw = _inject_before_head_close(
                raw,
                '<link href="/css/vivaci.css" rel="stylesheet" type="text/css">',
            )
        raw = _inject_after_head(
            raw,
            "\n".join(
                [
                    "<style>",
                    "html{background-color:var(--vivaci-surface-page,#fff)}",
                    "html.vivaci-page-loading body,html.vivaci-page-ready body{opacity:1}",
                    "</style>",
                    "<script>(function(){var r=document.documentElement,n='vivaci-internal-nav';"
                    "try{if(sessionStorage.getItem(n)){r.classList.add('vivaci-page-nav');"
                    "sessionStorage.removeItem(n);}}catch(e){}"
                    "r.classList.add('vivaci-page-loading');})();</script>",
                ]
            ),
        )
    if "</body>" in raw:
        body_scripts: list[str] = []
        if "webflow.js" not in raw:
            body_scripts.extend(
                [
                    '<script src="https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js?site=6ad6ed7027482e411574e817" type="text/javascript" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossorigin="anonymous"></script>',
                    '<script src="/js/webflow.js" type="text/javascript"></script>',
                    '<script src="/js/vivaci-section-reveals-off.js" type="text/javascript"></script>',
                    '<script src="/js/nav-preview.js" type="text/javascript"></script>',
                ]
            )
        elif "vivaci-section-reveals-off.js" not in raw:
            body_scripts.append(
                '<script src="/js/vivaci-section-reveals-off.js" type="text/javascript"></script>'
            )
        if "vivaci-nav-dropdown-fix.js" not in raw:
            body_scripts.append(
                '<script src="/js/vivaci-nav-dropdown-fix.js" type="text/javascript"></script>'
            )
        if "nav-dropdown.js" not in raw and "gsap@3" in raw:
            body_scripts.append(
                '<script src="/js/nav-dropdown.js" type="text/javascript"></script>'
            )
        if body_scripts:
            raw = raw.replace("</body>", "\n".join(body_scripts) + "\n</body>", 1)

    raw = re.sub(
        r'src="(?:\.\./)?images/logo-vivaci-dark\.webp"',
        'src="/images/logo-vivaci-dark.webp"',
        raw,
    )

    return raw.encode("utf-8")


def _path_suffix(path: str) -> str:
    clean = path.split("?", 1)[0].split("#", 1)[0]
    return Path(clean).suffix.lower()


def redirect_content_admin(path: str) -> tuple[int, dict[str, str], bytes] | None:
    """Footer /content-admin → treatment-pages dashboard (local Next or same origin)."""
    parsed_path = unquote(path.split("?", 1)[0].split("#", 1)[0])
    _locale, route_path = split_locale_prefix(parsed_path)
    if route_path.rstrip("/") != "/content-admin":
        return None
    origin = CONTENT_ADMIN_ORIGIN.strip()
    if not origin or origin.lower() in {"same-origin", "same", "production"}:
        target = "/treatment-pages"
    elif origin.startswith("/"):
        target = f"{origin.rstrip('/')}/treatment-pages"
    elif "://" in origin:
        target = f"{origin.rstrip('/')}/treatment-pages"
    else:
        target = f"http://{origin}/treatment-pages"
    return 302, {"Location": target, "Content-Length": "0"}, b""


def build_get_response(request_path: str) -> tuple[int, dict[str, str], bytes]:
    """Return (status, headers, body) for a GET request path (no query string)."""
    parsed_path = unquote(request_path.split("?", 1)[0].split("#", 1)[0])
    _locale, route_path = split_locale_prefix(parsed_path)
    file_path = resolve_file(route_path)

    if file_path is None or not file_path.is_file():
        if _path_suffix(parsed_path) in ASSET_SUFFIXES:
            body = f"Not found: {parsed_path}".encode("utf-8")
            return 404, {"Content-Type": "text/plain; charset=utf-8"}, body
        if not NOT_FOUND_HTML.is_file():
            body = f"Not found: {parsed_path}".encode("utf-8")
            return 404, {"Content-Type": "text/plain; charset=utf-8"}, body
        raw_html = NOT_FOUND_HTML.read_text(encoding="utf-8")
        body = wrap_html(raw_html)
        return (
            404,
            {"Content-Type": "text/html; charset=utf-8", "Content-Length": str(len(body))},
            body,
        )

    suffix = file_path.suffix.lower()
    if suffix in {".html", ".htm"}:
        raw_html = file_path.read_text(encoding="utf-8")
        slug = course_slug_from_path(route_path)
        if slug and file_path.name in ("course-page.html", f"{slug}.html"):
            raw_html = hydrate_course_page_response(raw_html, route_path)
        nslug = nyhet_slug_from_path(route_path)
        if nslug and file_path.name in ("blog-page.html", f"{nslug}.html"):
            raw_html = hydrate_blog_post_response(raw_html, route_path)
        if file_path.name == "prislista.html":
            from hydrate_prislista import hydrate_prislista

            raw_html = hydrate_prislista(raw_html)
        body = wrap_html(raw_html)
        return (
            200,
            {"Content-Type": "text/html; charset=utf-8", "Content-Length": str(len(body))},
            body,
        )

    data = file_path.read_bytes()
    ctype = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
    return 200, {"Content-Type": ctype, "Content-Length": str(len(data))}, data


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        print(f"{self.address_string()} {fmt % args}")

    def _read_body(self) -> bytes:
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            return b""
        return self.rfile.read(length)

    def _send(self, status: int, headers: dict[str, str], body: bytes, extra_cookies: list[tuple[str, str]] | None = None) -> None:
        self.send_response(status)
        for key, value in headers.items():
            self.send_header(key, value)
        if extra_cookies:
            from vivaci_admin.api import format_set_cookie

            for name, value in extra_cookies:
                self.send_header("Set-Cookie", format_set_cookie(name, value))
        self.end_headers()
        self.wfile.write(body)

    def _handle_admin(self, method: str) -> None:
        from vivaci_admin.api import handle_admin_api, handle_admin_static

        parsed = urlparse(self.path)
        path = unquote(parsed.path.split("?", 1)[0])

        if method == "GET":
            static = handle_admin_static(path)
            if static is not None:
                self._send(*static)
                return

        if path.startswith("/admin/api"):
            body = self._read_body() if method in ("POST", "PUT", "PATCH") else b""
            cookie = self.headers.get("Cookie")
            status, headers, payload, cookies = handle_admin_api(method, path, body, cookie)
            self._send(status, headers, payload, cookies)
            return

        if method == "GET":
            status, headers, body = build_get_response(parsed.path)
            self._send(status, headers, body)
            return

        self._send(405, {"Content-Type": "text/plain; charset=utf-8"}, b"Method not allowed")

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = unquote(parsed.path.split("?", 1)[0])
        redirected = redirect_content_admin(path)
        if redirected is not None:
            self._send(*redirected)
            return
        if parsed.path == "/admin" or parsed.path.startswith("/admin/"):
            self._handle_admin("GET")
            return
        status, headers, body = build_get_response(parsed.path)
        self._send(status, headers, body)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith("/admin/api"):
            self._handle_admin("POST")
            return
        self._send(405, {"Content-Type": "text/plain; charset=utf-8"}, b"Method not allowed")

    def do_PUT(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith("/admin/api"):
            self._handle_admin("PUT")
            return
        self._send(405, {"Content-Type": "text/plain; charset=utf-8"}, b"Method not allowed")


def main() -> None:
    from vivaci_admin import auth

    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print("Legacy Python site server (prefer `npm run dev` at repo root for one localhost).")
    print(f"Vivaci site → http://localhost:{PORT}/")
    print(f"Legacy Python admin → http://localhost:{PORT}/admin")
    print(f"/content-admin → /treatment-pages (same origin when CONTENT_ADMIN_ORIGIN=same-origin)")
    if auth.auth_required():
        print("Admin: password required (VIVACI_ADMIN_PASSWORD)")
    else:
        print("Admin: no password (set VIVACI_ADMIN_PASSWORD to enable login)")
    print("Unknown page URLs → 404.html (HTTP 404)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
