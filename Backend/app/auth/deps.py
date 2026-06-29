# NOTE: This module previously re-implemented JWT decoding with its OWN
# fallback secret (generated independently of app.auth.jwt_handler's
# SECRET_KEY whenever JWT_SECRET wasn't set). That meant a token signed via
# jwt_handler.create_access_token() could be silently REJECTED by anything
# depending on this module's get_current_user(), and vice versa, because the
# two modules would disagree on the signing key. It also returned a
# different payload shape ({"email","role"}) than jwt_handler's
# get_current_user() ({"sub", ...the full claims dict}).
#
# Nothing in the codebase currently imports from app.auth.deps (verified via
# grep across app/) so this was dead code rather than a live bug — but it was
# left in place as a landmine for the next person who imports it. Fixed by
# delegating entirely to app.auth.jwt_handler, the single source of truth for
# JWT_SECRET / token verification, instead of duplicating it. Existing
# callers of get_current_user()/require_admin() from THIS module (if any are
# added later) still work the same way; they just no longer risk a
# split-secret bug.



from fastapi import Depends, HTTPException

# Single source of truth for the JWT secret/algorithm/verification logic.
from app.auth.jwt_handler import (
    SECRET_KEY,   # re-exported for any existing external reference
    ALGORITHM,    # re-exported for any existing external reference
    oauth2_scheme,
    get_current_user as _jwt_handler_get_current_user,
)


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Delegates to app.auth.jwt_handler.get_current_user (the authoritative
    implementation) so this module can never disagree with it on the signing
    key or on what counts as a valid token."""
    return _jwt_handler_get_current_user(token)


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """Kept for backward compatibility with this module's old shape. The
    underlying jwt_handler payload uses 'role' the same way the old
    duplicated implementation here did, so this check is unchanged."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
