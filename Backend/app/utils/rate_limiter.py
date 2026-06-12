"""
rate_limiter.py — In-memory sliding-window rate limiter middleware.
Additive — does NOT affect any existing endpoint behaviour.
No external dependency required (pure stdlib collections + threading).

Limits (per IP):
  /api/salons/register        — 3 per 24h
  /api/salons/owner/update    — 60 per hour
  /api/salon-services/owner/  — 120 per hour
  /api/salon-services/owner/upload — 20 per hour
  /api/salons/ (GET)          — 300 per minute (unauthenticated)
  /api/salons/book-slot       — 10 per hour
"""

import time
import threading
from collections import defaultdict, deque
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


# ── Rule: (path_prefix, method, max_calls, window_seconds) ───────────────────
_RULES = [
    ("/api/salons/register",               "POST",  3,   86400),   # 3 / 24h
    ("/api/salon-services/owner/upload",   "POST",  20,  3600),    # 20 / h
    ("/api/salon-services/owner/",         "POST",  120, 3600),    # 120 / h
    ("/api/salon-services/owner/",         "PUT",   120, 3600),    # 120 / h
    ("/api/salon-services/owner/",         "PATCH", 120, 3600),    # 120 / h
    ("/api/salon-services/owner/",         "DELETE",120, 3600),    # 120 / h
    ("/api/salons/owner/update",           "PUT",   60,  3600),    # 60 / h
    ("/api/salons/book-slot",              "POST",  10,  3600),    # 10 / h
    ("/api/salons/",                       "GET",   300, 60),      # 300 / min (GET)
]

_lock  = threading.Lock()
# key: (ip, path_prefix, method) -> deque of call timestamps
_calls: dict = defaultdict(deque)


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    return forwarded.split(",")[0].strip() or (
        str(request.client.host) if request.client else "unknown"
    )


def _is_limited(ip: str, path: str, method: str) -> tuple:
    """
    Returns (limited: bool, rule: tuple | None).
    Uses a sliding window — timestamps older than the window are discarded.
    """
    now = time.monotonic()
    with _lock:
        for rule in _RULES:
            prefix, rule_method, max_calls, window = rule
            if rule_method != method:
                continue
            if not path.startswith(prefix):
                continue
            key = (ip, prefix, method)
            q = _calls[key]
            # Evict timestamps outside the window
            while q and (now - q[0]) > window:
                q.popleft()
            if len(q) >= max_calls:
                return True, rule
            q.append(now)
            return False, None
    return False, None


class RateLimiterMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        ip     = _client_ip(request)
        path   = request.url.path
        method = request.method.upper()

        limited, rule = _is_limited(ip, path, method)
        if limited:
            _, _, max_calls, window = rule
            return JSONResponse(
                status_code=429,
                content={
                    "status":  "error",
                    "code":    "RATE_LIMIT_EXCEEDED",
                    "message": f"Too many requests. Limit: {max_calls} per {window}s.",
                    "retry_after": window,
                },
                headers={"Retry-After": str(window)},
            )
        return await call_next(request)
