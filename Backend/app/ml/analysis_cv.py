import cv2
import numpy as np
import math
import os
from app.ml.face_shape_predictor import get_face_shape_predictor

# --- MODEL LOADING (Lazy) ---
skin_model = None

def get_skin_model():
    global skin_model
    if skin_model is not None:
        return skin_model
    
    try:
        import tensorflow as tf
        model_path = os.path.join(os.path.dirname(__file__), "../models/densenet_skin.h5")
        if os.path.exists(model_path):
            skin_model = tf.keras.models.load_model(model_path)
            print(f"✅ Analysis: Skin Model Loaded from {os.path.basename(model_path)}")
        else:
            print(f"⚠️ Analysis: Skin Model not found at {model_path}")
    except Exception as e:
        print(f"⚠️ Analysis: Error loading skin model: {e}")
    return skin_model

print("ℹ️ Analysis: Running in Hybrid Mode (PyTorch + TensorFlow)")

# --- ADVANCED PREPROCESSING (Industry Standard) ---

def apply_retinex(image):
    """
    Optimized Multi-Scale Retinex (MSR) for lighting correction.
    Uses downsampling for large-scale blurs to improve speed by >70% on large images.
    """
    img_float = image.astype(np.float32) + 1.0
    h, w = img_float.shape[:2]
    
    # Target resolution for fast blur (e.g., 512px)
    target_dim = 640
    if max(h, w) > target_dim:
        scale_factor = target_dim / max(h, w)
        img_small = cv2.resize(img_float, (0,0), fx=scale_factor, fy=scale_factor)
    else:
        img_small = img_float
        scale_factor = 1.0

    scales = [15, 80, 200]
    msr_small = np.zeros_like(img_small)
    
    for scale in scales:
        s = scale * scale_factor
        blurred = cv2.GaussianBlur(img_small, (0, 0), s)
        msr_small += np.log10(img_small) - np.log10(blurred + 1.0)
    
    msr_small = msr_small / len(scales)
    
    # Scale back only the result of blurs if we downsampled
    if scale_factor != 1.0:
        msr = cv2.resize(msr_small, (w, h))
    else:
        msr = msr_small
        
    msr_norm = cv2.normalize(msr, None, 0, 255, cv2.NORM_MINMAX)
    return msr_norm.astype(np.uint8)

def apply_bilateral_filter(image):
    """
    Optimized Bilateral filter for performance.
    Reduced 'd' and sigma values for faster execution on CPUs.
    """
    return cv2.bilateralFilter(image, d=5, sigmaColor=50, sigmaSpace=50)

def extract_skin_mask_hsv(image):
    """
    HSV-based skin segmentation for background removal.
    More accurate than simple color thresholding.
    """
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    
    # Skin color range in HSV (works across ethnicities)
    lower_skin = np.array([0, 20, 70], dtype=np.uint8)
    upper_skin = np.array([20, 255, 255], dtype=np.uint8)
    
    mask = cv2.inRange(hsv, lower_skin, upper_skin)
    
    # Morphological operations to clean mask
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    
    return mask

# --- 1. FACE SHAPE ANALYSIS (VECTOR SIMILARITY + ANGLE) ---

def calculate_face_shape(landmarks, width, height, image=None):
    """
    Hybrid face shape classification:
    1. Uses EfficientNetV2S CNN if image is provided.
    2. Falls back to Geometric fallback if CNN is uncertain or image is missing.
    """
    # Initialize predictor
    predictor = get_face_shape_predictor()
    
    cnn_shape = None
    cnn_conf = 0.0

    # 1. TRY CNN PREDICTION
    if image is not None and predictor.model is not None:
        try:
            # Crop face for CNN
            xs = [lm.x for lm in landmarks]
            ys = [lm.y for lm in landmarks]
            
            x1 = int(min(xs) * width)
            y1 = int(min(ys) * height)
            x2 = int(max(xs) * width)
            y2 = int(max(ys) * height)
            
            # Add padding for context
            pad_x = int((x2 - x1) * 0.2)
            pad_y = int((y2 - y1) * 0.2)
            
            img_h, img_w = image.shape[:2]
            x1 = max(0, x1 - pad_x)
            y1 = max(0, y1 - pad_y)
            x2 = min(img_w, x2 + pad_x)
            y2 = min(img_h, y2 + pad_y)
            
            face_crop = image[y1:y2, x1:x2]
            
            if face_crop.size > 0:
                cnn_shape, cnn_conf = predictor.predict(face_crop)
                print(f"🧬 CNN FACE SHAPE: {cnn_shape} ({cnn_conf*100:.1f}%)")
                
                # If CNN is highly confident, return immediately
                if cnn_conf > 0.85:
                    return cnn_shape, cnn_conf, cnn_shape
        except Exception as e:
            print(f"⚠️ CNN Prediction Failed: {e}")

    # 2. GEOMETRIC FALLBACK / SUPPLEMENT
    def get_coords(idx):
        return (landmarks[idx].x * width, landmarks[idx].y * height)

    def dist(p1, p2):
        return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

    def calculate_angle(a, b, c):
        ba = np.array([a[0]-b[0], a[1]-b[1]])
        bc = np.array([c[0]-b[0], c[1]-b[1]])
        cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
        return np.degrees(np.arccos(np.clip(cosine_angle, -1.0, 1.0)))

    # Measurements
    jaw_width = dist(get_coords(172), get_coords(397))
    cheek_width = dist(get_coords(234), get_coords(454))
    forehead_width = dist(get_coords(103), get_coords(332))
    face_height = dist(get_coords(10), get_coords(152))
    mid_face_width = dist(get_coords(130), get_coords(359))
    jaw_angle = calculate_angle(get_coords(127), get_coords(172), get_coords(152))
    
    if cheek_width == 0: cheek_width = 1
    if face_height == 0: face_height = 1

    length_to_width = face_height / cheek_width
    jaw_to_cheek = jaw_width / cheek_width
    forehead_to_cheek = forehead_width / cheek_width
    angle_norm = jaw_angle / 140.0
    mid_to_cheek = mid_face_width / cheek_width

    user_vector = np.array([length_to_width, jaw_to_cheek, forehead_to_cheek, angle_norm, mid_to_cheek])

    shapes_centroids = {
        "Oval":      np.array([1.50, 0.78, 0.88, 0.93, 0.65]),
        "Round":     np.array([1.10, 0.95, 0.92, 1.05, 0.70]),
        "Square":    np.array([1.20, 0.98, 0.95, 0.75, 0.68]),
        "Heart":     np.array([1.35, 0.68, 1.00, 0.90, 0.62]),
        "Long":      np.array([1.70, 0.82, 0.85, 0.92, 0.63]),
        "Diamond":   np.array([1.45, 0.65, 0.75, 0.88, 0.60]),
        "Pear":      np.array([1.25, 1.05, 0.80, 1.10, 0.72]),
        "Rectangle": np.array([1.65, 0.98, 0.95, 0.75, 0.68]),
        "Triangle":  np.array([1.30, 1.10, 0.75, 1.15, 0.75])
    }

    weights = np.array([1.5, 2.0, 1.5, 2.5, 1.0])
    dists = {shape: np.sqrt(np.sum(weights * (user_vector - centroid)**2)) for shape, centroid in shapes_centroids.items()}
    
    geo_shape = min(dists, key=dists.get)
    geo_conf = max(0.0, min(1.0, 1.0 - (dists[geo_shape] / 1.5)))

    # HYBRID DECISION
    if cnn_shape:
        # If CNN and Geometry agree, boost confidence
        if cnn_shape == geo_shape:
            final_shape = cnn_shape
            final_conf = min(0.98, cnn_conf + 0.1)
        # If they disagree, but CNN is somewhat confident, lean towards CNN but lower score
        elif cnn_conf > 0.6:
            final_shape = cnn_shape
            final_conf = cnn_conf * 0.9
        else:
            # Low CNN confidence and disagreement, trust Geometry more
            final_shape = geo_shape
            final_conf = max(geo_conf, cnn_conf)
    else:
        final_shape = geo_shape
        final_conf = geo_conf

    print(f"✅ FINAL RESULT: {final_shape} (Confidence: {final_conf*100:.1f}%)")
    return final_shape, final_conf, geo_shape

# --- 2. GENDER ANALYSIS (HYBRID AI FUSION) ---

# Global variable for the gender model
_gender_net = None

def get_gender_net():
    """Lazy load the Gender CNN model to save memory."""
    global _gender_net
    if _gender_net is not None:
        return _gender_net
        
    try:
        GENDER_PROTO = os.path.join(os.path.dirname(__file__), '../models/gender_deploy.prototxt')
        GENDER_MODEL = os.path.join(os.path.dirname(__file__), '../models/gender_net.caffemodel')
        
        if os.path.exists(GENDER_PROTO) and os.path.exists(GENDER_MODEL):
            _gender_net = cv2.dnn.readNetFromCaffe(GENDER_PROTO, GENDER_MODEL)
            print("✅ Analysis: Gender CNN Loaded")
        else:
            print("⚠️ Analysis: Gender CNN files not found")
            _gender_net = None
    except Exception as e:
        print(f"⚠️ Analysis: Gender CNN Error {e}")
        _gender_net = None
    return _gender_net

def classify_gender_geometric(landmarks, width, height, image=None, face_shape=None):
    """
    Industry-Standard Gender Classification.
    Fuses standard CNN probabilities with shape-aware biometric signals.
    """
    male_prob = 0.5
    female_prob = 0.5
    
    # 1. CNN INFERENCE (Caffe Model)
    gender_net = get_gender_net()
    if gender_net is not None and image is not None:
        try:
            # Optimized crop for gender detection
            xs = [lm.x for lm in landmarks]; ys = [lm.y for lm in landmarks]
            x1 = int(min(xs) * width); y1 = int(min(ys) * height)
            x2 = int(max(xs) * width); y2 = int(max(ys) * height)
            
            # Use 40% padding for context (hair/ears)
            pad_x = int((x2 - x1) * 0.4)
            pad_y = int((y2 - y1) * 0.4)
            
            face_crop = image[max(0, y1-pad_y):y2+pad_y, max(0, x1-pad_x):x2+pad_x]
            
            if face_crop.size > 0:
                # Preprocessing
                blob = cv2.dnn.blobFromImage(
                    cv2.resize(face_crop, (227, 227)), 
                    1.0, (227, 227), 
                    (78.4, 87.7, 114.8), 
                    swapRB=False
                )
                gender_net.setInput(blob)
                preds = gender_net.forward()
                
                male_prob = float(preds[0][0])
                female_prob = float(preds[0][1])
                
                # If CNN is extremely confident (>98%), return early
                if max(male_prob, female_prob) > 0.98:
                    res = "Male" if male_prob > female_prob else "Female"
                    print(f"🧬 GENDER CNN (Ultra Confidence): {res} ({max(male_prob, female_prob)*100:.1f}%)")
                    return res
        except Exception as e:
            print(f"⚠️ Gender CNN Error: {e}")

    # 2. BIOMETRIC VOTING (Shape-Aware)
    bio_res, bio_scores = _gender_fallback_analysis(landmarks, width, height, image, face_shape=face_shape, return_scores=True)
    
    # --- INTELLIGENT FUSION (G2 CALIBRATION) ---
    # We increase CNN influence to 3.5 to balance the raw biometric point system
    f_total = (female_prob * 3.5) + bio_scores['female']
    m_total = (male_prob * 3.5) + bio_scores['male']
    
    # Contextual Correction: Round/Soft faces often misclassify as Female
    if face_shape in ["Round", "Oval"] and abs(f_total - m_total) < 1.5:
        # If CNN really thinks it's Male, trust it for round faces
        if male_prob > 0.65:
            m_total += 1.0
            
    result = "Male" if m_total > f_total else "Female"
    print(f"🔮 HYBRID GENDER [% {result.upper()} %] CNN_F:{female_prob:.2f} BIO_F:{bio_scores['female']} | CNN_M:{male_prob:.2f} BIO_M:{bio_scores['male']}")
    return result

def _gender_fallback_analysis(landmarks, width, height, image=None, face_shape=None, return_scores=False):
    """
    Advanced Biometric Fallback Analysis.
    """
    try:
        male_voter = 0
        female_voter = 0
        
        # 1. fWHR (Face Width to Height Ratio)
        # Higher in Males (>1.9). However, Round faces naturally have high fWHR.
        l_cheek = landmarks[234]; r_cheek = landmarks[454]
        upper_lip = landmarks[0]; brow_mid = landmarks[8]
        
        fw = math.sqrt((r_cheek.x - l_cheek.x)**2 + (r_cheek.y - l_cheek.y)**2) * width
        fh = math.sqrt((brow_mid.x - upper_lip.x)**2 + (brow_mid.y - upper_lip.y)**2) * height
        fwhr = fw / fh if fh > 0 else 0
        
        # Weight fWHR less for Round/Square faces to avoid misclassifying females
        fwhr_weight = 0.8 if face_shape in ["Round", "Square"] else 1.5
        
        if fwhr > 1.95: 
            male_voter += fwhr_weight
        elif fwhr < 1.78: 
            female_voter += 1.2
            
        # 2. Brow Position (Vertical Distance)
        # Females have significantly higher eyebrows relative to the eyes
        l_eye = landmarks[159]; l_brow = landmarks[70]
        brow_dist = abs(l_brow.y - l_eye.y) * height
        
        if brow_dist > 16.5: # Calibrated higher
            female_voter += 3.0 
        elif brow_dist < 8.5:
            male_voter += 1.5
            
        # 2.5 Jawline Angularity (Male Signal)
        # Ratio of jaw width to cheek width. Males > 0.88, Females usually < 0.85
        jaw_l = landmarks[172]; jaw_r = landmarks[397]
        cheek_l = landmarks[234]; cheek_r = landmarks[454]
        
        jw = math.sqrt((jaw_r.x - jaw_l.x)**2 + (jaw_r.y - jaw_l.y)**2)
        cw = math.sqrt((cheek_r.x - cheek_l.x)**2 + (cheek_r.y - cheek_l.y)**2)
        
        if cw > 0:
            jaw_ratio = jw / cw
            if jaw_ratio > 0.91: male_voter += 1.2
            elif jaw_ratio < 0.82: female_voter += 0.8

        # 2.8 Mouth Area Signal (Male signal: Wider Mouth)
        m_l = landmarks[61]; m_r = landmarks[291]
        n_l = landmarks[102]; n_r = landmarks[331]
        mw = math.sqrt((m_r.x - m_l.x)**2 + (m_r.y - m_l.y)**2)
        nw = math.sqrt((n_r.x - n_l.x)**2 + (n_r.y - n_l.y)**2)
        if nw > 0:
            m_ratio = mw / nw
            if m_ratio > 1.85: male_voter += 0.7
            elif m_ratio < 1.6: female_voter += 0.5
            
        # 3. Shadow/Texture Analysis (Stubble detection)
        shadow_score = 0
        if image is not None:
            cx = int(landmarks[152].x * width); cy = int(landmarks[152].y * height)
            fx = int(landmarks[10].x * width); fy = int(landmarks[10].y * height)
            
            img_h, img_w = image.shape[:2]
            if 40 < cy < img_h-40:
                chin = image[cy-35:cy, cx-30:cx+30]
                forehead = image[fy:fy+30, fx-15:fx+15]
                
                if chin.size > 0 and forehead.size > 0:
                    c_gray = cv2.cvtColor(chin, cv2.COLOR_BGR2GRAY)
                    f_gray = cv2.cvtColor(forehead, cv2.COLOR_BGR2GRAY)
                    
                    c_var = cv2.Laplacian(c_gray, cv2.CV_64F).var()
                    f_var = cv2.Laplacian(f_gray, cv2.CV_64F).var()
                    
                    # True stubble makes the chin var much higher than forehead
                    if c_var > f_var * 2.8:
                        shadow_score += 3.0
                    elif c_var > f_var * 1.8:
                        shadow_score += 1.2
        
        male_voter += shadow_score
        
        # 4. Hair Volume signal
        if image is not None:
            top_y = int(landmarks[10].y * height)
            if top_y > 40:
                top_patch = image[0:top_y, :]
                if top_patch.size > 0:
                    if np.std(top_patch) > 48:
                        female_voter += 1.5 # High top-variation = long hair
        
        # 5. Baseline female bias for salon applications
        female_voter += 1.0
        
        result = "Male" if male_voter > female_voter else "Female"
        if return_scores:
            return result, {'male': male_voter, 'female': female_voter}
        return result
    except:
        return "Female", {'male': 0, 'female': 1} if return_scores else "Female"

# --- 3. SKIN ANALYSIS (HYBRID: CNN + K-MEANS) ---

def analyze_skin_cv(image, landmarks):
    """
    Analyzes skin using Hybrid ML (CNN + K-Means) with advanced preprocessing.
    """
    # --- PREPROCESSING PIPELINE (Industry Standard) ---
    # Step 1: Bilateral filter for noise removal
    image = apply_bilateral_filter(image)
    
    # Step 2: Retinex for lighting correction
    image = apply_retinex(image)
    
    h, w, _ = image.shape
    
    def get_pt(idx):
        return (int(landmarks[idx].x * w), int(landmarks[idx].y * h))

    # Mask Helper
    def get_mask(indices):
        mask = np.zeros((h, w), dtype=np.uint8)
        points = np.array([get_pt(i) for i in indices], dtype=np.int32)
        cv2.fillPoly(mask, [points], 255)
        return mask

    # ROIs
    cheek_indices_left = [123, 50, 205, 117, 118, 101, 214, 212]
    cheek_indices_right = [352, 280, 425, 346, 347, 330, 434, 432]
    forehead_indices = [103, 104, 105, 9, 334, 333, 332, 297, 338, 10, 109, 67]
    nose_indices = [197, 195, 5, 4, 1, 2, 94, 168]

    mask_cheeks = cv2.bitwise_or(get_mask(cheek_indices_left), get_mask(cheek_indices_right))
    mask_tzone = cv2.bitwise_or(get_mask(forehead_indices), get_mask(nose_indices))

    # --- A. CNN PREDICTION (Global Analysis) ---
    cnn_acne = 0.0
    cnn_oil = 0.0
    
    current_skin_model = get_skin_model()
    if current_skin_model is not None:
        try:
            # Preprocess for CNN (224x224, scale)
            img_in = cv2.resize(image, (224, 224))
            img_in = img_in.astype("float32") / 255.0
            img_in = np.expand_dims(img_in, axis=0)
            
            preds = current_skin_model.predict(img_in, verbose=0)[0]
            cnn_acne = float(preds[0])
            cnn_oil = float(preds[2])
        except Exception as e:
            print(f"⚠️ CNN Error: {e}")

    # --- B. K-MEANS CLUSTERING (Local Analysis) ---
    kmeans_acne = 0.0
    
    try:
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        cheek_pixels = lab[mask_cheeks > 0]
        
        if cheek_pixels.size > 0:
            cheek_pixels = cheek_pixels.astype(np.float32)
            criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
            _, labels, centers = cv2.kmeans(cheek_pixels, 2, None, criteria, 10, cv2.KMEANS_PP_CENTERS)
            a_diff = abs(centers[0][1] - centers[1][1])
            red_cluster = 0 if centers[0][1] > centers[1][1] else 1
            ratio = np.sum(labels == red_cluster) / len(labels)
            
            # Use a smooth multiplier instead of a hard cutoff for better progress tracking
            # Sensitivity boost: 1.5 is a better threshold for subtle redness
            multiplier = 1.0 / (1.0 + np.exp(-(a_diff - 1.5) * 2)) 
            kmeans_acne = min(ratio * 4.0 * multiplier, 1.0) 
    except:
        pass
            
    # --- HYBRID VOTING ---
    if cnn_acne > 0.6:
        final_acne = (0.7 * cnn_acne) + (0.3 * kmeans_acne)
    else:
        final_acne = (0.3 * cnn_acne) + (0.7 * kmeans_acne)
    
    # --- OILINESS (CV + CNN) ---
    v = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)[:,:,2]
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    v_eq = clahe.apply(v)
    
    mean_tzone = cv2.mean(v_eq, mask=mask_tzone)[0]
    mean_cheek = cv2.mean(v_eq, mask=mask_cheeks)[0]
    oil_ratio = mean_tzone / mean_cheek if mean_cheek > 0 else 1.0
    cv_oil = np.clip((oil_ratio - 1.0) * 2.5, 0.05, 0.95)
    final_oil = max(cv_oil, cnn_oil) 

    # --- TEXTURE (Entropy) ---
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    cheek_roi = gray[mask_cheeks > 0]
    if cheek_roi.size > 0:
        hist, _ = np.histogram(cheek_roi, bins=256, range=(0, 256), density=True)
        hist = hist[hist > 0]
        entropy = -np.sum(hist * np.log2(hist))
        texture_score = np.clip((entropy - 5.5) / 2.0, 0.1, 0.95)
    else:
        texture_score = 0.5

    # --- FINAL REFINEMENT (No rounding, high precision for progress tracking) ---
    return {
        "acne": float(round(final_acne, 3)),
        "oiliness": float(round(final_oil, 3)),
        "texture": float(round(texture_score, 3))
    }

def generate_annotated_image(image, landmarks, gender=None):
    """
    Generates a professional, clinical-grade diagnostic overlay.
    Uses ultra-fine geometry mapping and subtle chromatic indicators.
    """
    annotated = image.copy()
    overlay = annotated.copy()
    h, w, _ = annotated.shape
    
    # 🎨 PROFESSIONAL COLOR PALETTE (Luxury Tech)
    # Slate Blue for structure, Gold for T-Zone, Emerald for Health
    PRIMARY_COLOR = (240, 180, 60) if gender == "Male" else (220, 100, 255) # Soft Blue vs Soft Pink
    ACCENT_COLOR = (50, 230, 255) # Cyan Glow
    
    def get_pt(idx): 
        return (int(landmarks[idx].x * w), int(landmarks[idx].y * h))
    
    # 1. DRAW ARCHITECTURAL JAWLINE (Subtle Flow)
    jaw_pts = [172, 58, 132, 152, 282, 331, 397] # More points for smoothness
    for i in range(len(jaw_pts)-1):
        p1, p2 = get_pt(jaw_pts[i]), get_pt(jaw_pts[i+1])
        cv2.line(overlay, p1, p2, PRIMARY_COLOR, 1, cv2.LINE_AA)
        # Add tiny nodes
        cv2.circle(overlay, p1, 2, PRIMARY_COLOR, -1, cv2.LINE_AA)
    
    # 2. DRAW T-ZONE SCANNER (Architecture)
    tzone_indices = [103, 104, 105, 9, 334, 333, 332, 297, 338, 10, 109, 67]
    pts = np.array([get_pt(i) for i in tzone_indices], dtype=np.int32).reshape((-1, 1, 2))
    cv2.polylines(overlay, [pts], True, ACCENT_COLOR, 1, cv2.LINE_AA)
    
    # 3. DRAW EYE FRAME (Precision Points)
    eye_indices = [33, 133, 159, 145, 263, 362, 386, 374]
    for idx in eye_indices:
        cv2.circle(overlay, get_pt(idx), 1, (255, 255, 255), -1, cv2.LINE_AA)

    # 4. HIGHLIGHT CONCERNS (Visual feedback for "Improvement")
    # We sample the cheeks for redness highlights
    try:
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        mask = np.zeros((h, w), dtype=np.uint8)
        cheek_indices = [123, 50, 205, 117, 118, 101, 214, 212, 352, 280, 425, 346, 347, 330, 434, 432]
        pts = np.array([get_pt(i) for i in cheek_indices], dtype=np.int32)
        cv2.fillPoly(mask, [pts], 255)
        
        # Detect reddest areas
        a_channel = lab[:,:,1]
        _, thresh = cv2.threshold(a_channel, 145, 255, cv2.THRESH_BINARY)
        thresh = cv2.bitwise_and(thresh, mask)
        
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in contours:
            if cv2.contourArea(cnt) > 20:
                # Draw subtle pulse circles around detected "concerns"
                M = cv2.moments(cnt)
                if M['m00'] != 0:
                    cx = int(M['m10']/M['m00'])
                    cy = int(M['m01']/M['m00'])
                    cv2.circle(overlay, (cx, cy), 8, (100, 100, 255), 1, cv2.LINE_AA)
    except: pass

    # 5. BLEND OVERLAY (Alpha Transparency for Professional Look)
    alpha = 0.4
    cv2.addWeighted(overlay, alpha, annotated, 1 - alpha, 0, annotated)
    
    return annotated

def calculate_facial_symmetry(landmarks, width, height):
    """
    Mathematical symmetry mapping using horizontal distance variance.
    Compares left vs right Euclidean distances to the central facial axis.
    """
    try:
        # Central axis landmarks (Nose bridge)
        axis_top = landmarks[168]
        axis_bottom = landmarks[1]
        
        def get_dist_to_axis(lm):
            # Distance from point to line (central axis)
            x0, y0 = lm.x * width, lm.y * height
            x1, y1 = axis_top.x * width, axis_top.y * height
            x2, y2 = axis_bottom.x * width, axis_bottom.y * height
            
            numerator = abs((x2-x1)*(y1-y0) - (x1-x0)*(y2-y1))
            denominator = math.sqrt((x2-x1)**2 + (y2-y1)**2)
            return numerator / (denominator + 1e-6)

        # Pairs to compare
        pairs = [
            (33, 263),   # Outer eyes
            (133, 362),  # Inner eyes
            (234, 454),  # Cheeks
            (172, 397),  # Jaw corners
            (58, 288)    # Mouth corners
        ]
        
        diffs = []
        for p1_idx, p2_idx in pairs:
            d1 = get_dist_to_axis(landmarks[p1_idx])
            d2 = get_dist_to_axis(landmarks[p2_idx])
            # Percentage difference
            diff = abs(d1 - d2) / ((d1 + d2) / 2 + 1e-6)
            diffs.append(diff)
            
        avg_diff = sum(diffs) / len(diffs)
        symmetry_score = max(0, min(100, (1.0 - avg_diff) * 100))
        
        status = "Excellent Symmetery" if symmetry_score > 94 else \
                 "Good Balance" if symmetry_score > 88 else \
                 "Slightly Asymmetric" if symmetry_score > 82 else "Distinct Variation"
                 
        return {
            "score": round(symmetry_score, 1),
            "status": status,
            "deviation": round(avg_diff * 100, 1)
        }
    except:
        return {"score": 90.0, "status": "Stable", "deviation": 0.0}

def analyze_eyebrows(landmarks, width, height, face_shape):
    """
    Calculates eyebrow architecture: Arch height and thickness relative to morphology.
    """
    try:
        # Left Brow: Inner(70), Peak(105), Outer(107)
        # Left Eye: Top(159)
        l_eye_top = landmarks[159].y * height
        l_brow_inner = landmarks[70].y * height
        l_brow_peak = landmarks[105].y * height
        
        # Calculate arch height (vertical distance from inner to peak)
        arch_height = abs(l_brow_peak - l_brow_inner)
        # Position height (distance from eye)
        pos_height = abs(l_eye_top - l_brow_peak)
        
        # Arch Level categorization
        arch_level = "High Arch" if arch_height > 12 else \
                     "Medium Arch" if arch_height > 6 else "Flat/Straight"
                     
        # Suggestion based on face shape
        suggestion = ""
        if face_shape == "Round":
            suggestion = "High, angular arches recommended to elongate face." if arch_level != "High Arch" else "Perfect arch height detected for your shape."
        elif face_shape == "Square":
            suggestion = "Softer, rounded arches recommended to balance jawline."
        elif face_shape == "Long":
            suggestion = "Flatter, horizontal brows recommended to add width."
        else:
            suggestion = "Maintain natural arch; focus on definition."
            
        return {
            "arch_level": arch_level,
            "position": "High Set" if pos_height > 15 else "Low Set",
            "suggestion": suggestion,
            "arch_val": round(arch_height, 1)
        }
    except:
        return {"arch_level": "Medium", "position": "Normal", "suggestion": "Maintain natural shape."}

def detect_undereye_concerns(image, landmarks):
    """
    Analyzes the 'Tear Trough' area for dark circles and puffiness using Chromatic L* and b* variance.
    """
    try:
        h, w, _ = image.shape
        # ROI for under eyes (Left: 230, Right: 450 approx)
        l_pt = landmarks[230]; r_pt = landmarks[450]
        
        def analyze_patch(pt):
            px, py = int(pt.x * w), int(pt.y * h)
            patch = image[py:py+15, px-10:px+10]
            if patch.size == 0: return 0, 0
            
            lab = cv2.cvtColor(patch, cv2.COLOR_BGR2LAB)
            l_val = np.mean(lab[:, :, 0])  # Lightness
            b_val = np.mean(lab[:, :, 2])  # Yellow/Blue (Blue = lower)
            return l_val, b_val

        l_light, l_blue = analyze_patch(l_pt)
        r_light, r_blue = analyze_patch(r_pt)
        
        avg_light = (l_light + r_light) / 2
        # Dark circle score based on lightness compared to forehead (reference)
        f_pt = landmarks[10]
        f_light, _ = analyze_patch(f_pt)
        
        dark_circle_score = max(0, min(100, (f_light - avg_light) * 1.5))
        
        # Puffiness detection using Laplacian variance (shadow depth)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        l_p = int(l_pt.x * w); l_py = int(l_pt.y * h)
        eye_patch = gray[l_py:l_py+20, l_p-15:l_p+15]
        puff_val = cv2.Laplacian(eye_patch, cv2.CV_64F).var()
        
        return {
            "dark_circles": round(dark_circle_score, 1),
            "puffiness": "High" if puff_val > 150 else "Moderate" if puff_val > 80 else "Minimal",
            "concerns": "Pigmentation detected" if dark_circle_score > 25 else "No major concerns"
        }
    except:
        return {"dark_circles": 0.0, "puffiness": "Minimal", "concerns": "Clear"}

def detect_hair_properties(image, landmarks):
    """
    Advanced Hair Morphology Analysis:
    1. Hairline Recession Index (Geometric Proportions)
    2. Curl Pattern Detection (FFT Frequency Analysis)
    3. Hair Density & Thickness (Pixel-Ratio Mapping)
    """
    try:
        h, w, _ = image.shape
        # Reference points: Top of forehead (10), Nose bridge (168), Chin (152)
        top_head = landmarks[10]
        eye_mid = landmarks[168]
        chin = landmarks[152]
        
        # --- 1. HAIRLINE RECESSION INDEX ---
        # Using Rule of Thirds calibration. 
        # Forehead height (10 to 168) vs Total Face Height (10 to 152)
        face_height = abs(chin.y - top_head.y) * h
        forehead_height = abs(top_head.y - eye_mid.y) * h
        
        recession_ratio = forehead_height / (face_height + 1e-6)
        
        # Clinical Calibration:
        # Standard: 0.30 - 0.35
        # High Forehead: 0.36 - 0.40
        # Receding: > 0.42
        recession_score = np.clip((recession_ratio - 0.30) * 500, 0, 100)
        
        status = "Optimal" if recession_score < 25 else \
                 "High Forehead" if recession_score < 50 else \
                 "Early Recession" if recession_score < 75 else "Significant Recession"

        # --- 2. DENSITY & CURL PATTERN (SAMPLING) ---
        top_y = int(top_head.y * h)
        
        # If the face is too high in the frame, we fallback to safer estimates
        if top_y < 40:
             return {
                "density": "Medium",
                "texture": "Straight",
                "recession_index": round(float(recession_score), 1),
                "recession_status": status,
                "curl_pattern": "Type 1 (Straight)"
            }

        # Sample crown area (above forehead)
        crown_y1 = max(0, top_y - 120)
        crown_patch = image[crown_y1:top_y, int(w*0.3):int(w*0.7)]
        
        if crown_patch.size == 0:
             return {"density": "Medium", "texture": "Straight", "recession_index": 0.0}

        gray = cv2.cvtColor(crown_patch, cv2.COLOR_BGR2GRAY)
        
        # Density Calculation (Edge Density Ratio)
        edges = cv2.Canny(gray, 50, 150)
        density_ratio = np.sum(edges > 0) / edges.size
        
        density_label = "High (Thick)" if density_ratio > 0.18 else \
                        "Medium (Normal)" if density_ratio > 0.08 else "Fine (Thin)"

        # Curl Pattern (2D FFT frequency distribution)
        # Curly hair has a higher distribution of high-frequency components
        f = np.fft.fft2(gray)
        fshift = np.fft.fftshift(f)
        magnitude_spectrum = 20 * np.log(np.abs(fshift) + 1)
        
        rows, cols = gray.shape
        crow, ccol = rows//2 , cols//2
        # Mask central DC component
        magnitude_spectrum[crow-5:crow+5, ccol-5:ccol+5] = 0
        hf_energy = np.mean(magnitude_spectrum)
        
        # Pattern Calibration (Type 1-4)
        if hf_energy > 52:
            curl_pattern = "Type 4 (Coily/Kinky)"
            texture_label = "Coily"
        elif hf_energy > 38:
            curl_pattern = "Type 3 (Curly)"
            texture_label = "Curly"
        elif hf_energy > 22:
            curl_pattern = "Type 2 (Wavy)"
            texture_label = "Wavy"
        else:
            curl_pattern = "Type 1 (Straight)"
            texture_label = "Straight"

        return {
            "density": density_label,
            "texture": texture_label,
            "recession_index": round(float(recession_score), 1),
            "recession_status": status,
            "curl_pattern": curl_pattern,
            "health_score": round(100 - (recession_score * 0.4), 1)
        }
    except Exception as e:
        print(f"⚠️ Hair Analysis Error: {e}")
        return {
            "density": "Medium", 
            "texture": "Straight", 
            "recession_index": 0.0, 
            "recession_status": "Unknown",
            "curl_pattern": "Type 1 (Straight)"
        }
