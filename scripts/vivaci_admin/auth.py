"""Signed session cookies for the Vivaci content admin."""

from __future__ import annotations

import hmac
import hashlib
import os
import time

COOKIE_NAME = "vivaci_admin_session"
SESSION_MAX_AGE_S = 60 * 60 * 24 * 7


def admin_secret() -> bytes:
    raw = os.environ.get("VIVACI_ADMIN_SECRET") or os.environ.get("VIVACI_ADMIN_PASSWORD")
    if not raw:
        raw = "vivaci-dev-insecure-secret"
    return raw.encode("utf-8")


def configured_password() -> str | None:
    return os.environ.get("VIVACI_ADMIN_PASSWORD") or None


def default_dev_password() -> str:
    return "vivaci"


def auth_required() -> bool:
    """When false, admin is open on localhost (no login). Set VIVACI_ADMIN_PASSWORD to require login."""
    return bool(configured_password())


def check_password(submitted: str) -> bool:
    if not auth_required():
        return True
    expected = configured_password() or ""
    return hmac.compare_digest(submitted or "", expected)


def session_always_valid() -> bool:
    return not auth_required()


def issue_session_cookie_value() -> str:
    expires = int(time.time()) + SESSION_MAX_AGE_S
    payload = str(expires)
    sig = hmac.new(admin_secret(), payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{payload}.{sig}"


def session_valid(cookie_value: str | None) -> bool:
    if not cookie_value or "." not in cookie_value:
        return False
    payload, sig = cookie_value.rsplit(".", 1)
    expected = hmac.new(admin_secret(), payload.encode("utf-8"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return False
    try:
        expires = int(payload)
    except ValueError:
        return False
    return expires >= int(time.time())


def parse_cookie_header(header: str | None, name: str = COOKIE_NAME) -> str | None:
    if not header:
        return None
    prefix = name + "="
    for part in header.split(";"):
        part = part.strip()
        if part.startswith(prefix):
            return part[len(prefix) :]
    return None
