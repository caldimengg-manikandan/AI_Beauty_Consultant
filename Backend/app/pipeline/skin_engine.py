"""
skin_engine.py — DEPRECATED, UNUSED.

analyze_skin() always returned hard-coded fake scores (50/50/50/50/50) and is
not imported anywhere in the codebase (verified via repo-wide search). Real
skin analysis runs through app/ml/analysis_cv.py's analyze_skin_cv().

Kept only so any external script that might still import this module
doesn't hard-crash. Safe to delete once you've confirmed nothing references it.
"""


def analyze_skin(face_roi):
    raise NotImplementedError(
        "pipeline.skin_engine.analyze_skin() is deprecated and unused. "
        "Use app.ml.analysis_cv.analyze_skin_cv() instead."
    )
