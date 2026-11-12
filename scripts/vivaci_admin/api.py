"""HTTP handlers for /admin and /admin/api/*."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from vivaci_admin import auth
from vivaci_admin import store

ADMIN_DIR = Path(__file__).resolve().parents[2] / "admin"

JSON_HEADERS = {"Content-Type": "application/json; charset=utf-8"}


def _json_response(status: int, payload: Any) -> tuple[int, dict[str, str], bytes]:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    headers = {**JSON_HEADERS, "Content-Length": str(len(body))}
    return status, headers, body


def _read_json_body(body: bytes) -> dict[str, Any]:
    if not body:
        return {}
    try:
        data = json.loads(body.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise store.StoreError("Invalid JSON body") from exc
    if not isinstance(data, dict):
        raise store.StoreError("JSON body must be an object")
    return data


def _require_auth(cookie_header: str | None) -> None:
    token = auth.parse_cookie_header(cookie_header)
    if not auth.session_valid(token):
        raise store.StoreError("Unauthorized", 401)


def handle_admin_static(path: str) -> tuple[int, dict[str, str], bytes] | None:
    if path in ("/admin", "/admin/"):
        path = "/admin/index.html"
    if not path.startswith("/admin/"):
        return None
    rel = path[len("/admin/") :]
    if rel.startswith("api/"):
        return None
    if ".." in rel or rel.startswith("/"):
        return _json_response(404, {"error": "Not found"})
    file_path = ADMIN_DIR / rel
    if not file_path.is_file():
        return _json_response(404, {"error": "Not found"})
    data = file_path.read_bytes()
    ctype = "application/octet-stream"
    if rel.endswith(".html"):
        ctype = "text/html; charset=utf-8"
    elif rel.endswith(".css"):
        ctype = "text/css; charset=utf-8"
    elif rel.endswith(".js"):
        ctype = "application/javascript; charset=utf-8"
    return 200, {"Content-Type": ctype, "Content-Length": str(len(data))}, data


def handle_admin_api(
    method: str, path: str, body: bytes, cookie_header: str | None
) -> tuple[int, dict[str, str], bytes, list[tuple[str, str]]]:
    """
    Returns status, headers, body, extra Set-Cookie headers (name, value).
    """
    matched = store.match_api_path(path.split("?", 1)[0])
    if not matched:
        return *_json_response(404, {"error": "Not found"}), []

    extra_cookies: list[tuple[str, str]] = []

    try:
        if matched[0] == "session":
            if auth.session_always_valid():
                return *_json_response(200, {"authenticated": True, "authRequired": False}), []
            token = auth.parse_cookie_header(cookie_header)
            return *_json_response(
                200,
                {"authenticated": auth.session_valid(token), "authRequired": True},
            ), []

        if matched[0] == "login":
            if method != "POST":
                raise store.StoreError("Method not allowed", 405)
            if auth.session_always_valid():
                return *_json_response(200, {"ok": True, "skipped": True}), []
            payload = _read_json_body(body)
            password = str(payload.get("password") or "")
            if not auth.check_password(password):
                raise store.StoreError("Wrong password", 401)
            token = auth.issue_session_cookie_value()
            extra_cookies.append((auth.COOKIE_NAME, token))
            return *_json_response(200, {"ok": True}), extra_cookies

        if matched[0] == "logout":
            extra_cookies.append((auth.COOKIE_NAME, ""))
            return *_json_response(200, {"ok": True}), extra_cookies

        if not auth.session_always_valid():
            _require_auth(cookie_header)

        if matched[0] == "pages" and method == "GET":
            return *_json_response(200, {"pages": store.list_pages()}), []

        if matched[0] == "page":
            category, slug = matched[1], matched[2]
            if method == "GET":
                return *_json_response(200, store.load_page(category, slug)), []
            if method == "PUT":
                data = _read_json_body(body)
                store.save_page(category, slug, data)
                return *_json_response(200, {"ok": True}), []
            raise store.StoreError("Method not allowed", 405)

        raise store.StoreError("Not found", 404)

    except store.StoreError as exc:
        return *_json_response(exc.status, {"error": str(exc)}), extra_cookies


def format_set_cookie(name: str, value: str) -> str:
    if not value:
        return f"{name}=; Path=/admin; HttpOnly; SameSite=Lax; Max-Age=0"
    return (
        f"{name}={value}; Path=/admin; HttpOnly; SameSite=Lax; "
        f"Max-Age={auth.SESSION_MAX_AGE_S}"
    )
