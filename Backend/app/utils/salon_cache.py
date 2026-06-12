"""
salon_cache.py — Lightweight TTL cache for salon read endpoints.
Uses a pure-Python implementation so no extra dependency is required.
Additive module — does NOT modify any existing code.
"""
import time, hashlib, json, threading

class _TTLCache:
    """Minimal thread-safe TTL cache (no external dependency)."""
    def __init__(self, maxsize: int, ttl: float):
        self._maxsize = maxsize
        self._ttl = ttl
        self._store: dict = {}  # key -> (value, expires_at)
        self._lock = threading.Lock()

    def _evict(self):
        now = time.monotonic()
        expired = [k for k, (_, exp) in self._store.items() if exp <= now]
        for k in expired:
            del self._store[k]
        # If still over capacity, remove oldest entries
        if len(self._store) >= self._maxsize:
            oldest = sorted(self._store, key=lambda k: self._store[k][1])
            for k in oldest[:max(1, len(self._store) - self._maxsize + 1)]:
                del self._store[k]

    def get(self, key, default=None):
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return default
            val, exp = entry
            if time.monotonic() > exp:
                del self._store[key]
                return default
            return val

    def __setitem__(self, key, value):
        with self._lock:
            self._evict()
            self._store[key] = (value, time.monotonic() + self._ttl)

    def pop(self, key, default=None):
        with self._lock:
            entry = self._store.pop(key, None)
            return entry[0] if entry else default

    def clear(self):
        with self._lock:
            self._store.clear()

    def keys(self):
        with self._lock:
            return list(self._store.keys())


# ── Cache instances ───────────────────────────────────────────────────────────
_list_cache   = _TTLCache(maxsize=500, ttl=60)   # listing queries  (60 s)
_detail_cache = _TTLCache(maxsize=300, ttl=120)  # single salon     (120 s)
_slot_cache   = _TTLCache(maxsize=300, ttl=30)   # slot availability (30 s)


def _fingerprint(obj: dict) -> str:
    return hashlib.sha256(
        json.dumps(obj, sort_keys=True, default=str).encode()
    ).hexdigest()[:24]


# ── List cache ────────────────────────────────────────────────────────────────
def get_list_cache(params: dict):
    return _list_cache.get(_fingerprint(params))

def set_list_cache(params: dict, value):
    _list_cache[_fingerprint(params)] = value

def invalidate_list_cache():
    _list_cache.clear()


# ── Detail cache ──────────────────────────────────────────────────────────────
def get_detail_cache(salon_id: str):
    return _detail_cache.get(salon_id)

def set_detail_cache(salon_id: str, value):
    _detail_cache[salon_id] = value

def invalidate_detail_cache(salon_id: str):
    _detail_cache.pop(salon_id, None)


# ── Slot cache ────────────────────────────────────────────────────────────────
def get_slot_cache(salon_id: str, date: str):
    return _slot_cache.get(f"{salon_id}:{date}")

def set_slot_cache(salon_id: str, date: str, value):
    _slot_cache[f"{salon_id}:{date}"] = value

def invalidate_slot_cache_for_salon(salon_id: str):
    keys = [k for k in _slot_cache.keys() if k.startswith(f"{salon_id}:")]
    for k in keys:
        _slot_cache.pop(k, None)


# ── Combined invalidation ─────────────────────────────────────────────────────
def invalidate_salon(salon_id: str, city: str = None):
    """Evict all cache entries for a salon. Call after any mutating operation.
    Cache failures are silently swallowed — they are never fatal."""
    try:
        invalidate_detail_cache(salon_id)
        invalidate_slot_cache_for_salon(salon_id)
        invalidate_list_cache()  # conservative: clear all list pages
    except Exception:
        pass
