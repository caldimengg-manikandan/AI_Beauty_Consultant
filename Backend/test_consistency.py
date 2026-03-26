import cv2
import os
import sys
import numpy as np
from app.pipeline.face_detection import detect_faces
from app.ml.analysis_cv import analyze_skin_cv

# Use the previous image or any test image
IMG_PATH = r"C:/Users/jasmi/.gemini/antigravity/brain/b67084b4-4c41-4902-9aab-e5e9dcf2f919/uploaded_image_1769156472177.png"

def test_consistency():
    print(f"🔄 Consistency Test: Running 5 iterations on {os.path.basename(IMG_PATH)}...")
    
    img = cv2.imread(IMG_PATH)
    if img is None:
        # Fallback to creating a dummy image if file is missing/corrupt
        print("⚠️ Test image not found, using dummy image.")
        img = np.zeros((500, 500, 3), dtype=np.uint8)
        img[:] = (200, 200, 220) # Pale skin color
    
    # Resize logic for consistent input
    h, w = img.shape[:2]
    if w > 1500:
        s = 1500/w
        img = cv2.resize(img, (0,0), fx=s, fy=s)

    # Detect once (Consistency check targets the Analysis ML, not detection jitter)
    faces = detect_faces(img)
    if not faces:
        print("❌ No faces detected for test.")
        return

    face = faces[0]
    landmarks = face["landmarks"]

    results = []
    for i in range(1, 6):
        scores = analyze_skin_cv(img, landmarks)
        print(f"   Run {i}: {scores}")
        results.append(scores)

    # Check variation
    first = results[0]
    consistent = all(r == first for r in results)
    
    if consistent:
        print("\n✅ SUCCESS: All 5 runs produced identical scores.")
    else:
        print("\n❌ FAILURE: Scores varied across runs.")

if __name__ == "__main__":
    sys.path.append(os.getcwd())
    test_consistency()
