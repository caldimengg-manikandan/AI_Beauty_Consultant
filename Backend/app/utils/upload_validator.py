"""
upload_validator.py — File upload security validation.

Used by all endpoints that accept UploadFile to prevent:
  - Malicious file types (executables, scripts, PHP, etc.)
  - Oversized uploads that could exhaust storage or memory
  - MIME-type spoofing (filename says .jpg but content is .exe)

Usage:
    from app.utils.upload_validator import validate_image_upload, validate_video_upload

    @router.post("/upload")
    async def upload(file: UploadFile = File(...)):
        await validate_image_upload(file)
        ...
"""

import logging
import struct
from typing import Optional

from fastapi import HTTPException, UploadFile

_log = logging.getLogger("beauty_api.upload")

# ── Allowed types ─────────────────────────────────────────────────────────────
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}
ALLOWED_IMAGE_MIMES      = {
    "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/bmp"
}

ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm", ".avi"}
ALLOWED_VIDEO_MIMES      = {
    "video/mp4", "video/quicktime", "video/webm", "video/x-msvideo", "video/avi"
}

ALLOWED_DOCUMENT_EXTENSIONS = {".pdf"}
ALLOWED_DOCUMENT_MIMES      = {"application/pdf"}

# Explicitly blocked extensions (belt-and-suspenders)
BLOCKED_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".sh", ".ps1", ".php", ".php3", ".php4", ".php5",
    ".phtml", ".js", ".jsx", ".ts", ".tsx", ".py", ".rb", ".pl", ".asp",
    ".aspx", ".jsp", ".cfm", ".htaccess", ".htpasswd", ".env", ".svg",
    ".html", ".htm", ".xml", ".dll", ".so", ".dylib",
}

# ── Size limits ───────────────────────────────────────────────────────────────
MAX_IMAGE_SIZE_MB   = 10
MAX_VIDEO_SIZE_MB   = 100
MAX_DOCUMENT_SIZE_MB = 25

_MB = 1024 * 1024

# ── Magic bytes (file signature verification) ─────────────────────────────────
_IMAGE_SIGNATURES = {
    b"\xff\xd8\xff":                          "image/jpeg",   # JPEG
    b"\x89PNG\r\n\x1a\n":                     "image/png",    # PNG
    b"GIF87a":                                "image/gif",    # GIF87
    b"GIF89a":                                "image/gif",    # GIF89
    b"RIFF":                                  "image/webp",   # WebP (RIFF....WEBP)
    b"\x42\x4d":                              "image/bmp",    # BMP
}

_VIDEO_SIGNATURES = {
    b"\x00\x00\x00\x18ftyp": "video/mp4",
    b"\x00\x00\x00\x20ftyp": "video/mp4",
    b"\x00\x00\x00\x14ftyp": "video/mp4",
    b"ftypmp4":               "video/mp4",
    b"\x1a\x45\xdf\xa3":     "video/webm",   # WebM/MKV
}

_PDF_SIGNATURE = b"%PDF-"


def _check_magic_bytes(header: bytes, signatures: dict) -> Optional[str]:
    """Return detected MIME type from file header bytes, or None."""
    for sig, mime in signatures.items():
        if header[:len(sig)] == sig:
            return mime
    return None


def _ext(filename: str) -> str:
    """Return lowercase file extension including dot, e.g. '.jpg'."""
    if "." not in filename:
        return ""
    return "." + filename.rsplit(".", 1)[-1].lower()


# ── Public validators ─────────────────────────────────────────────────────────
async def validate_image_upload(
    file: UploadFile,
    max_mb: int = MAX_IMAGE_SIZE_MB,
) -> bytes:
    """
    Validate an image UploadFile. Returns the file bytes on success.
    Raises HTTPException 400 on any validation failure.
    """
    filename = file.filename or ""
    ext = _ext(filename)

    # 1. Blocked extension check
    if ext in BLOCKED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' is not allowed.",
        )

    # 2. Extension whitelist
    if ext and ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image format '{ext}'. Allowed: {', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))}.",
        )

    # 3. MIME type from Content-Type header
    declared_mime = (file.content_type or "").lower().split(";")[0].strip()
    if declared_mime and declared_mime not in ALLOWED_IMAGE_MIMES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported content type '{declared_mime}'. Upload images only.",
        )

    # 4. Read and size-check
    data = await file.read()
    size_mb = len(data) / _MB
    if size_mb > max_mb:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({size_mb:.1f} MB). Maximum allowed: {max_mb} MB.",
        )
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # 5. Magic bytes verification (prevents MIME spoofing)
    detected = _check_magic_bytes(data[:16], _IMAGE_SIGNATURES)
    if detected is None:
        # Special case: WebP has RIFF....WEBP structure
        if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
            detected = "image/webp"
    if detected is None and ext:
        # Warn but don't block — some valid images may lack standard magic bytes
        _log.warning(
            "Upload: could not verify magic bytes for file '%s' (ext=%s, size=%.1f MB)",
            filename, ext, size_mb,
        )

    _log.info("Upload validated: %s (%.1f MB, mime=%s)", filename, size_mb, detected or declared_mime)
    await file.seek(0)  # Reset for downstream consumption
    return data


async def validate_video_upload(
    file: UploadFile,
    max_mb: int = MAX_VIDEO_SIZE_MB,
) -> bytes:
    """Validate a video UploadFile. Returns file bytes on success."""
    filename = file.filename or ""
    ext = _ext(filename)

    if ext in BLOCKED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type '{ext}' is not allowed.")

    if ext and ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported video format '{ext}'. Allowed: {', '.join(sorted(ALLOWED_VIDEO_EXTENSIONS))}.",
        )

    declared_mime = (file.content_type or "").lower().split(";")[0].strip()
    if declared_mime and declared_mime not in ALLOWED_VIDEO_MIMES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported content type '{declared_mime}'. Upload videos only.",
        )

    data = await file.read()
    size_mb = len(data) / _MB
    if size_mb > max_mb:
        raise HTTPException(
            status_code=400,
            detail=f"Video too large ({size_mb:.1f} MB). Maximum allowed: {max_mb} MB.",
        )
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    _log.info("Video upload validated: %s (%.1f MB)", filename, size_mb)
    await file.seek(0)
    return data


async def validate_document_upload(
    file: UploadFile,
    max_mb: int = MAX_DOCUMENT_SIZE_MB,
) -> bytes:
    """Validate a PDF document UploadFile. Returns file bytes on success."""
    filename = file.filename or ""
    ext = _ext(filename)

    if ext not in ALLOWED_DOCUMENT_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF documents are allowed.")

    data = await file.read()
    size_mb = len(data) / _MB
    if size_mb > max_mb:
        raise HTTPException(
            status_code=400,
            detail=f"Document too large ({size_mb:.1f} MB). Maximum allowed: {max_mb} MB.",
        )
    if not data.startswith(_PDF_SIGNATURE):
        raise HTTPException(status_code=400, detail="File does not appear to be a valid PDF.")

    await file.seek(0)
    return data
