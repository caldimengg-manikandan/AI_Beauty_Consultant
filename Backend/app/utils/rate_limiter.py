"""
rate_limiter.py — Production-grade sliding-window rate limiter middleware.

Strategy:
  1. Tries to use Redis (via redis-py) for multi-worker, persistent counters.
  2. Falls back to the in-memory implementation automatically if Redis is
     unavailable or not configured — so the app never crashes on startup.

Redis configuration (optional — add to .env):
  REDIS_URL=redis://localhost:6379/0      # default if not set
  REDIS_RATE_LIMIT_ENABLED=true          # set to false to force in-memory mode

Rate limits (same as previous in-memory implementation — unchanged):
  /api/salons/register        — 3 per 24h  per IP
  /api/salons/owner/update    — 60 per hour per IP
  /api/salon-services/owner/  — 120 per hour per IP
  /api/salon-services/owner/upload — 20 per hour per IP
  /api/salons/ (GET)          — 300 per minute per IP (unauthenticated)
  /api/salons/book-slot       — 10 per hour per IP
  /api/auth/login             — 20 per 15 minutes per IP (brute-force guard)
  /api/auth/customer/signup   — 5 per hour per IP
"""

import logging
import os
import time
import threading
from collections import defaultdict, deque
from typing import Callable, Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

_log = logging.getLogger("beauty_api.rate_limiter")

# ── Rate limit rules ──────────────────────────────────────────────────────────
# (path_prefix, method, max_calls, window_seconds)
_RULES = [
    ("/api/salons/register",               "POST",  3,   86400),   # 3 / 24h
    ("/api/salon-services/owner/upload",   "POST",  20,  3600),    # 20 / h
    ("/api/salon-services/owner/",         "POST",  120, 3600),    # 120 / h
    ("/api/salon-services/owner/",         "PUT",   120, 3600),    # 120 / h
    ("/api/salon-services/owner/",         "PATCH", 120, 3600),    # 120 / h
    ("/api/salon-services/owner/",         "DELETE",120, 3600),    # 120 / h
    ("/api/salons/owner/update",           "PUT",   60,  3600),    # 60 / h
    ("/api/salons/book-slot",              "POST",  10,  3600),    # 10 / h
    ("/api/salons/",                       "GET",   300, 60),      # 300 / min
    ("/api/auth/login",                    "POST",  20,  900),     # 20 / 15min (brute-force guard)
    ("/api/auth/customer/signup",          "POST",  5,   3600),    # 5 / h
    ("/api/auth/shop-owner/signup",        "POST",  5,   3600),    # 5 / h
]


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    return forwarded.split(",")[0].strip() or (
        str(request.client.host) if request.client else "unknown"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# REDIS BACKEND
# ═══════════════════════════════════════════════════════════════════════════════

def _try_get_redis():
    """
    Attempt to connect to Redis. Returns a Redis client on success, None on failure.
    Logs a warning (not error) if Redis is unavailable — the fallback handles it.
    """
    if os.getenv("REDIS_RATE_LIMIT_ENABLED", "true").lower() == "false":
        return None

    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    try:
        import redis  # type: ignore
        client = redis.from_url(redis_url, socket_connect_timeout=1, socket_timeout=1)
        client.ping()
        _log.info("Rate limiter: Redis backend connected at %s", redis_url)
        return client
    except Exception as exc:
        _log.warning(
            "Rate limiter: Redis unavailable (%s). "
            "Falling back to in-memory rate limiter. "
            "Add REDIS_URL to .env and install redis-py for production use.",
            exc
        )
        return None


class _RedisRateLimiter:
    """Sliding-window rate limiter backed by Redis sorted sets."""

    def __init__(self, client):
        self._redis = client

    def is_limited(self, ip: str, path: str, method: str) -> tuple[bool, Optional[tuple]]:
        now = time.time()
        for rule in _RULES:
            prefix, rule_method, max_calls, window = rule
            if rule_method != method or not path.startswith(prefix):
                continue

            key = f"rl:{ip}:{prefix}:{method}"
            try:
                pipe = self._redis.pipeline()
                # Remove expired entries
                pipe.zremrangebyscore(key, 0, now - window)
                # Count current entries
                pipe.zcard(key)
                # Add this request
                pipe.zadd(key, {str(now): now})
                # Set expiry on the key
                pipe.expire(key, window + 1)
                results = pipe.execute()
                count = results[1]  # after removing old entries
                if count >= max_calls:
                    return True, rule
            except Exception as exc:
                _log.warning("Redis rate check failed for %s: %s — allowing request", key, exc)
                return False, None
        return False, None


# ═══════════════════════════════════════════════════════════════════════════════
# IN-MEMORY FALLBACK BACKEND
# ═══════════════════════════════════════════════════════════════════════════════

class _InMemoryRateLimiter:
    """Sliding-window rate limiter using in-memory deques (single-process only)."""

    def __init__(self):
        self._lock = threading.Lock()
        self._calls: dict = defaultdict(deque)

    def is_limited(self, ip: str, path: str, method: str) -> tuple[bool, Optional[tuple]]:
        now = time.monotonic()
        with self._lock:
            for rule in _RULES:
                prefix, rule_method, max_calls, window = rule
                if rule_method != method or not path.startswith(prefix):
                    continue
                key = (ip, prefix, method)
                dq = self._calls[key]
                # Remove expired timestamps
                while dq and now - dq[0] > window:
                    dq.popleft()
                if len(dq) >= max_calls:
                    return True, rule
                dq.append(now)
        return False, None


# ═══════════════════════════════════════════════════════════════════════════════
# MIDDLEWARE (uses whichever backend is available)
# ═══════════════════════════════════════════════════════════════════════════════

# Initialise once at import time
_redis_client = _try_get_redis()
_backend = (
    _RedisRateLimiter(_redis_client)
    if _redis_client is not None
    else _InMemoryRateLimiter()
)
_backend_name = "Redis" if _redis_client is not None else "in-memory"
_log.info("Rate limiter using %s backend", _backend_name)


class RateLimiterMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        ip = _client_ip(request)
        path = request.url.path
        method = request.method.upper()

        limited, rule = _backend.is_limited(ip, path, method)
        if limited:
            prefix, _, max_calls, window = rule
            window_label = (
                f"{window // 3600}h" if window >= 3600
                else f"{window // 60}m" if window >= 60
                else f"{window}s"
            )
            _log.warning(
                "Rate limit exceeded — IP=%s path=%s method=%s limit=%d/%s backend=%s",
                ip, path, method, max_calls, window_label, _backend_name,
            )
            return JSONResponse(
                status_code=429,
                content={
                    "status": "error",
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": f"Too many requests. Limit is {max_calls} per {window_label}. Please slow down.",
                    "retry_after": window,
                },
                headers={"Retry-After": str(window)},
            )

        return await call_next(request)
