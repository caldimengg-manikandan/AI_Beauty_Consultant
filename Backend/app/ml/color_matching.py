import numpy as np
import cv2
from sklearn.cluster import KMeans

def rgb_to_lab(rgb):
    """
    Convert RGB to LAB color space for perceptual color matching.
    LAB is device-independent and matches human perception.
    """
    # Normalize RGB to 0-1
    rgb_norm = np.array(rgb, dtype=np.float32) / 255.0
    
    # Convert to XYZ (intermediate step)
    # Using D65 illuminant
    rgb_linear = np.where(rgb_norm > 0.04045,
                          ((rgb_norm + 0.055) / 1.055) ** 2.4,
                          rgb_norm / 12.92)
    
    # RGB to XYZ matrix (sRGB, D65)
    matrix = np.array([
        [0.4124564, 0.3575761, 0.1804375],
        [0.2126729, 0.7151522, 0.0721750],
        [0.0193339, 0.1191920, 0.9503041]
    ])
    
    xyz = np.dot(matrix, rgb_linear)
    
    # XYZ to LAB
    # D65 white point
    xyz_n = np.array([0.95047, 1.00000, 1.08883])
    xyz_norm = xyz / xyz_n
    
    # f(t) function
    delta = 6/29
    f_xyz = np.where(xyz_norm > delta**3,
                     xyz_norm ** (1/3),
                     xyz_norm / (3 * delta**2) + 4/29)
    
    L = 116 * f_xyz[1] - 16
    a = 500 * (f_xyz[0] - f_xyz[1])
    b = 200 * (f_xyz[1] - f_xyz[2])
    
    return np.array([L, a, b])

def ciede2000(lab1, lab2):
    """
    CIEDE2000 color difference formula.
    Industry standard for perceptual color matching (92%+ accuracy).
    Returns: Distance value (0 = identical, <2 = imperceptible, >10 = very different)
    """
    L1, a1, b1 = lab1
    L2, a2, b2 = lab2
    
    # Calculate C and h
    C1 = np.sqrt(a1**2 + b1**2)
    C2 = np.sqrt(a2**2 + b2**2)
    C_bar = (C1 + C2) / 2
    
    # G factor
    G = 0.5 * (1 - np.sqrt(C_bar**7 / (C_bar**7 + 25**7)))
    
    # a' values
    a1_prime = a1 * (1 + G)
    a2_prime = a2 * (1 + G)
    
    # C' and h'
    C1_prime = np.sqrt(a1_prime**2 + b1**2)
    C2_prime = np.sqrt(a2_prime**2 + b2**2)
    
    h1_prime = np.degrees(np.arctan2(b1, a1_prime)) % 360
    h2_prime = np.degrees(np.arctan2(b2, a2_prime)) % 360
    
    # Delta values
    delta_L_prime = L2 - L1
    delta_C_prime = C2_prime - C1_prime
    
    # Delta h'
    if C1_prime * C2_prime == 0:
        delta_h_prime = 0
    else:
        diff = h2_prime - h1_prime
        if abs(diff) <= 180:
            delta_h_prime = diff
        elif diff > 180:
            delta_h_prime = diff - 360
        else:
            delta_h_prime = diff + 360
    
    delta_H_prime = 2 * np.sqrt(C1_prime * C2_prime) * np.sin(np.radians(delta_h_prime / 2))
    
    # Mean values
    L_bar_prime = (L1 + L2) / 2
    C_bar_prime = (C1_prime + C2_prime) / 2
    
    if C1_prime * C2_prime == 0:
        h_bar_prime = h1_prime + h2_prime
    else:
        sum_h = h1_prime + h2_prime
        if abs(h1_prime - h2_prime) <= 180:
            h_bar_prime = sum_h / 2
        elif sum_h < 360:
            h_bar_prime = (sum_h + 360) / 2
        else:
            h_bar_prime = (sum_h - 360) / 2
    
    # T factor
    T = (1 - 0.17 * np.cos(np.radians(h_bar_prime - 30)) +
         0.24 * np.cos(np.radians(2 * h_bar_prime)) +
         0.32 * np.cos(np.radians(3 * h_bar_prime + 6)) -
         0.20 * np.cos(np.radians(4 * h_bar_prime - 63)))
    
    # S factors
    S_L = 1 + (0.015 * (L_bar_prime - 50)**2) / np.sqrt(20 + (L_bar_prime - 50)**2)
    S_C = 1 + 0.045 * C_bar_prime
    S_H = 1 + 0.015 * C_bar_prime * T
    
    # R_T factor
    delta_theta = 30 * np.exp(-((h_bar_prime - 275) / 25)**2)
    R_C = 2 * np.sqrt(C_bar_prime**7 / (C_bar_prime**7 + 25**7))
    R_T = -R_C * np.sin(np.radians(2 * delta_theta))
    
    # Final CIEDE2000
    delta_E = np.sqrt(
        (delta_L_prime / S_L)**2 +
        (delta_C_prime / S_C)**2 +
        (delta_H_prime / S_H)**2 +
        R_T * (delta_C_prime / S_C) * (delta_H_prime / S_H)
    )
    
    return delta_E

def extract_dominant_skin_color(image, landmarks):
    """
    Extract dominant skin color using K-Means clustering.
    Returns RGB color value.
    """
    h, w, _ = image.shape
    
    # Create face mask from landmarks
    face_pts = []
    # Forehead, cheeks, nose region
    indices = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
               397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
               172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
    
    for idx in indices:
        if idx < len(landmarks):
            x = int(landmarks[idx].x * w)
            y = int(landmarks[idx].y * h)
            face_pts.append([x, y])
    
    # Create mask
    mask = np.zeros((h, w), dtype=np.uint8)
    if len(face_pts) > 0:
        pts = np.array(face_pts, dtype=np.int32)
        cv2.fillPoly(mask, [pts], 255)
    
    # Extract pixels
    pixels = image[mask > 0]
    
    if pixels.size == 0:
        return np.array([200, 180, 160])  # Default fair skin
    
    # K-Means to find dominant color
    pixels_reshaped = pixels.reshape(-1, 3).astype(np.float32)
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    kmeans.fit(pixels_reshaped)
    
    # Get largest cluster (dominant color)
    labels = kmeans.labels_
    counts = np.bincount(labels)
    dominant_idx = np.argmax(counts)
    dominant_color = kmeans.cluster_centers_[dominant_idx]
    
    return dominant_color.astype(np.uint8)

def get_undertone(rgb_color):
    """
    Determine skin undertone (warm/cool/neutral) from RGB.
    """
    r, g, b = rgb_color
    
    # Convert to HSL for better undertone detection
    rgb_norm = np.array([r, g, b]) / 255.0
    max_val = np.max(rgb_norm)
    min_val = np.min(rgb_norm)
    
    # Hue calculation
    if max_val == min_val:
        h = 0
    elif max_val == rgb_norm[0]:  # Red
        h = 60 * (((rgb_norm[1] - rgb_norm[2]) / (max_val - min_val)) % 6)
    elif max_val == rgb_norm[1]:  # Green
        h = 60 * (((rgb_norm[2] - rgb_norm[0]) / (max_val - min_val)) + 2)
    else:  # Blue
        h = 60 * (((rgb_norm[0] - rgb_norm[1]) / (max_val - min_val)) + 4)
    
    # Undertone rules
    if h < 30 or h > 330:  # Red/Orange tones
        return "Warm"
    elif 150 < h < 270:  # Blue/Green tones
        return "Cool"
    else:
        return "Neutral"
