"""
signed_url.py — Time-limited, tamper-proof signing for face/annotated scan
image filenames.

Why this exists: face-analysis images (the user's own photo + the annotated
landmark overlay) were previously served straight from the public
`/static/uploads/...` mount with no authentication or expiry at all — anyone
who guessed or obtained a filename (e.g. from a shared link, browser history,
or a leaked DB export) could view that biometric image forever. Moving the
whole upload directory behind a login would have broken every other feature
that already relies on those same public static URLs (salon gallery photos,
reels videos, expert/marketplace thumbnails — all intentionally public).

Instead, only the face/annotated scan images get a short-lived HMAC-signed
URL (?exp=...&sig=...). Anything else under /static/uploads is untouched.
The signature is bound to the exact filename and an expiry timestamp, so a
copied link stops working after SIGNED_IMAGE_URL_TTL_SECONDS. Callers
regenerate a fresh link every time they hand one out (analyze, history,
expert review queue), so normal in-app usage never sees an expired link.
"""
import hashlib
import hmac
import os
import time

from app.auth.jwt_handler import SECRET_KEY as _SIGNING_SECRET

SIGNED_IMAGE_URL_TTL_SECONDS = int(os.getenv("SIGNED_IMAGE_URL_TTL_SECONDS", "3600"))  # 1 hour


def sign_filename(filename: str, ttl_seconds: int | None = None) -> tuple[str, int]:
    """Returns (signature, expiry_unix_ts) for the given filename."""
    expiry = int(time.time()) + (ttl_seconds if ttl_seconds is not None else SIGNED_IMAGE_URL_TTL_SECONDS)
    sig = hmac.new(
        _SIGNING_SECRET.encode(), f"{filename}:{expiry}".encode(), hashlib.sha256
    ).hexdigest()
    return sig, expiry


def verify_signed_filename(filename: str, expiry: int, signature: str) -> bool:
    """Validates that `signature` was produced by sign_filename(filename, ...)
    for this exact filename and expiry, and that it hasn't expired yet."""
    try:
        expiry = int(expiry)
    except (TypeError, ValueError):
        return False
    if int(time.time()) > expiry:
        return False
    expected = hmac.new(
        _SIGNING_SECRET.encode(), f"{filename}:{expiry}".encode(), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature or "")
