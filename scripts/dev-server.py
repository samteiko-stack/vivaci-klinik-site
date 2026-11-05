#!/usr/bin/env python3
"""
Vivaci site server — local dev and production (Railway).

  /                          → home
  /problem/{slug}            → treatment template
  /behandlingar              → treatment listing
  /utbildning                → course listing
  /utbildning/{slug}         → course template
  /nyheter                   → news listing
  /nyheter/{slug}            → blog post template
  /behandlingar/{slug}       → treatment template
  /plastikkirurgi            → home (listing TBD)
  /plastikkirurgi/{slug}     → treatment template
  /kontakt                   → contact page
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

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))
EXPORT = ROOT / "reference/webflow-export"
DEFAULT_PORT = 8765
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", str(DEFAULT_PORT)))

HTML_ROUTES: dict[str, str] = {
    "/": "index.html",
    "/kontakt": "kontakt.html",
    "/prislista": "prislista.html",
    "/behandlingar": "behandlingar.html",
    "/utbildning": "utbildning.html",
    "/plastikkirurgi": "index.html",
    "/problem": "index.html",
    "/faq": "index.html",
    "/produkter": "webshop.html",
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
    from hydrate_course_page import hydrate_course_page

    return hydrate_course_page(raw, slug)


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
        raw = _inject_after_head(raw, '<base href="/">')
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
        if "treatment-finder.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/treatment-finder.js" type="text/javascript" defer></script>',
            )
        if "vivaci-treatment-images.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-treatment-images.js" type="text/javascript" defer></script>',
            )
        if "vivaci-placeholders.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-placeholders.js" type="text/javascript" defer></script>',
            )
        if "homepage-featured-treatments.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/homepage-featured-treatments.js" type="text/javascript" defer></script>',
            )
        if "homepage-copy.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/homepage-copy.js" type="text/javascript" defer></script>',
            )
        if "homepage-problems-slider.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/homepage-problems-slider.js" type="text/javascript" defer></script>',
            )
        if "homepage-brands-marquee.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/homepage-brands-marquee.js" type="text/javascript" defer></script>',
            )
        if "vivaci-home-blog.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-home-blog.js" type="text/javascript" defer></script>',
            )
        if "vivaci-footer.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-footer.js" type="text/javascript" defer></script>',
            )
        if "vivaci-quiz.css" not in raw:
            raw = _inject_after_head(
                raw,
                '<link href="/css/vivaci-quiz.css" rel="stylesheet" type="text/css">',
            )
        if 'href="/css/vivaci-academy.css"' not in raw:
            raw = _inject_after_head(
                raw,
                '<link href="/css/vivaci-academy.css" rel="stylesheet" type="text/css">',
            )
        if "vivaci-motion.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-motion.js" type="text/javascript" defer></script>',
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
        if "vivaci-swiper.css" not in raw:
            raw = _inject_after_head(
                raw,
                '<link href="/css/vivaci-swiper.css" rel="stylesheet" type="text/css">',
            )
        if "vivaci-shop.css" not in raw:
            raw = _inject_after_head(
                raw,
                '<link href="/css/vivaci-shop.css" rel="stylesheet" type="text/css">',
            )
        if "vivaci-blog.css" not in raw:
            raw = _inject_after_head(
                raw,
                '<link href="/css/vivaci-blog.css" rel="stylesheet" type="text/css">',
            )
        if "vivaci-image.js" not in raw:
            raw = _inject_after_head(
                raw,
                '<script src="/js/vivaci-image.js" defer></script>',
            )
        if "vivaci-shopify-client.js" not in raw and "shopify-webshop.js" not in raw:
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
        raw = _inject_before_head_close(
            raw,
            "\n".join(
                [
                    '<link href="/css/nav-fixes.css" rel="stylesheet" type="text/css">',
                    '<link href="/css/vivaci-icons.css" rel="stylesheet" type="text/css">',
                ]
            ),
        )
        raw = _inject_after_head(
            raw,
            "\n".join(
                [
                    "<style>",
                    "html{background-color:#fff}",
                    "html.vivaci-page-loading:not(.vivaci-page-ready) body{opacity:0}",
                    "html.vivaci-page-ready body{opacity:1}",
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
                    '<script src="/js/nav-preview.js" type="text/javascript"></script>',
                ]
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


def build_get_response(request_path: str) -> tuple[int, dict[str, str], bytes]:
    """Return (status, headers, body) for a GET request path (no query string)."""
    parsed_path = unquote(request_path.split("?", 1)[0].split("#", 1)[0])
    file_path = resolve_file(parsed_path)

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
        slug = course_slug_from_path(parsed_path)
        if slug and file_path.name in ("course-page.html", f"{slug}.html"):
            raw_html = hydrate_course_page_response(raw_html, parsed_path)
        nslug = nyhet_slug_from_path(parsed_path)
        if nslug and file_path.name in ("blog-page.html", f"{nslug}.html"):
            raw_html = hydrate_blog_post_response(raw_html, parsed_path)
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

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        status, headers, body = build_get_response(parsed.path)
        self.send_response(status)
        for key, value in headers.items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Vivaci site → http://{HOST}:{PORT}/")
    print("Unknown page URLs → 404.html (HTTP 404)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
