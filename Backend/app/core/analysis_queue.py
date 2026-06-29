"""
analysis_queue.py — Background job queue for the face-analysis pipeline.

Why this exists:
  The analysis endpoint executes several seconds of CPU-heavy OpenCV work and
  then one or two external LLM API calls inside the same thread that is serving
  the HTTP request.  On a deployment with a single Uvicorn worker (the typical
  Render free tier) this means:

    * The worker is completely blocked for the duration.
    * Any concurrent request from the same or a different user will queue behind
      it until the analysis finishes.
    * Under even light concurrent load the default 30-second Uvicorn request
      timeout is easily breached, returning a 503 to the client.

  This module provides a simple, zero-dependency background job queue:

    1. A thread-pool executor (default 2 workers) runs analysis tasks off the
       event loop so the async request handler is never blocked.
    2. The /analyze endpoint submits the task, immediately returns a job_id, and
       the client polls /analyze/status/{job_id} until it's done.
    3. Results are kept in an in-memory dict for RESULT_TTL_SECONDS then expired
       automatically.  On a single-process deployment (Render free tier) this is
       sufficient; for multi-worker deployments replace _jobs with a Redis-backed
       store (the interface is identical — just swap _jobs).

Usage:
    from app.core.analysis_queue import submit_analysis, get_job, JobStatus
"""

import logging
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from enum import Enum
from typing import Any, Callable, Optional

_log = logging.getLogger("beauty_api.analysis_queue")

# ── Configuration ─────────────────────────────────────────────────────────────
# Two workers: one can serve a running analysis while the second handles a
# queued request.  Raise this if the deployment has enough RAM for concurrent
# model loads (each analysis needs ~200–400 MB depending on models loaded).
_MAX_WORKERS = 2

# How long to keep a completed (or failed) result before evicting it.
RESULT_TTL_SECONDS = 600  # 10 minutes

# ── Job status enum ───────────────────────────────────────────────────────────
class JobStatus(str, Enum):
    PENDING   = "pending"
    RUNNING   = "running"
    DONE      = "done"
    ERROR     = "error"


# ── In-memory job store ───────────────────────────────────────────────────────
# Each entry: {"status": JobStatus, "result": Any, "error": str, "created_at": float}
_jobs: dict[str, dict] = {}
_jobs_lock = threading.Lock()

_executor = ThreadPoolExecutor(max_workers=_MAX_WORKERS, thread_name_prefix="analysis")


# ── Internal helpers ──────────────────────────────────────────────────────────

def _expire_old_jobs() -> None:
    """Remove jobs older than RESULT_TTL_SECONDS.  Called after every write."""
    now = time.monotonic()
    to_delete = [
        jid for jid, job in _jobs.items()
        if now - job["created_at"] > RESULT_TTL_SECONDS
    ]
    for jid in to_delete:
        del _jobs[jid]
        _log.debug("Expired analysis job %s", jid)


def _run_job(job_id: str, fn: Callable, *args, **kwargs) -> None:
    """Execute fn in a thread-pool worker, updating _jobs on completion/failure."""
    with _jobs_lock:
        if job_id in _jobs:
            _jobs[job_id]["status"] = JobStatus.RUNNING

    try:
        result = fn(*args, **kwargs)
        with _jobs_lock:
            if job_id in _jobs:
                _jobs[job_id]["status"] = JobStatus.DONE
                _jobs[job_id]["result"] = result
            _expire_old_jobs()
        _log.info("Analysis job %s completed successfully", job_id)
    except Exception as exc:
        _log.exception("Analysis job %s failed: %s", job_id, exc)
        with _jobs_lock:
            if job_id in _jobs:
                _jobs[job_id]["status"] = JobStatus.ERROR
                _jobs[job_id]["error"]  = "Analysis failed. Please try again."
            _expire_old_jobs()


# ── Public API ────────────────────────────────────────────────────────────────

def submit_analysis(fn: Callable, *args, **kwargs) -> str:
    """
    Submit a callable to the background thread pool and return a job_id.

    The callable runs in a separate thread — it must be thread-safe and must
    not use any async-only primitives.  The current analysis pipeline in
    app/api/routes.py already satisfies this (all sync functions).

    Returns:
        job_id (str) — a UUID the caller should return to the client.
    """
    job_id = uuid.uuid4().hex
    with _jobs_lock:
        _jobs[job_id] = {
            "status":     JobStatus.PENDING,
            "result":     None,
            "error":      None,
            "created_at": time.monotonic(),
        }
        _expire_old_jobs()

    _executor.submit(_run_job, job_id, fn, *args, **kwargs)
    _log.info("Submitted analysis job %s", job_id)
    return job_id


def get_job(job_id: str) -> Optional[dict]:
    """
    Return the current state of a job, or None if it doesn't exist / has expired.

    Return shape:
        {
            "status":  "pending" | "running" | "done" | "error",
            "result":  <any> | None,          # set when status == "done"
            "error":   <str> | None,          # set when status == "error"
        }
    """
    with _jobs_lock:
        job = _jobs.get(job_id)
        if job is None:
            return None
        return {
            "status": job["status"],
            "result": job["result"],
            "error":  job["error"],
        }
