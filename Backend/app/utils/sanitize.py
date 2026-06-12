"""
sanitize.py — Strip HTML/script tags from free-text user inputs.
Additive utility — no existing code modified.
"""
import re

_TAG_RE   = re.compile(r"<[^>]+>")
_SCRIPT_RE = re.compile(r"<script[\s\S]*?</script>", re.IGNORECASE)

BANNED_PATTERNS = [
    re.compile(r"<script", re.IGNORECASE),
    re.compile(r"javascript:", re.IGNORECASE),
    re.compile(r"on\w+\s*=", re.IGNORECASE),   # onclick=, onmouseover=, etc.
    re.compile(r"<iframe", re.IGNORECASE),
    re.compile(r"<object", re.IGNORECASE),
    re.compile(r"<embed", re.IGNORECASE),
]


def sanitize_text(value: str, field_name: str = "field") -> str:
    """
    Raise ValueError if the input contains HTML injection patterns.
    Otherwise return the stripped, trimmed value.
    Raises FastAPI HTTPException with 422 so it surfaces as a validation error.
    """
    if not isinstance(value, str):
        return value
    value = value.strip()
    for pattern in BANNED_PATTERNS:
        if pattern.search(value):
            from fastapi import HTTPException
            raise HTTPException(
                status_code=422,
                detail=f"Invalid characters detected in '{field_name}'. "
                       "HTML tags and script injection are not permitted."
            )
    return value


def sanitize_dict(data: dict, fields: list) -> dict:
    """Sanitize multiple free-text fields in a dict in-place."""
    for field in fields:
        if field in data and data[field] is not None:
            data[field] = sanitize_text(str(data[field]), field)
    return data
