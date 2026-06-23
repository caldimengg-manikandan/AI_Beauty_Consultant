"""
predictor.py — DEPRECATED, UNUSED.

This module's predict_skin_conditions() always returned hard-coded dummy
values (acne=0.1, pigmentation=0.1, dryness=0.1) and was never actually
called anywhere in the codebase (the dead import in app/api/routes.py has
been removed). Real skin analysis now lives in app/ml/analysis_cv.py
(analyze_skin_cv), backed by app/ml/skin_model_loader.py for the trained
DenseNet model plus an OpenCV/K-means heuristic fallback.

Kept only so any external script that might still import this module
doesn't hard-crash; it intentionally does nothing useful. Safe to delete
once you've confirmed nothing references it in your own scripts/notebooks.
"""


def predict_skin_conditions(face_img):
    raise NotImplementedError(
        "predictor.predict_skin_conditions() is deprecated and unused. "
        "Use app.ml.analysis_cv.analyze_skin_cv() instead."
    )
