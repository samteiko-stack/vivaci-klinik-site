"""Vercel serverless entry — same routing as scripts/dev-server.py."""

from __future__ import annotations

import importlib.util
import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

_spec = importlib.util.spec_from_file_location(
    "vivaci_dev_server", SCRIPTS / "dev-server.py"
)
_mod = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
_spec.loader.exec_module(_mod)
build_get_response = _mod.build_get_response
redirect_content_admin = _mod.redirect_content_admin


def _request_path(handler: BaseHTTPRequestHandler) -> str:
    parsed = urlparse(handler.path)
    if parsed.path in ("/api", "/api/index", "/api/index.py"):
        qs = parse_qs(parsed.query)
        segments = qs.get("path", [""])[0]
        segments = unquote(segments).strip("/")
        return f"/{segments}" if segments else "/"
    return parsed.path


class handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        path = _request_path(self)
        redirected = redirect_content_admin(path)
        if redirected is not None:
            status, headers, body = redirected
        else:
            status, headers, body = build_get_response(path)
        self.send_response(status)
        for key, value in headers.items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)
