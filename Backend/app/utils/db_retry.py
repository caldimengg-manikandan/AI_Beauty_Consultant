"""
db_retry.py — Retry wrapper for MongoDB write operations.
Additive utility — used by salon_service_routes.py write endpoints.
Does NOT wrap existing salon_routes.py operations (non-breaking).

Strategy: 3 attempts with exponential backoff (0.5s → 1s → 2s).
On all failures: raises the original exception to the caller,
which either surfaces a 503 or is caught by the global handler.
"""
import time
import logging
from functools import wraps
from typing import Callable, Any

logger = logging.getLogger(__name__)

_MAX_RETRIES    = 3
_BACKOFF_BASE   = 0.5   # seconds


def with_retry(func: Callable) -> Callable:
    """
    Decorator — retries a synchronous function up to _MAX_RETRIES times
    when a pymongo-related exception occurs.

    Usage:
        @with_retry
        def _do_write():
            salons_collection.update_one(...)
        _do_write()
    """
    @wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        last_exc = None
        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                return func(*args, **kwargs)
            except Exception as exc:
                last_exc = exc
                err_type = type(exc).__name__
                # Retry only on pymongo / network errors; re-raise app errors immediately
                is_mongo_err = "Mongo" in err_type or "pymongo" in err_type.lower()                                or "ConnectionFailure" in err_type or "Timeout" in err_type
                if not is_mongo_err:
                    raise
                wait = _BACKOFF_BASE * (2 ** (attempt - 1))
                logger.warning(
                    f"MongoDB write attempt {attempt}/{_MAX_RETRIES} failed "
                    f"({err_type}). Retrying in {wait}s..."
                )
                if attempt < _MAX_RETRIES:
                    time.sleep(wait)
        logger.error(f"MongoDB write failed after {_MAX_RETRIES} attempts: {last_exc}")
        raise last_exc
    return wrapper


def retry_write(collection_fn: Callable, *args, **kwargs) -> Any:
    """
    Functional form for one-off retried writes without the decorator.

    Usage:
        retry_write(salons_collection.update_one, {"id": sid}, {"$set": data})
    """
    @with_retry
    def _call():
        return collection_fn(*args, **kwargs)
    return _call()
