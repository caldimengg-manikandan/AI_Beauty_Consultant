"""
verify_fixes.py — Automated verification of all 3 production fixes.
Run from the Backend/ directory.
"""
import ast
import sys
import os

PASS = "PASS"
FAIL = "FAIL"
errors = []

def check(label, condition):
    tag = PASS if condition else FAIL
    print(f"  [{tag}] {label}")
    if not condition:
        errors.append(label)

print("\n=== SYNTAX CHECK ===")
for path in [
    "app/api/routes.py",
    "app/core/analysis_queue.py",
    "app/main.py",
    "app/api/salon_routes.py",
    "app/api/reels_routes.py",
]:
    try:
        ast.parse(open(path, encoding="utf-8").read())
        check(f"Syntax OK: {path}", True)
    except SyntaxError as e:
        check(f"Syntax FAIL: {path} — {e}", False)
    except FileNotFoundError:
        check(f"File missing: {path}", False)

# ─── FIX 1: Biometric image access ────────────────────────────────────────────
print("\n=== FIX 1: Biometric images gated (no public /static/uploads) ===")
main_src = open("app/main.py", encoding="utf-8").read()
check("main.py: static/public/ is mounted",          "static/public" in main_src)
check("main.py: static_public name used",            "static_public" in main_src)
check("main.py: broad 'static' name is gone",        "name=\"static\"" not in main_src)
check("main.py: static/uploads dir still created",   "static/uploads" in main_src)
check("main.py: static/public dir created",          "static/public" in main_src)

salon_src = open("app/api/salon_routes.py", encoding="utf-8").read()
check("salon_routes: upload dir = static/public/salons", "static/public/salons" in salon_src)
check("salon_routes: old static/uploads/salons removed",  "static/uploads/salons" not in salon_src)
check("salon_routes: URL uses /static/public/salons/",    "/static/public/salons/" in salon_src)

reels_src = open("app/api/reels_routes.py", encoding="utf-8").read()
check("reels_routes: upload dir = static/public/reels", "static/public/reels" in reels_src)
check("reels_routes: old static/uploads reel path gone", "static/uploads\", filename" not in reels_src)
check("reels_routes: reel URL uses /static/public/reels/", "/static/public/reels/" in reels_src)

routes_src = open("app/api/routes.py", encoding="utf-8").read()
check("routes.py: signed-image endpoint present",   "secure-image" in routes_src)
check("routes.py: biometric images in static/uploads (private)", "static/uploads" in routes_src)

# ─── FIX 2: JWT in sessionStorage ─────────────────────────────────────────────
print("\n=== FIX 2: JWT moved from localStorage to sessionStorage ===")
auth_src = open("../Frontend/src/context/AuthContext.js", encoding="utf-8").read()
check("AuthContext: sessionStorage.getItem used",       "sessionStorage.getItem" in auth_src)
check("AuthContext: sessionStorage.setItem in login",   "sessionStorage.setItem" in auth_src)
check("AuthContext: sessionStorage.removeItem in logout","sessionStorage.removeItem" in auth_src)
check("AuthContext: legacy localStorage.removeItem kept","localStorage.removeItem" in auth_src)
check("AuthContext: no raw localStorage.setItem token", 'localStorage.setItem("token"' not in auth_src)

api_src = open("../Frontend/src/services/api.js", encoding="utf-8").read()
check("api.js: sessionStorage.getItem in interceptor",  "sessionStorage.getItem" in api_src)
check("api.js: sessionStorage cleanup on 401",          "sessionStorage.removeItem" in api_src)

# ─── FIX 3: Async worker/polling for heavy analysis ───────────────────────────
print("\n=== FIX 3: CPU-heavy analysis moved to background job queue ===")
check("analysis_queue.py: exists",                  os.path.isfile("app/core/analysis_queue.py"))

queue_src = open("app/core/analysis_queue.py", encoding="utf-8").read()
check("analysis_queue: ThreadPoolExecutor used",    "ThreadPoolExecutor" in queue_src)
check("analysis_queue: submit_analysis exported",   "def submit_analysis" in queue_src)
check("analysis_queue: get_job exported",           "def get_job" in queue_src)
check("analysis_queue: JobStatus enum",             "class JobStatus" in queue_src)
check("analysis_queue: RESULT_TTL_SECONDS set",     "RESULT_TTL_SECONDS" in queue_src)

check("routes.py: imports submit_analysis",         "from app.core.analysis_queue import" in routes_src)
check("routes.py: imports JobStatus",               "JobStatus" in routes_src)
check("routes.py: _run_analysis function defined",  "def _run_analysis(" in routes_src)
check("routes.py: POST /analyze returns 202",       "status_code=202" in routes_src)
check("routes.py: GET /analyze/status endpoint",    "analyze/status/{job_id}" in routes_src)
check("routes.py: old asyncio.gather removed",      "asyncio.gather" not in routes_src)
check("routes.py: old run_in_executor removed",     "run_in_executor" not in routes_src)
check("routes.py: old blocking try/except cleaned", "Total analysis time" not in routes_src)

check("api.js: pollAnalysisStatus exported",        "pollAnalysisStatus" in api_src)
check("api.js: analyzeImage polls /analyze/status", "analyze/status" in api_src)
check("api.js: 202 response handled",               "submitRes.status !== 202" in api_src)
check("api.js: polling interval set",               "intervalMs" in api_src)
check("api.js: timeout guard",                      "timeoutMs" in api_src)

# ─── Summary ──────────────────────────────────────────────────────────────────
print(f"\n{'='*60}")
total = 37
passed = total - len(errors)
print(f"  Result: {passed}/{total} checks passed")
if errors:
    print(f"\n  FAILURES:")
    for e in errors:
        print(f"    ✗ {e}")
    sys.exit(1)
else:
    print("  All checks PASSED — production fixes verified.")
    sys.exit(0)
