"""
inference.py — DEPRECATED, UNUSED.

run_inference() always returned hard-coded fake results and is not imported
anywhere in the codebase (verified via repo-wide search). Real analysis runs
through app/ml/analysis_cv.py and app/ml/face_shape_predictor.py instead.

Kept only so any external script that might still import this module
doesn't hard-crash. Safe to delete once you've confirmed nothing references it.
"""


def run_inference(image):
    raise NotImplementedError(
        "pipeline.inference.run_inference() is deprecated and unused. "
        "Use app.ml.analysis_cv / app.ml.face_shape_predictor instead."
    )
