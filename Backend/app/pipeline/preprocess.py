import cv2
import numpy as np

class ImageQualityValidator:
    """
    Ensures the input image meets professional diagnostic standards.
    Checks for lighting, blur, and resolution.
    """
    
    @staticmethod
    def validate(image):
        results = {"passed": True, "errors": [], "details": {}}
        
        if image is None:
            return {"passed": False, "errors": ["Invalid image data"]}

        # 1. Check Resolution
        h, w = image.shape[:2]
        results["details"]["resolution"] = f"{w}x{h}"
        if w < 200 or h < 200:
            results["passed"] = False
            results["errors"].append("Low resolution. Please use a clearer photo.")

        # 2. Check Lighting (Brightness)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        brightness = np.mean(gray)
        results["details"]["brightness"] = round(float(brightness), 2)
        
        if brightness < 40:
            results["passed"] = False
            results["errors"].append("The environment is slightly too dark. Please move to a better-lit area.")
        elif brightness > 230:
            results["passed"] = False
            results["errors"].append("Image is overexposed. Avoid direct harsh light.")

        # 3. Check for Motion Blur (Laplacian Variance)
        blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
        results["details"]["blur_score"] = round(float(blur_score), 2)
        
        # Threshold lowered from 70 to 45 for domestic photo stability
        if blur_score < 45:
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
