import cv2
import sys
import os

# Add Backend to python path
sys.path.append(os.path.abspath("."))

from app.ml.analysis_cv import analyze_skin_cv
from app.pipeline.face_detection import detect_faces
from app.utils.image_utils import read_image

def test_skin_analysis():
    print("🚀 Starting Skin Analysis Test...")
    
    # Use the known debug image in Backend root
    img_path = "debug_face.jpg"
    if not os.path.exists(img_path):
        print(f"❌ Image not found at {img_path}")
        return

    print(f"📸 Loading image: {img_path}")
    img = cv2.imread(img_path)

    if img is None:
        print("❌ Failed to load image.")
        return

    # Detect Faces
    faces = detect_faces(img)
    if not faces:
        print("❌ No faces detected.")
        return

    face = faces[0]
    landmarks = face["landmarks"]
    
    # Run Analysis
    print("\n--- Running Skin Analysis ---")
    
    try:
        # Pass FULL image as per the fix
        scores = analyze_skin_cv(img, landmarks)
        print("✅ Analysis Function Returned Successfully")
        print(f"📊 Scores: {scores}")
        
        # Validation
        required_keys = ["acne", "oiliness", "texture"]
        missing = [k for k in required_keys if k not in scores]
        
        if missing:
             print(f"❌ Missing keys in result: {missing}")
        else:
             print("✅ Output Schema Valid")
             
        # Check Value Ranges
        if all(0.0 <= v <= 1.0 for v in scores.values()):
            print("✅ All scores within valid range (0.0 - 1.0)")
        else:
            print("❌ Invalid score values detected (must be 0-1)")
            
    except Exception as e:
        print(f"❌ Analysis Failed with verification error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_skin_analysis()
