import cv2
import numpy as np
import logging

from app.core.heuristic_thresholds import (
    PREPROCESS_MIN_RESOLUTION_PX,
    PREPROCESS_MIN_BRIGHTNESS,
    PREPROCESS_MAX_BRIGHTNESS,
    PREPROCESS_MIN_BLUR_VARIANCE,
    FACE_GEOMETRY_MIN_AREA_RATIO,
    FACE_GEOMETRY_MAX_POSE_ASYMMETRY,
)

_log = logging.getLogger("beauty_api.preprocess")

class ImageQualityValidator:
    """
    Ensures the input image meets professional diagnostic standards.
    Checks for lighting, blur, and resolution.
    """

    @staticmethod
    def validate_face_geometry(image, landmarks):
        """
        Additive, NON-BLOCKING diagnostic check run after face landmarks are
        available (face-area-ratio + rough frontal-pose estimate). This does
        NOT reject the request — existing behavior (accept/reject) is decided
        solely by validate() above, which runs before face detection and is
        left untouched. This method only adds visibility into borderline
        captures (e.g. face too small/far, or a non-frontal/turned pose) so
        the frontend can surface a helpful tip without breaking any existing
        flow that previously succeeded.
        Returns: {"face_area_ratio": float, "is_frontal": bool, "warning": str|None}
        """
        try:
            h, w = image.shape[:2]
            xs = [lm.x for lm in landmarks]
            ys = [lm.y for lm in landmarks]
            face_w = (max(xs) - min(xs)) * w
            face_h = (max(ys) - min(ys)) * h
            face_area_ratio = float((face_w * face_h) / (w * h)) if (w * h) > 0 else 0.0

            # Rough frontal-pose check using nose-tip (1) vs left/right cheek (234/454)
            # symmetry of horizontal distance -- a turned face will be lopsided.
            is_frontal = True
            try:
                nose = landmarks[1]
                l_cheek = landmarks[234]
                r_cheek = landmarks[454]
                d_left = abs(nose.x - l_cheek.x)
                d_right = abs(r_cheek.x - nose.x)
                denom = d_left + d_right
                if denom > 1e-6:
                    asymmetry = abs(d_left - d_right) / denom
                    is_frontal = asymmetry < FACE_GEOMETRY_MAX_POSE_ASYMMETRY
            except Exception:
                is_frontal = True  # fail open -- never block on this heuristic

            warning = None
            if face_area_ratio < FACE_GEOMETRY_MIN_AREA_RATIO:
                warning = "Face appears small in the frame. Move closer for a more precise analysis."
            elif not is_frontal:
                warning = "Face appears turned. Facing the camera directly improves analysis accuracy."

            return {
                "face_area_ratio": round(face_area_ratio, 4),
                "is_frontal": is_frontal,
                "warning": warning,
            }
        except Exception as e:
            _log.warning(f"validate_face_geometry skipped due to error: {e}")
            return {"face_area_ratio": None, "is_frontal": True, "warning": None}

    @staticmethod
    def validate(image):
        results = {"passed": True, "errors": [], "details": {}}
        
        if image is None:
            return {"passed": False, "errors": ["Invalid image data"]}

        # 1. Check Resolution
        h, w = image.shape[:2]
        results["details"]["resolution"] = f"{w}x{h}"
        if w < PREPROCESS_MIN_RESOLUTION_PX or h < PREPROCESS_MIN_RESOLUTION_PX:
            results["passed"] = False
            results["errors"].append("Low resolution. Please use a clearer photo.")

        # 2. Check Lighting (Brightness)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        brightness = np.mean(gray)
        results["details"]["brightness"] = round(float(brightness), 2)

        if brightness < PREPROCESS_MIN_BRIGHTNESS:
            results["passed"] = False
            results["errors"].append("The environment is slightly too dark. Please move to a better-lit area.")
        elif brightness > PREPROCESS_MAX_BRIGHTNESS:
            results["passed"] = False
            results["errors"].append("Image is overexposed. Avoid direct harsh light.")

        # 3. Check for Motion Blur (Laplacian Variance)
        blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
        results["details"]["blur_score"] = round(float(blur_score), 2)

        # Threshold lowered from 70 to 45 for domestic photo stability
        if blur_score < PREPROCESS_MIN_BLUR_VARIANCE:
            results["passed"] = False
            results["errors"].append("The image is a bit blurry. Please hold your device steady.")

        return results

def preprocess_image(image):
    """Standard professional preprocessing pipeline."""
    # Convert BGR to RGB for ML models
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Apply subtle noise reduction but keep features sharp
    denoised = cv2.fastNlMeansDenoisingColored(image, None, 10, 10, 7, 21)
    
    # Normalize pixel values to [0, 1]
    normalized_image = denoised / 255.0
    
    return normalized_image
