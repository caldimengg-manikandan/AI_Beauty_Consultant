from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import cv2
import numpy as np
import base64
from app.ml.virtual_tryon import (
    apply_lipstick, apply_blush, apply_hair_dye, 
    apply_eyeshadow, apply_skin_smoothing, apply_pro_studio_lighting,
    apply_virtual_background, apply_foundation, detect_intelligent_skin_tone
)

router = APIRouter()

class EffectItem(BaseModel):
    type: str   # 'lipstick', 'blush', 'hair', 'eyeshadow', 'foundation'
    color: str  # Hex
    intensity: float = 0.5
    finish: Optional[str] = "Satin"

class TryOnRequest(BaseModel):
    image: str  # Base64 string
    effects: List[EffectItem]
    smoothing: float = 0.0 # 0 to 1
    lighting: float = 0.0   # 0 to 1
    background_type: Optional[str] = "None" # 'Midnight', 'Atelier', 'Cyber'

def hex_to_bgr(hex_color):
    hex_color = hex_color.lstrip('#')
    if not hex_color: return (0,0,0)
    lv = len(hex_color)
    rgb = tuple(int(hex_color[i:i + lv // 3], 16) for i in range(0, lv, lv // 3))
    return (rgb[2], rgb[1], rgb[0]) # BGR for OpenCV

@router.post("/tryon")
async def virtual_tryon(request: TryOnRequest):
    try:
        # 1. Decode Image
        header, encoded = request.image.split(",", 1) if "," in request.image else ("", request.image)
        image_data = base64.b64decode(encoded)
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        # 2. Detect Landmarks
        from app.pipeline.face_detection import detect_faces
        faces = detect_faces(img)
        if not faces:
            raise HTTPException(status_code=400, detail="No face detected for Try-On")
        
        landmarks = faces[0]["landmarks"]
        processed_img = img.copy()

        # 3. Apply Multi-Layered Effects
        # We process foundation first for a layered approach
        sorted_effects = sorted(request.effects, key=lambda x: 0 if x.type == 'foundation' else 1)

        for effect in sorted_effects:
            color_bgr = hex_to_bgr(effect.color)
            if effect.type == 'lipstick':
                processed_img = apply_lipstick(processed_img, landmarks, color_bgr, effect.intensity, effect.finish)
            elif effect.type == 'blush':
                processed_img = apply_blush(processed_img, landmarks, color_bgr, effect.intensity)
            elif effect.type == 'eyeshadow':
                processed_img = apply_eyeshadow(processed_img, landmarks, color_bgr, effect.intensity)
            elif effect.type == 'hair':
                processed_img = apply_hair_dye(processed_img, landmarks, color_bgr, effect.intensity)
            elif effect.type == 'foundation':
                processed_img = apply_foundation(processed_img, landmarks, color_bgr, effect.intensity)

        # 4. Apply Global Professional Enhancements
        if request.background_type and request.background_type != "None":
            processed_img = apply_virtual_background(processed_img, landmarks, request.background_type)
        if request.smoothing > 0:
            processed_img = apply_skin_smoothing(processed_img, request.smoothing)
        if request.lighting > 0:
            processed_img = apply_pro_studio_lighting(processed_img, request.lighting)

        # 5. Encode Result
        _, buffer = cv2.imencode('.jpg', processed_img)
        result_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return {
            "image": f"data:image/jpeg;base64,{result_base64}",
            "status": "success"
        }
    except Exception as e:
        print(f"❌ Try-On API Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tryon/foundation-match")
async def foundation_match(request: dict):
    """
    Analyzes skin to suggest the perfect foundation match.
    """
    try:
        image_b64 = request.get("image")
        header, encoded = image_b64.split(",", 1) if "," in image_b64 else ("", image_b64)
        image_data = base64.b64decode(encoded)
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        from app.pipeline.face_detection import detect_faces
        faces = detect_faces(img)
        if not faces: return {"status": "error", "message": "No face detected"}
        
        match_data = detect_intelligent_skin_tone(img, faces[0]["landmarks"])
        return {"status": "success", "data": match_data}
    except Exception as e:
        return {"status": "error", "message": str(e)}
