from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.utils.image_utils import read_image
from app.pipeline.face_detection import detect_faces
from app.ml.predictor import predict_skin_conditions
from app.auth.jwt_handler import verify_access_token
from app.mongodb.collections import analysis_collection
from app.ml.analysis_cv import calculate_face_shape, analyze_skin_cv, generate_annotated_image, detect_hair_properties
from app.ml.consultant import generate_consultation
import cv2
import os
import uuid
from datetime import datetime

router = APIRouter()

from app.auth.jwt_handler import verify_access_token, get_current_user, oauth2_scheme
from app.mongodb.collections import analysis_collection

@router.post("/analyze")
async def analyze_face(image: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    try:
        user_email = current_user.get('sub')
        print(f"🔍 STARTING ANALYSIS for user: {user_email}")
        
        # Check usage limits (RBAC)
        from app.auth.rbac import check_usage_limit, increment_usage, get_user_role
        
        usage_check = check_usage_limit(user_email, "analysis_per_month")
        if not usage_check["allowed"]:
            return {
                "error": "Usage limit reached",
                "message": usage_check["message"],
                "current": usage_check["current"],
                "limit": usage_check["limit"],
                "upgrade_required": True
            }
        
        print(f"✅ Usage check passed: {usage_check['message']}")
        
        img_bytes = await image.read()
        img = read_image(img_bytes)
        
        if img is None:
             return {"error": "Failed to decode image. Please upload a valid image file."}

        # --- PROFESSIONAL QUALITY VALIDATION (NEW) ---
        from app.pipeline.preprocess import ImageQualityValidator
        quality = ImageQualityValidator.validate(img)
        if not quality["passed"]:
            return {
                "success": False,
                "error": "Quality Check Failed",
                "message": quality["errors"][0],
                "details": quality["details"],
                "professional_tip": "For precise analysis, ensure you are in a well-lit area and hold the camera still."
            }

        faces = detect_faces(img)

        if len(faces) == 0:
            return {
                "faceShape": "N/A",
                "gender": "N/A",
                "skinScores": {},
                "recommendations": [],
                "error": "No face detected. Please ensure the face is clearly visible."
            }

        # Use the first detected face
        face_data = faces[0]
        bbox = face_data["bbox"]
        landmarks = face_data["landmarks"]
        
        x, y, w, h = bbox
        
        # 1. Face Shape & Gender Analysis
        from app.ml.analysis_cv import classify_gender_geometric
        
        # Unpack tuple (Shape, Confidence, Fallback)
        shape_name, shape_conf, _ = calculate_face_shape(landmarks, img.shape[1], img.shape[0], img)
        gender = classify_gender_geometric(landmarks, img.shape[1], img.shape[0], img, face_shape=shape_name)

        # 2. Skin Analysis (OpenCV)
        face_img = img[y:y+h, x:x+w]
        skin_scores = analyze_skin_cv(face_img, landmarks) 

        # 3. COLOR ANALYSIS (NEW) - Skin Tone, Eye Color, Hair Color
        from app.ml.color_analysis import (
            detect_skin_tone, 
            detect_eye_color, 
            detect_hair_color,
            get_seasonal_color_palette
        )
        
        skin_tone, undertone, skin_hex = detect_skin_tone(img, landmarks)
        eye_color, eye_hex = detect_eye_color(img, landmarks)
        hair_color, hair_hex = detect_hair_color(img, landmarks)
        season, palette = get_seasonal_color_palette(skin_tone, undertone, eye_color, hair_color)
        
        # 3.5 ADVANCED DIAGNOSTICS (MATHEMATICAL)
        from app.ml.analysis_cv import (
            calculate_facial_symmetry, 
            analyze_eyebrows, 
            detect_undereye_concerns,
            detect_hair_properties
        )
        
        symmetry_data = calculate_facial_symmetry(landmarks, img.shape[1], img.shape[0])
        eyebrow_data = analyze_eyebrows(landmarks, img.shape[1], img.shape[0], shape_name)
        undereye_data = detect_undereye_concerns(img, landmarks)
        hair_props = detect_hair_properties(img, landmarks)

        # 4. Generate Consultant Recommendations (Pass all data including environment)
        from app.utils.weather_utils import get_weather_intelligence
        weather_info = get_weather_intelligence() # Can be enhanced with user location later

        recommendations = generate_consultation(
            shape_name, skin_scores, gender, img, landmarks,
            skin_tone=skin_tone, undertone=undertone,
            eye_color=eye_color, hair_color=hair_color,
            season=season, hair_properties=hair_props,
            weather_data=weather_info
        )

        # 5. Generate AI-Powered Personalized Tips (NEW)
        from app.ml.personalized_tips import generate_personalized_tips
        
        personalized_tips = generate_personalized_tips(
            face_shape=shape_name,
            gender=gender,
            skin_scores=skin_scores,
            skin_tone=skin_tone,
            undertone=undertone,
            eye_color=eye_color,
            hair_color=hair_color,
            season=season,
            hair_properties=hair_props
        )
        print(f"✨ Generated {len(personalized_tips)} personalized tips for user")

        # --- GENERATE ANNOTATED IMAGE ---
        annotated_img = generate_annotated_image(img, landmarks, gender)
        
        # --- SAVE TO DB & DISK ---
        try:
            # 1. Save Original Image
            import uuid
            filename = f"{uuid.uuid4().hex}.jpg"
            file_path = os.path.join("static/uploads", filename)
            
            # Write original bytes
            with open(file_path, "wb") as f:
                f.write(img_bytes)

            # 2. Save Annotated Image
            annotated_filename = f"annotated_{filename}"
            annotated_path = os.path.join("static/uploads", annotated_filename)
            cv2.imwrite(annotated_path, annotated_img)

            base_url = "http://localhost:8000"
            image_url = f"{base_url}/static/uploads/{filename}"
            annotated_image_url = f"{base_url}/static/uploads/{annotated_filename}"

            # 3. Save Result to DB
            analysis_doc = {
                "user_email": current_user.get("sub"),
                "image_url": image_url,
                "annotated_image_url": annotated_image_url,
                "face_shape": shape_name,
                "face_shape_conf": shape_conf,
                "gender": gender,
                "skin_scores": skin_scores,
                # Color Analysis Data
                "skin_tone": skin_tone,
                "undertone": undertone,
                "eye_color": eye_color,
                "hair_color": hair_color,
                "season": season,
                "hair_properties": hair_props,
                # New Metrics
                "symmetry": symmetry_data,
                "eyebrows": eyebrow_data,
                "undereye": undereye_data,
                "recommendations": recommendations,
                "personalized_tips": personalized_tips,
                "created_at": datetime.utcnow()
            }
            analysis_collection.insert_one(analysis_doc)
            print(f"✅ Saved analysis for user {current_user.get('sub')}")
            
            # Increment usage counter
            increment_usage(user_email, "analysis")
            print(f"📊 Usage incremented for {user_email}")

        except Exception as db_err:
            print(f"⚠️ DB Save Failed: {db_err}")
            image_url = None
            annotated_image_url = None

        # --- RETURN RESPONSE ---
        return {
            "success": True,
            "data": {
                "face_shape": shape_name,
                "confidence": float(shape_conf),
                "gender": gender,
                "skin_analysis": {
                    "acne": float(skin_scores.get('acne', 0)),
                    "oiliness": float(skin_scores.get('oiliness', 0)),
                    "texture": float(skin_scores.get('texture', 0))
                },
                "color_analysis": {
                    "skin_tone": skin_tone,
                    "undertone": undertone,
                    "skin_hex": skin_hex,
                    "eye_color": eye_color,
                    "eye_hex": eye_hex,
                    "hair_color": hair_color,
                    "hair_hex": hair_hex,
                    "hair_properties": hair_props,
                    "season": season
                },
                "recommendations": recommendations,
                "personalized_tips": personalized_tips,
                "image_url": image_url,
                "annotated_image_url": annotated_image_url,
                "hair_properties": hair_props,
                "symmetry": symmetry_data,
                "eyebrows": eyebrow_data,
                "undereye": undereye_data,
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"Internal Server Error: {str(e)}"}

@router.get("/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    try:
        email = current_user.get("sub")
        # Fetch last 20 records, sorted by date DESC
        # Note: In pymongo, find() returns a cursor, we need to list() it.
        history = list(analysis_collection.find({"user_email": email}).sort("created_at", -1).limit(20))
        
        # Convert ObjectId and DateTime to string
        for item in history:
            item["id"] = str(item["_id"])
            del item["_id"]
            if "created_at" in item:
                item["date"] = item["created_at"].strftime("%Y-%m-%d")
                item["time"] = item["created_at"].strftime("%H:%M")
                del item["created_at"]
                
        return history
    except Exception as e:
        print(f"Error fetching history: {e}")
        return []

# --- AI CONSULTANT CHATBOT (LLM POWERED) ---
from pydantic import BaseModel
import requests
import json
import os

class ChatRequest(BaseModel):
    message: str

def load_api_key():
    """Load OpenRouter API key from .env file"""
    import os
    
    # Try multiple possible locations for .env file
    possible_paths = [
        os.path.join(os.path.dirname(__file__), "../../.env"),  # Backend/.env
        os.path.join(os.path.dirname(__file__), "../../../.env"),  # Root .env
        ".env",  # Current directory
        "Backend/.env"  # From root
    ]
    
    for env_path in possible_paths:
        try:
            abs_path = os.path.abspath(env_path)
            if os.path.exists(abs_path):
                print(f"📄 Found .env file at: {abs_path}")
                with open(abs_path, "r") as f:
                    for line in f:
                        if line.startswith("OPENROUTER_API_KEY"):
                            key = line.strip().split("=", 1)[1]
                            print(f"✅ Loaded OpenRouter API key: {key[:20]}...")
                            return key
        except Exception as e:
            continue
    
    print("⚠️ No OpenRouter API key found in .env file")
    return None


@router.post("/chat")
async def chat_consultant(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    """
    Hybrid Beauty Consultant Chatbot:
    1. Tries OpenRouter API for comprehensive responses
    2. Falls back to local rule-based AI if API fails
    Provides intelligent responses based on user context.
    """
    msg = req.message
    email = current_user.get("sub")
    
    # 1. RETRIEVE USER CONTEXT
    last_scan = analysis_collection.find_one({"user_email": email}, sort=[("created_at", -1)])
    
    # Prepare context for chatbot
    user_context = None
    skin_context = "User has no recent scan."
    gender = "Female"
    
    if last_scan:
        gender = last_scan.get("gender", "Female")
        scores = last_scan.get('skin_scores', {})
        shape = last_scan.get('face_shape', 'Unknown')
        skin_tone = last_scan.get('skin_tone', 'Unknown')
        eye_color = last_scan.get('eye_color', 'Unknown')
        hair_color = last_scan.get('hair_color', 'Unknown')
        
        skin_context = f"""User Profile:
- Gender: {gender}
- Face Shape: {shape}
- Skin Tone: {skin_tone}
- Eye Color: {eye_color}
- Hair Color: {hair_color}
- Acne: {scores.get('acne',0)*100:.0f}%
- Oiliness: {scores.get('oiliness',0)*100:.0f}%
- Texture: {scores.get('texture',0)*100:.0f}%"""
        
        user_context = {
            "gender": gender,
            "face_shape": shape,
            "skin_scores": scores,
            "skin_tone": skin_tone,
            "undertone": last_scan.get("undertone"),
            "eye_color": eye_color,
            "hair_color": hair_color,
            "season": last_scan.get("season")
        }
    
    # 2. TRY OPENROUTER API FIRST (for comprehensive responses)
    api_key = load_api_key()
    
    if api_key:
        from app.ml.services_db import PARLOR_SERVICES
        services_context = json.dumps(PARLOR_SERVICES.get(gender, PARLOR_SERVICES["Female"]))
        
        system_prompt = f"""You are an elite AI Beauty Consultant for a premium salon.

**CLIENT PROFILE:**
{skin_context}

**AVAILABLE SERVICES:**
{services_context}

**INSTRUCTIONS:**
1. Be professional, empathetic, and helpful
2. Provide detailed, personalized advice based on the client's profile
3. When recommending services, use exact names and prices from AVAILABLE SERVICES
4. For skincare questions, give specific product recommendations and routines
5. For makeup questions, suggest colors based on their skin tone and coloring
6. Keep responses conversational but informative (2-4 sentences)
7. If they ask to book, say "I can help you schedule! Please call us at (555) 123-4567"
"""
        
        # Try top reliable free models from OpenRouter (Fast & High Accuracy)
        models_to_try = [
            "google/gemini-2.0-flash-exp:free",
            "meta-llama/llama-3.1-8b-instruct:free",
            "google/gemini-exp-1206:free",
            "liquid/lfm-40b:free",
            "mistralai/mistral-7b-instruct:free",
            "microsoft/phi-3-mini-128k-instruct:free",
        ]
        
        import time
        for model in models_to_try:
            try:
                print(f"🤖 Trying OpenRouter Model: {model}...")
                response = requests.post(
                    url="https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "http://localhost:3000",
                    },
                    data=json.dumps({
                        "model": model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": msg}
                        ]
                    }),
                    timeout=15
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if 'choices' in data and len(data['choices']) > 0:
                        ai_reply = data['choices'][0]['message']['content']
                        print(f"✅ OpenRouter Success: {ai_reply[:100]}...")
                        return {"reply": ai_reply}
                
                print(f"⚠️ Model {model} failed: {response.status_code}")
                
            except Exception as e:
                print(f"⚠️ Model {model} error: {str(e)}")
                continue
        
        print("⚠️ All OpenRouter models failed, using local fallback...")
    
    # 3. FALLBACK TO LOCAL CHATBOT (always reliable)
    from app.ml.chatbot import get_bot_response
    
    try:
        reply = get_bot_response(msg, user_context)
        print(f"💬 Local Chatbot Response: {reply[:100]}...")
        return {"reply": reply}
    except Exception as e:
        print(f"⚠️ Chatbot Error: {e}")
        return {"reply": "I'm here to help! Ask me about skincare, makeup, hairstyles, or our salon services. ✨"}

