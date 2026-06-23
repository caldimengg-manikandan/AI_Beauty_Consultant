"""
model_memory_guard.py — Shared memory-safety gate for heavy ML model loading.

Why this exists:
  This service runs on memory-constrained hosting (e.g. Render free tier,
  ~512MB RAM). Loading deep-learning frameworks (PyTorch, TensorFlow) and
  their model weights can consume several hundred MB each. If we import
  those frameworks or load model weights unconditionally, the process can
  be OOM-killed before it ever serves a request.

  Every heavy model loader in this codebase should call
  `has_sufficient_memory(...)` BEFORE importing torch/tensorflow — not just
  before loading the model weights. Importing the framework itself can cost
  100-400MB even with no model loaded yet, so the check must gate the
  import statement, not only the `.load_state_dict(...)` / `load_model(...)`
  call.

Usage:
    from app.core.model_memory_guard import has_sufficient_memory

    def _load_model(self):
        if not has_sufficient_memory(min_gb=1.0, label="FaceShapeModel"):
            return None
        import torch  # deferred — only imported once we know it's safe
        ...
"""

import logging
import os

_log = logging.getLogger("beauty_api.model_memory_guard")


def get_total_ram_gb() -> float:
    """Returns total system RAM in GB, or a conservative 0.0 if it can't be determined."""
    try:
        import psutil
        return psutil.virtual_memory().total / (1024 ** 3)
    except Exception as e:
        _log.warning(f"model_memory_guard: could not read system memory via psutil: {e}")
        return 0.0


def get_available_ram_gb() -> float:
    """Returns currently available (free-ish) system RAM in GB, or 0.0 if unknown."""
    try:
        import psutil
        return psutil.virtual_memory().available / (1024 ** 3)
    except Exception as e:
        _log.warning(f"model_memory_guard: could not read available memory via psutil: {e}")
        return 0.0


def has_sufficient_memory(min_gb: float, label: str = "model", env_override: str = None) -> bool:
    """
    Returns True if it's safe to import/load a heavy ML dependency.

    Args:
        min_gb: minimum *total* system RAM (in GB) required to attempt loading.
        label: human-readable name used in log messages (e.g. "SkinModel").
        env_override: name of an environment variable that, if set, overrides
            min_gb (lets ops tune thresholds per-deployment without a code change).

    This is intentionally conservative: if psutil is unavailable, or memory can't
    be read, we DO NOT attempt to load the heavy model — better to run in
    heuristic-fallback mode than to risk an OOM crash of the whole service.
    """
    if env_override:
        override_val = os.getenv(env_override)
        if override_val:
            try:
                min_gb = float(override_val)
            except ValueError:
                _log.warning(f"model_memory_guard: invalid {env_override}={override_val!r}, using default {min_gb}GB")

    total_ram = get_total_ram_gb()

    if total_ram <= 0.0:
        _log.warning(f"⚠️ {label}: Unable to determine system memory — skipping heavy model load as a precaution.")
        return False

    if total_ram < min_gb:
        _log.warning(
            f"⚠️ {label}: Low-memory environment detected ({total_ram:.2f}GB total RAM, "
            f"need >= {min_gb:.2f}GB). Skipping heavy model load — using fallback path instead."
        )
        return False

    _log.info(f"✅ {label}: Memory check passed ({total_ram:.2f}GB total RAM available, threshold {min_gb:.2f}GB).")
    return True
