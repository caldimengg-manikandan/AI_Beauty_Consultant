"""
face_shape_predictor.py — EfficientNetV2S face-shape classifier (PyTorch).

IMPORTANT: torch/torchvision are imported lazily, inside _load_model(), and
ONLY after the memory guard passes. Importing torch unconditionally at module
level (the previous behavior) costs significant RAM even when the model is
never used -- on a low-memory host that alone can contribute to an OOM crash.
Keep this lazy-import pattern when modifying this file.
"""

import os
import logging
import numpy as np
from PIL import Image

from app.core.model_memory_guard import has_sufficient_memory

_log = logging.getLogger("beauty_api.face_shape_predictor")


class FaceShapePredictor:
    def __init__(self, model_path=None):
        self.classes = ["Diamond", "Heart", "Long", "Oval", "Pear", "Round", "Square", "Triangle"]
        self.device = "cpu"
        self.transform = None

        if model_path is None:
            model_path = os.path.join(os.path.dirname(__file__), "../../models/face_shape_efficientnetv2s.pth")

        self.model_path = model_path
        self.status = "NOT_LOADED"
        self.model = self._load_model()

    def _load_model(self):
        # 1. Memory safety check BEFORE importing torch (the import itself is expensive).
        if not has_sufficient_memory(min_gb=1.0, label="FaceShapeModel", env_override="FACE_SHAPE_MODEL_MIN_RAM_GB"):
            self.status = "SKIPPED_LOW_MEMORY"
            return None

        # 2. Deferred import -- only happens once we know it's safe to proceed.
        try:
            import torch
            import torch.nn as nn
            from torchvision import transforms, models
        except Exception as e:
            _log.warning(f"WARNING: FaceShapeModel: torch/torchvision not available ({e}). Using geometric fallback.")
            self.status = "TORCH_NOT_AVAILABLE"
            return None

        try:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            self.transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ])

            # Recreate the exact same architecture used in training
            model = models.efficientnet_v2_s(weights=None)
            num_ftrs = model.classifier[1].in_features
            model.classifier[1] = nn.Linear(num_ftrs, len(self.classes))

            if not os.path.exists(self.model_path):
                _log.warning(f"WARNING: FaceShapeModel: Model file not found at {self.model_path}")
                self.status = "WEIGHTS_FILE_MISSING"
                return None

            # weights_only=True for security and compatibility
            state_dict = torch.load(self.model_path, map_location=self.device, weights_only=True)

            if state_dict['classifier.1.weight'].shape[0] != len(self.classes):
                _log.warning(
                    f"WARNING: FaceShapeModel: Weight mismatch! Model has "
                    f"{state_dict['classifier.1.weight'].shape[0]} classes, but code expects {len(self.classes)}. "
                    f"Please retrain your model with the new classes."
                )
                self.status = "ARCHITECTURE_MISMATCH"
                return None

            model.load_state_dict(state_dict)
            model.to(self.device).eval()
            _log.info(f"SUCCESS: FaceShapeModel: Loaded weights from {os.path.basename(self.model_path)}")
            self.status = "LOADED"
            return model
        except Exception as e:
            _log.warning(f"ERROR: FaceShapeModel: Error loading model: {e}")
            self.status = "LOAD_ERROR"
            return None

    def predict(self, face_img):
        """
        Predicts face shape from a BGR image (OpenCV format).
        Returns: (label, confidence)
        """
        if self.model is None or self.transform is None:
            return None, 0.0

        try:
            import torch  # already imported during _load_model(); cheap to reference again
            import cv2

            rgb_img = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(rgb_img)

            input_tensor = self.transform(pil_img).unsqueeze(0).to(self.device)

            with torch.no_grad():
                outputs = self.model(input_tensor)
                probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
                conf, index = torch.max(probabilities, 0)

            label = self.classes[index.item()]
            return label, conf.item()
        except Exception as e:
            _log.warning(f"WARNING: FaceShapeModel: Prediction error: {e}")
            return None, 0.0


# Singleton instance
_predictor = None


def get_face_shape_predictor():
    global _predictor
    if _predictor is None:
        _predictor = FaceShapePredictor()
    return _predictor


def get_face_shape_model_status() -> str:
    """Returns a human-readable status string without forcing a load."""
    global _predictor
    if _predictor is None:
        return "NOT_INITIALIZED"
    return _predictor.status
