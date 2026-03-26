import cv2
import os
import sys
import numpy as np
from app.pipeline.face_detection import detect_faces
from app.ml.analysis_cv import analyze_skin_cv, calculate_face_shape, classify_gender_geometric

# Path to the user's uploaded image
IMG_PATH = r"C:/Users/jasmi/.gemini/antigravity/brain/b67084b4-4c41-4902-9aab-e5e9dcf2f919/uploaded_image_1769156472177.png"

def debug_run():
    print(f"🔍 Analyzing Image: {IMG_PATH}")
    img = cv2.imread(IMG_PATH)
    
    if img is None:
        print("❌ Failed to read image")
        return

    # Resize if huge
    h, w = img.shape[:2]
    if w > 1500:
        scale = 1500 / max(w, h)
        img = cv2.resize(img, (0, 0), fx=scale, fy=scale)

    # 1. Detect
    faces = detect_faces(img)
    if not faces:
        print("❌ No faces detected.")
        return

    face = faces[0]
    landmarks = face["landmarks"]
    
    h, w, _ = img.shape

    # 2. Run New Algorithms
    print("\n--- 🧬 ML ANALYSIS RESULTS (ACCURACY CHECK) ---")
    
    # Shape with Confidence
    shape, conf = calculate_face_shape(landmarks, w, h)
    print(f"✅ Face Shape: {shape} (Confidence: {conf*100:.1f}%)")

if __name__ == "__main__":
    sys.path.append(os.getcwd())
    debug_run()
