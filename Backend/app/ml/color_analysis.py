"""
Color Analysis Module for AI Beauty Consultant
Detects skin tone, eye color, and hair color from facial images
"""

import cv2
import numpy as np
from sklearn.cluster import KMeans


def detect_skin_tone(image, landmarks):
    """
    Analyzes skin tone and returns undertone classification.
    Returns: (tone_name, undertone, hex_color)
    """
    try:
        # Get face region excluding eyes, eyebrows, and mouth
        height, width = image.shape[:2]
        
        # Sample from cheek areas (safe zones for skin tone)
        left_cheek = landmarks[234]  # Left cheek
        right_cheek = landmarks[454]  # Right cheek
        
        # Create mask for sampling
        mask = np.zeros((height, width), dtype=np.uint8)
        
        # Sample circular regions on cheeks
        cheek_radius = int(width * 0.05)
        cv2.circle(mask, (int(left_cheek.x * width), int(left_cheek.y * height)), cheek_radius, 255, -1)
        cv2.circle(mask, (int(right_cheek.x * width), int(right_cheek.y * height)), cheek_radius, 255, -1)
        
        # Extract skin pixels
        skin_pixels = image[mask == 255]
        
        if len(skin_pixels) < 10:
            return "Medium", "Neutral", "#C68642"
        
        # Get average color
        avg_color = np.mean(skin_pixels, axis=0).astype(int)
        b, g, r = avg_color
        
        # Convert to hex
        hex_color = f"#{r:02x}{g:02x}{b:02x}"
        
        # Determine undertone (warm/cool/neutral)
        # Warm: more red/yellow, Cool: more blue/pink, Neutral: balanced
        red_yellow_ratio = (r + g) / 2
        blue_ratio = b
        
        if red_yellow_ratio > blue_ratio * 1.15:
            undertone = "Warm"
        elif blue_ratio > red_yellow_ratio * 1.10:
            undertone = "Cool"
        else:
            undertone = "Neutral"
        
        # Determine tone category based on brightness
        brightness = (r + g + b) / 3
        
        if brightness < 100:
            tone_name = "Deep"
        elif brightness < 140:
            tone_name = "Medium-Dark"
        elif brightness < 180:
            tone_name = "Medium"
        elif brightness < 210:
            tone_name = "Light-Medium"
        else:
            tone_name = "Fair"
        
        print(f"🎨 SKIN TONE: {tone_name} ({undertone}) - {hex_color}")
        return tone_name, undertone, hex_color
        
    except Exception as e:
        print(f"⚠️ Skin tone detection failed: {e}")
        return "Medium", "Neutral", "#C68642"


def detect_eye_color(image, landmarks):
    """
    Detects eye color from iris region.
    Returns: (color_name, hex_color)
    """
    try:
        height, width = image.shape[:2]
        
        # Get left eye landmarks (iris center approximately)
        left_eye_center = landmarks[468]  # Left iris landmark
        right_eye_center = landmarks[473]  # Right iris landmark
        
        # Sample small region around iris
        iris_radius = int(width * 0.015)  # Small radius for iris
        
        # Create mask
        mask = np.zeros((height, width), dtype=np.uint8)
        cv2.circle(mask, (int(left_eye_center.x * width), int(left_eye_center.y * height)), iris_radius, 255, -1)
        cv2.circle(mask, (int(right_eye_center.x * width), int(right_eye_center.y * height)), iris_radius, 255, -1)
        
        # Extract iris pixels
        iris_pixels = image[mask == 255]
        
        if len(iris_pixels) < 5:
            return "Brown", "#8B4513"
        
        # Use K-means to find dominant color (excluding very dark/light pixels)
        # Filter out eyelashes and reflections
        filtered_pixels = iris_pixels[
            (iris_pixels[:, 0] > 20) & (iris_pixels[:, 0] < 240) &
            (iris_pixels[:, 1] > 20) & (iris_pixels[:, 1] < 240) &
            (iris_pixels[:, 2] > 20) & (iris_pixels[:, 2] < 240)
        ]
        
        if len(filtered_pixels) < 5:
            filtered_pixels = iris_pixels
        
        # Get dominant color
        avg_color = np.median(filtered_pixels, axis=0).astype(int)
        b, g, r = avg_color
        
        hex_color = f"#{r:02x}{g:02x}{b:02x}"
        
        # Classify eye color
        # Blue eyes: high blue, low red
        # Green eyes: high green, moderate blue
        # Brown eyes: high red, high green
        # Hazel: mix of green and brown
        
        if b > 120 and b > r * 1.3 and b > g * 1.2:
            color_name = "Blue"
        elif g > 100 and g > r * 1.1 and b > 80:
            color_name = "Green"
        elif g > r * 0.9 and g > b * 1.2 and r > 80:
            color_name = "Hazel"
        elif r < 80 and g < 80 and b < 80:
            color_name = "Dark Brown"
        else:
            color_name = "Brown"
        
        print(f"👁️ EYE COLOR: {color_name} - {hex_color}")
        return color_name, hex_color
        
    except Exception as e:
        print(f"⚠️ Eye color detection failed: {e}")
        return "Brown", "#8B4513"


def detect_hair_color(image, landmarks):
    """
    Detects hair color from region above forehead.
    Returns: (color_name, hex_color)
    """
    try:
        height, width = image.shape[:2]
        
        # Get forehead landmark
        forehead = landmarks[10]
        
        # Sample region above forehead (hair region)
        forehead_y = int(forehead.y * height)
        
        if forehead_y < 30:
            return "Brown", "#654321"
        
        # Sample hair region (above forehead)
        hair_region = image[max(0, forehead_y - 60):forehead_y - 10, :]
        
        if hair_region.size == 0:
            return "Brown", "#654321"
        
        # Reshape for K-means
        pixels = hair_region.reshape(-1, 3)
        
        # Filter out very bright pixels (likely background/lighting)
        filtered_pixels = pixels[
            (pixels[:, 0] < 240) & (pixels[:, 1] < 240) & (pixels[:, 2] < 240)
        ]
        
        if len(filtered_pixels) < 10:
            filtered_pixels = pixels
        
        # Use K-means to find dominant color
        kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        kmeans.fit(filtered_pixels)
        
        # Get the most common cluster
        labels = kmeans.labels_
        counts = np.bincount(labels)
        dominant_cluster = np.argmax(counts)
        dominant_color = kmeans.cluster_centers_[dominant_cluster].astype(int)
        
        b, g, r = dominant_color
        hex_color = f"#{r:02x}{g:02x}{b:02x}"
        
        # Classify hair color
        brightness = (r + g + b) / 3
        
        if brightness < 50:
            color_name = "Black"
        elif brightness < 100:
            if r > g * 1.2:
                color_name = "Dark Brown"
            else:
                color_name = "Dark Brown"
        elif brightness < 150:
            if r > g * 1.15:
                color_name = "Auburn"
            else:
                color_name = "Brown"
        elif brightness < 190:
            if r > g * 1.2 and r > 140:
                color_name = "Red"
            elif g > r * 1.1:
                color_name = "Light Brown"
            else:
                color_name = "Brown"
        else:
            if r > 200 and g > 180:
                color_name = "Blonde"
            elif r > 180 and g > 160:
                color_name = "Light Blonde"
            else:
                color_name = "Blonde"
        
        print(f"💇 HAIR COLOR: {color_name} - {hex_color}")
        return color_name, hex_color
        
    except Exception as e:
        print(f"⚠️ Hair color detection failed: {e}")
        return "Brown", "#654321"


def get_seasonal_color_palette(skin_tone, undertone, eye_color, hair_color):
    """
    Determines seasonal color palette (Spring, Summer, Autumn, Winter)
    based on color analysis.
    """
    # Simplified seasonal color analysis
    warm_indicators = 0
    cool_indicators = 0
    
    # Undertone
    if undertone == "Warm":
        warm_indicators += 2
    elif undertone == "Cool":
        cool_indicators += 2
    
    # Eye color
    if eye_color in ["Blue", "Green"]:
        cool_indicators += 1
    elif eye_color in ["Brown", "Dark Brown"]:
        warm_indicators += 1
    
    # Hair color
    if hair_color in ["Auburn", "Red", "Blonde"]:
        warm_indicators += 1
    elif hair_color in ["Black", "Dark Brown"]:
        cool_indicators += 1
    
    # Determine season
    if warm_indicators > cool_indicators:
        if skin_tone in ["Fair", "Light-Medium"]:
            season = "Spring"
            palette = "Warm, bright colors like coral, peach, golden yellow"
        else:
            season = "Autumn"
            palette = "Warm, earthy tones like rust, olive, camel"
    else:
        if skin_tone in ["Fair", "Light-Medium"]:
            season = "Summer"
            palette = "Cool, soft colors like lavender, rose, powder blue"
        else:
            season = "Winter"
            palette = "Cool, bold colors like royal blue, emerald, black"
    
    return season, palette
