"""
skin_model_loader.py — Lazy, memory-safe loader for the trained skin model.

Background:
  app/models/densenet_skin_best.h5 is a trained Keras model (per
  Backend/DATASET_GUIDE.md, a DenseNet-201 classifier trained on
  acne / normal / oily skin photos). It was previously never loaded —
  app/ml/analysis_cv.py hard-set `skin_model = None` during a PyTorch
  migration, so skin analysis silently ran on OpenCV heuristics only
  (K-means clustering, brightness/entropy stats) while still reporting
  results as if a trained model was involved.

  This loader brings the trained model back online, while staying safe on
  memory-constrained hosting (e.g. Render free tier):
    1. A memory guard runs BEFORE `tensorflow` is imported at all — importing
       TensorFlow can itself cost 200-400MB even before any model is loaded.
    2. The model is loaded with `tf.keras.models.load_model()`, which reads
       both architecture and weights from the .h5 file. This makes the loader
       architecture-agnostic — it does not need to match cnn_model.py's
       (currently different, MobileNetV2-based) `build_skin_model()` function.
    3. If loading fails for ANY reason (missing deps, missing file, corrupt
       weights, insufficient memory), this returns None and the caller falls
       back to the existing pure-CV heuristic path — exactly as before this
       change. No exception ever propagates out of this module.

  Class order assumption: training data folders are acne / normal / oily
  (alphabetical), which is the default class order Keras' ImageDataGenerator /
  image_dataset_from_directory uses. If the model was trained differently,
  update SKIN_CLASS_ORDER below to match — get_skin_model_status() and the
  admin model-status endpoint will report the loaded class order so this is
  easy to verify against real photos after deploying.
"""

import os
import logging
import numpy as np

from app.core.model_memory_guard import has_sufficient_memory

_log = logging.getLogger("beauty_api.skin_model_loader")

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../models/densenet_skin_best.h5")

# Matches Backend/DATASET_GUIDE.md training folder layout (alphabetical = Keras default)
SKIN_CLASS_ORDER = ["acne", "normal", "oily"]
SKIN_INPUT_SIZE = (224, 224)

_state = {
    "initialized": False,
    "model": None,
    "status": "NOT_LOADED",
}


def _load():
    if not has_sufficient_memory(min_gb=1.5, label="SkinModel(DenseNet)", env_override="SKIN_MODEL_MIN_RAM_GB"):
        _state["status"] = "SKIPPED_LOW_MEMORY"
        return None

    try:
        import tensorflow as tf
    except Exception as e:
        _log.warning(f"WARNING: SkinModel: tensorflow not available ({e}). Using heuristic fallback.")
        _state["status"] = "TENSORFLOW_NOT_AVAILABLE"
        return None

    if not os.path.exists(MODEL_PATH):
        _log.warning(f"WARNING: SkinModel: model file not found at {MODEL_PATH}")
        _state["status"] = "WEIGHTS_FILE_MISSING"
        return None

    try:
        model = tf.keras.models.load_model(MODEL_PATH, compile=False)
        _log.info(f"SUCCESS: SkinModel: Loaded {os.path.basename(MODEL_PATH)} "
                  f"(input={model.input_shape}, output={model.output_shape})")
        _state["status"] = "LOADED"
        return model
    except Exception as e:
        _log.warning(f"ERROR: SkinModel: failed to load model: {e}")
        _state["status"] = "LOAD_ERROR"
        return None


def get_skin_model():
    """Lazily loads and returns the trained skin model, or None if unavailable for any reason."""
    if not _state["initialized"]:
        _state["model"] = _load()
        _state["initialized"] = True
    return _state["model"]


def get_skin_model_status() -> str:
    """Returns a human-readable status string WITHOUT forcing a load attempt."""
    return _state["status"]


def predict_skin_probs(face_image_bgr):
    """
    Runs the trained skin model on a face-region image (OpenCV BGR ndarray).

    Returns a dict {"acne": float, "normal": float, "oily": float} of softmax
    probabilities, or None if the model is unavailable or inference fails.
    Never raises — callers should treat None as "fall back to heuristics."
    """
    model = get_skin_model()
    if model is None:
        return None

    try:
        import cv2
        img = cv2.resize(face_image_bgr, SKIN_INPUT_SIZE)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = img.astype("float32") / 255.0
        img = np.expand_dims(img, axis=0)

        preds = model.predict(img, verbose=0)[0]

        if len(preds) != len(SKIN_CLASS_ORDER):
            _log.warning(
                f"⚠️ SkinModel: output size {len(preds)} does not match expected "
                f"{len(SKIN_CLASS_ORDER)} classes {SKIN_CLASS_ORDER}. Ignoring CNN output this request."
            )
            return None

        return {cls: float(p) for cls, p in zip(SKIN_CLASS_ORDER, preds)}
    except Exception as e:
        _log.warning(f"⚠️ SkinModel: inference error: {e}")
        return None
