"""
jwt_handler.py — JWT creation, verification, and FastAPI dependency injection.

Security rules enforced:
  - JWT_SECRET must come from the environment (never hardcoded).
  - Secret must be at least 32 characters (256-bit equivalent).
  - Access tokens expire after ACCESS_TOKEN_EXPIRE_MINUTES (default 480 for long shop-owner sessions).
  - Logs a startup WARNING (not crash) if the secret is the known-weak default.
"""

import logging
import os
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

_log = logging.getLogger("beauty_api.auth")

# ── Secret loading ────────────────────────────────────────────────────────────
_WEAK_DEFAULTS = {"super_secret_key", "secret", "changeme", "password", "jwt_secret"}

SECRET_KEY: str = os.getenv("JWT_SECRET", "")

# Production must fail fast on a missing/weak secret rather than silently
# running with one — an ephemeral or weak secret in production means
# sessions break on every restart/redeploy and tokens are easier to forge.
# Non-production environments keep the original lenient dev fallback (loud
# warning + ephemeral key) so local/demo runs without a configured .env
# continue to work exactly as before this change.
_ENVIRONMENT = (os.getenv("ENVIRONMENT") or os.getenv("APP_ENV") or "development").strip().lower()
_IS_PRODUCTION = _ENVIRONMENT in ("production", "prod")

if not SECRET_KEY or SECRET_KEY.lower() in _WEAK_DEFAULTS or len(SECRET_KEY) < 32:
    if _IS_PRODUCTION:
        raise RuntimeError(
            "JWT_SECRET must be set to a random value of at least 32 characters in production. "
            "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
        )
    if not SECRET_KEY:
        _log.critical(
            "JWT_SECRET environment variable is not set. "
            "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
        )
        # Fall back to a random key so the app starts in dev, but tokens won't survive restarts.
        import secrets as _secrets
        SECRET_KEY = _secrets.token_hex(32)
    else:
        _log.warning(
            "JWT_SECRET appears weak (known default or < 32 chars). "
            "Replace it in your .env file with a 256-bit random value before deploying to production. "
            "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
        )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))  # 8h for shop-owner sessions
REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))


# ── Token creation ────────────────────────────────────────────────────────────
def create_access_token(data: dict) -> str:
    """Create a signed JWT access token with an expiry claim."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create a longer-lived refresh token (stored server-side or in httpOnly cookie)."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ── Token verification ────────────────────────────────────────────────────────
def verify_access_token(token: str) -> dict | None:
    """Decode and validate a JWT. Returns the payload dict or None on failure."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Reject refresh tokens presented as access tokens
        if payload.get("type") == "refresh":
            _log.warning("Refresh token presented as access token — rejected.")
            return None
        return payload
    except JWTError as exc:
        _log.debug("JWT verification failed: %s", exc)
        return None


def verify_refresh_token(token: str) -> dict | None:
    """Decode and validate a refresh token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError as exc:
        _log.debug("Refresh token verification failed: %s", exc)
        return None


# ── FastAPI dependency ────────────────────────────────────────────────────────
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """FastAPI dependency — decode token and return payload, or raise 401."""
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload
