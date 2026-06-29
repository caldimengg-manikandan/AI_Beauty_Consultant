import logging
import logging.config
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ── Structured logging configuration ─────────────────────────────────────────
_LOG_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json_like": {
            "format": '{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","msg":"%(message)s"}',
            "datefmt": "%Y-%m-%dT%H:%M:%S",
        },
        "simple": {
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            "datefmt": "%H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "simple",
            "stream": "ext://sys.stdout",
        },
    },
    "root": {
        "level": "WARNING",
        "handlers": ["console"],
    },
    "loggers": {
        "beauty_api": {"level": "INFO",    "propagate": True},
        "uvicorn":    {"level": "WARNING", "propagate": True},
        "fastapi":    {"level": "WARNING", "propagate": True},
    },
}
logging.config.dictConfig(_LOG_CONFIG)


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Fix OpenBLAS Memory Allocation Error (Needs to be in main.py for Uvicorn worker to pick it up)
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["TF_FORCE_GPU_ALLOW_GROWTH"] = "true"

# 1️⃣ CREATE APP FIRST
app = FastAPI(
    title="AI Beauty Consultant Backend",
    version="1.0"
)

# 2️⃣ ADD MIDDLEWARE — environment-specific origin allowlist.
# Previously this list always included the three localhost dev origins, even
# in production, alongside allow_credentials=True — meaning a credentialed
# CORS request from "http://localhost:3000" would be honored by a live
# production deployment. Now: production only allows explicitly configured
# domains (FRONTEND_URL and/or CORS_ALLOWED_ORIGINS); the localhost dev
# origins are only added outside production, so local/demo runs work exactly
# as before this change.
_ENVIRONMENT = (os.getenv("ENVIRONMENT") or os.getenv("APP_ENV") or "development").strip().lower()
_IS_PRODUCTION = _ENVIRONMENT in ("production", "prod")

ALLOWED_ORIGINS = []

if not _IS_PRODUCTION:
    ALLOWED_ORIGINS += [
        "http://localhost:3000",
        "https://localhost:3000",
        "http://127.0.0.1:3000",
    ]

_frontend_url = os.getenv("FRONTEND_URL", "" if _IS_PRODUCTION else "http://localhost:3000")
if _frontend_url:
    ALLOWED_ORIGINS.append(_frontend_url)

# Optional comma-separated list for additional production domains
# (e.g. "https://app.example.com,https://www.example.com").
_extra_origins = os.getenv("CORS_ALLOWED_ORIGINS", "")
if _extra_origins:
    ALLOWED_ORIGINS += [o.strip() for o in _extra_origins.split(",") if o.strip()]

if _IS_PRODUCTION and not ALLOWED_ORIGINS:
    logging.getLogger("beauty_api").warning(
        "No CORS origins configured for production (set FRONTEND_URL and/or "
        "CORS_ALLOWED_ORIGINS) — credentialed cross-origin requests from the "
        "frontend will be rejected by the browser until this is set."
    )

# Ensure we don't have duplicates and remove any '*' if credentials are True
ALLOWED_ORIGINS = list(set([o for o in ALLOWED_ORIGINS if o and o != "*"]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# 3️⃣ IMPORT ROUTERS AFTER app EXISTS
from app.api.routes import router as analysis_router
from app.api.auth_routes import router as auth_router
from app.api.settings_routes import router as settings_router
from app.api.password_routes import router as password_router
from app.api.twofa_routes import router as twofa_router
from app.api.premium_routes import router as premium_router
from app.api.appointment_routes import router as appointment_router
from app.api.virtual_routes import router as virtual_router
from app.api.admin_routes import router as admin_router
from app.api.expert_routes import router as expert_router
from app.api.routine_routes import router as routine_router
from app.api.progress_routes import router as progress_router
from app.api.report_routes import router as report_router
from app.api.onboarding_routes import router as onboarding_router
from app.api.affiliate_routes import router as affiliate_router
from app.api.notification_routes import router as notification_router
from app.api.in_app_notifications import router as in_app_notif_router  # NEW — additive
from app.api.gamification_routes import router as gamification_router
from app.api.ingredient_routes import router as ingredient_router
from app.api.translation_routes import router as translation_router
from app.api.salon_routes import router as salon_router
from app.api.salon_service_routes import router as salon_service_router  # NEW — additive
from app.utils.rate_limiter import RateLimiterMiddleware  # NEW — additive
from app.api.payment_routes import router as payment_router

# ── New Enterprise Routers ────────────────────────────────────────────────────
from app.api.staff_routes import router as staff_router
from app.api.coupon_routes import router as coupon_router
from app.api.loyalty_routes import router as loyalty_router
from app.api.support_routes import router as support_router
from app.api.campaign_routes import router as campaign_router
from app.api.ecommerce_routes import router as ecommerce_router
from app.api.insights_routes import router as insights_router
from app.api.reels_routes import router as reels_router
from app.api.waitlist_routes import router as waitlist_router
from app.api.webhook_routes import router as webhook_router
from app.api.chat_routes import router as chat_router
from app.api.form_routes import router as form_router
from app.api.orders_routes import router as orders_router

# ── Phase 1 New Feature Routers ───────────────────────────────────────────────
from app.api.passport_routes import router as passport_router
from app.api.noshow_routes import router as noshow_router
from app.api.user_dashboard_routes import router as user_dashboard_router

# 4️⃣ REGISTER ROUTERS
app.include_router(auth_router)
app.include_router(analysis_router)
app.include_router(settings_router)
app.include_router(password_router)
app.include_router(twofa_router)
app.include_router(premium_router)
app.include_router(appointment_router)
app.include_router(virtual_router)
app.include_router(admin_router)
app.include_router(expert_router)
app.include_router(routine_router)
app.include_router(progress_router)
app.include_router(report_router)
app.include_router(onboarding_router)
app.include_router(affiliate_router)
app.include_router(notification_router)
app.include_router(in_app_notif_router)  # NEW — additive
app.include_router(gamification_router)
app.include_router(ingredient_router)
app.include_router(translation_router)
app.include_router(salon_router)
app.include_router(salon_service_router)   # NEW — additive

# ── Startup event: create MongoDB indexes ─────────────────────────────────────
@app.on_event("startup")
async def _create_sync_indexes():
    try:
        from app.utils.indexes import create_sync_indexes, create_app_indexes
        from app.mongodb.collections import salons_collection, salon_events_collection
        from app.mongodb.client import db
        create_sync_indexes(salons_collection, salon_events_collection)
        create_app_indexes(db)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Startup index creation skipped: {e}")


# ── Startup event: report memory headroom for ML models (no models are force-
# loaded here — they stay lazy and load on first use, gated by
# app/core/model_memory_guard.py — this just logs visibility into what to expect) ──
@app.on_event("startup")
async def _log_model_memory_headroom():
    try:
        from app.core.model_memory_guard import get_total_ram_gb
        _startup_log = logging.getLogger("beauty_api.startup")
        total_ram = get_total_ram_gb()
        _startup_log.info(
            f"Host memory: {total_ram:.2f}GB total. Skin/face-shape CNN models load lazily "
            f"on first analysis request if memory allows (see GET /api/admin/model-status)."
        )
    except Exception as e:
        logging.getLogger(__name__).warning(f"Startup memory check skipped: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# CORRELATION ID MIDDLEWARE
# Injects X-Request-ID into every request/response for log tracing.
# Additive — does not alter any existing request or response body.
# ─────────────────────────────────────────────────────────────────────────────
import uuid as _uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as _Request

class _CorrelationIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: _Request, call_next):
        req_id = request.headers.get("X-Request-ID") or str(_uuid.uuid4())[:8]
        response = await call_next(request)
        response.headers["X-Request-ID"] = req_id
        return response

app.add_middleware(_CorrelationIDMiddleware)
app.add_middleware(RateLimiterMiddleware)  # NEW — additive


# ─────────────────────────────────────────────────────────────────────────────
# GLOBAL EXCEPTION HANDLERS
# Additive — FastAPI's default error handling is preserved for non-matched cases.
# ─────────────────────────────────────────────────────────────────────────────
import logging as _logging
from fastapi import Request as _FRequest
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

_log = _logging.getLogger("beauty_api")


@app.exception_handler(RequestValidationError)
async def _validation_error_handler(_req: _FRequest, exc: RequestValidationError):
    """Return structured 422 with field-level details instead of FastAPI default."""
    details = []
    for err in exc.errors():
        field = " -> ".join(str(loc) for loc in err.get("loc", []))
        details.append({"field": field, "message": err.get("msg", "")})
    return JSONResponse(
        status_code=422,
        content={
            "status":  "error",
            "code":    "VALIDATION_ERROR",
            "message": "One or more fields failed validation",
            "details": details,
            "request_id": _req.headers.get("X-Request-ID", ""),
        },
    )


@app.exception_handler(Exception)
async def _global_error_handler(_req: _FRequest, exc: Exception):
    """Catch-all: log full traceback, return generic 500 to client."""
    import traceback
    req_id = _req.headers.get("X-Request-ID", "unknown")
    _log.error(
        "Unhandled exception",
        extra={"request_id": req_id, "path": str(_req.url), "error": str(exc)},
        exc_info=True,
    )
    # Check for MongoDB errors
    err_str = str(type(exc).__name__)
    if "Mongo" in err_str or "pymongo" in err_str.lower():
        return JSONResponse(
            status_code=503,
            content={
                "status":      "error",
                "code":        "SERVICE_UNAVAILABLE",
                "message":     "Database temporarily unavailable. Please retry in a moment.",
                "retry_after": 30,
                "request_id":  req_id,
            },
        )
    return JSONResponse(
        status_code=500,
        content={
            "status":     "error",
            "code":       "INTERNAL_ERROR",
            "message":    "An unexpected error occurred. Our team has been notified.",
            "request_id": req_id,
        },
    )
app.include_router(payment_router)

# ── New Enterprise Routers ────────────────────────────────────────────────────
app.include_router(staff_router)
app.include_router(coupon_router)
app.include_router(loyalty_router)
app.include_router(support_router)
app.include_router(campaign_router)
app.include_router(ecommerce_router)
app.include_router(insights_router)
app.include_router(reels_router)
app.include_router(waitlist_router)
app.include_router(webhook_router)
app.include_router(chat_router)
app.include_router(form_router)
app.include_router(orders_router)

# ── Phase 1 New Feature Routers ───────────────────────────────────────────────
app.include_router(passport_router)
app.include_router(noshow_router)
app.include_router(user_dashboard_router)

# 5️⃣ AI Recommendations endpoint
from fastapi import Body
from app.ml.beauty_recommender import get_recommendations_from_analysis

@app.post("/api/recommend-services")
def recommend_services(analysis_result: dict = Body(...)):
    """Given a skin analysis result, return recommended beauty services & salon types."""
    return get_recommendations_from_analysis(analysis_result)

# 5️⃣ SERVE STATIC FILES
# ──────────────────────────────────────────────────────────────────────────────
# IMPORTANT: static/uploads is intentionally NOT mounted as a public StaticFiles
# route.  All face-scan and annotated images are biometric data; they must only
# be accessed through the time-limited, HMAC-signed endpoint:
#
#   GET /analyze/secure-image/{filename}?exp=<unix_ts>&sig=<hmac_hex>
#
# That endpoint (app/api/routes.py) verifies the signature and expiry before
# serving the file, so direct guessing or sharing of raw /static/uploads/...
# URLs is no longer possible.
#
# If you need truly public static assets (e.g. a logo or a public salon banner)
# place them under static/public/ and mount ONLY that sub-directory below.
import os
from fastapi.staticfiles import StaticFiles

os.makedirs("static/uploads", exist_ok=True)
os.makedirs("static/public", exist_ok=True)

# Only mount the intentionally-public sub-directory, not the whole /static tree.
app.mount("/static/public", StaticFiles(directory="static/public"), name="static_public")

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "AI Beauty Consultant Backend is Live"}

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Server is running. Visit /docs for API documentation."}
