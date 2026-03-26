import cv2
import mediapipe as mp
import numpy as np
import os

# MediaPipe Tasks API
BaseOptions = mp.tasks.BaseOptions
FaceLandmarker = mp.tasks.vision.FaceLandmarker
FaceLandmarkerOptions = mp.tasks.vision.FaceLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

# Path to the model file
MODEL_PATH = os.path.join(os.path.dirname(__file__), '../models/face_landmarker.task')

_detector = None

def get_detector():
    """Lazy load the FaceLandmarker detector to save memory."""
    global _detector
    if _detector is not None:
        return _detector
        
    try:
        options = FaceLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=MODEL_PATH),
            running_mode=VisionRunningMode.IMAGE
        )
        _detector = FaceLandmarker.create_from_options(options)
        print(f"✅ FaceLandmarker loaded from {MODEL_PATH}")
    except Exception as e:
        print(f"❌ Failed to load FaceLandmarker: {e}")
        _detector = None
    return _detector

def detect_faces(image):
    """
    Detects faces using MediaPipe FaceLandmarker.
    Returns list of [x, y, w, h].
    """
    detector = get_detector()
    if detector is None:
        print("Detector not initialized.")
        return []

    try:
        # Convert BGR to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Create MP Image
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
        
        # Detect
        detection_result = detector.detect(mp_image)
        
        faces = []
        if not detection_result.face_landmarks:
            return []

        h, w, _ = image.shape

        for landmarks in detection_result.face_landmarks:
            # Get bounding box from landmarks
            xs = [lm.x for lm in landmarks]
            ys = [lm.y for lm in landmarks]
            
            xmin = min(xs) * w
            ymin = min(ys) * h
            xmax = max(xs) * w
            ymax = max(ys) * h
            
            # Add padding/margin if needed, but for now we keep tight box
            width = xmax - xmin
            height = ymax - ymin
            
            faces.append({
                "bbox": [int(xmin), int(ymin), int(width), int(height)],
                "landmarks": landmarks
            })

        return faces

    except Exception as e:
        print(f"Error in detect_faces: {e}")
        return []
