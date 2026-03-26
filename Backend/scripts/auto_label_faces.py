import cv2
import os
import sys
import shutil
import numpy as np
from tqdm import tqdm

# Add the project root to sys.path so we can import 'app'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    import mediapipe as mp
    from app.ml.analysis_cv import calculate_face_shape
except ImportError as e:
    print(f"❌ Initialization Error: {e}")
    print("Ensure you are running this script from the Backend folder with the virtual environment active.")
    sys.exit(1)

# Configuration
INPUT_DIR = "datasets/lfw_raw/extracted/lfw-deepfunneled/lfw-deepfunneled"
# If the path above is wrong after extraction, we will check below
OUTPUT_DIR = "datasets/face_shape_cropped"
LIMIT_IMAGES = 2000 # Let's start with 2000 for a quick balance

def crop_face(img, landmarks, width, height, target_size=224):
    """Crops face with padding from landmarks"""
    xs = [lm.x for lm in landmarks]
    ys = [lm.y for lm in landmarks]
    
    x1 = int(min(xs) * width)
    y1 = int(min(ys) * height)
    x2 = int(max(xs) * width)
    y2 = int(max(ys) * height)
    
    # Add padding for context
    pad_x = int((x2 - x1) * 0.2)
    pad_y = int((y2 - y1) * 0.2)
    
    x1 = max(0, x1 - pad_x)
    y1 = max(0, y1 - pad_y)
    x2 = min(width, x2 + pad_x)
    y2 = min(height, y2 + pad_y)
    
    face_crop = img[y1:y2, x1:x2]
    if face_crop.size == 0:
        return None
    
    # Square padding
    h, w = face_crop.shape[:2]
    side = max(h, w)
    canvas = np.zeros((side, side, 3), dtype=np.uint8)
    
    y_off = (side - h) // 2
    x_off = (side - w) // 2
    canvas[y_off:y_off+h, x_off:x_off+w] = face_crop
    
    return cv2.resize(canvas, (target_size, target_size))

def run_auto_label():
    # Initialize MediaPipe
    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, min_detection_confidence=0.5)

    # Check input dir
    search_dir = INPUT_DIR
    if not os.path.exists(search_dir):
        # Fallback search for any images in lfw_raw
        print(f"⚠️  {search_dir} not found, searching in datasets/lfw_raw...")
        search_dir = "datasets/lfw_raw"

    image_paths = []
    for root, _, files in os.walk(search_dir):
        for file in files:
            if file.lower().endswith(('.jpg', '.png', '.jpeg')):
                image_paths.append(os.path.join(root, file))
        if len(image_paths) >= LIMIT_IMAGES:
            break
            
    if not image_paths:
        print("❌ No images found to process.")
        return

    print(f"🚀 Found {len(image_paths)} images. Starting Auto-Labeling...")
    
    success_count = 0
    
    for path in tqdm(image_paths[:LIMIT_IMAGES]):
        img = cv2.imread(path)
        if img is None: continue
        
        h, w, _ = img.shape
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_img)
        
        if results.multi_face_landmarks:
            landmarks = results.multi_face_landmarks[0].landmark
            
            # Predict shape using project's geometric engine
            # It will also print debug info to console
            shape, conf = calculate_face_shape(landmarks, w, h)
            
            # Crop the face
            face_img = crop_face(img, landmarks, w, h)
            
            if face_img is not None:
                # Save to specific folder
                target_folder = os.path.join(OUTPUT_DIR, shape)
                os.makedirs(target_folder, exist_ok=True)
                
                filename = f"auto_{os.path.basename(path)}"
                cv2.imwrite(os.path.join(target_folder, filename), face_img)
                success_count += 1

    print(f"\n✨ Done! Successfully labeled and saved {success_count} images.")
    print(f"📁 Images are now in: {OUTPUT_DIR}")

if __name__ == "__main__":
    run_auto_label()
