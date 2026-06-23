import logging
_log = logging.getLogger("beauty_api.analysis")

from app.utils.upload_validator import validate_image_upload
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from app.utils.image_utils import read_image
from app.pipeline.face_detection import detect_faces
from app.auth.jwt_handler import verify_access_token
from app.mongodb.collections import analysis_collection
from app.ml.analysis_cv import calculate_face_shape, analyze_skin_cv, generate_annotated_image, detect_hair_properties
from app.ml.consultant import generate_consultation
import cv2
import os
import uuid
from datetime import datetime

router = APIRouter()

# Get Base URL from env (e.g., https://your-backend.onrender.com) for image links
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")

from app.auth.jwt_handler import verify_access_token, get_current_user, oauth2_scheme
from app.mongodb.collections import analysis_collection

@router.post("/analyze")
async def analyze_face(image: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    import time
    start_total = time.time()
    try:
        user_email = current_user.get('sub')
        _log.info(f"Starting analysis for user: {user_email}")
        
        # Check usage limits (RBAC)
        t_usage = time.time()
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
        _log.info(f"Usage check took: {time.time() - t_usage:.3f}s")
        
        t_read = time.time()
        await validate_image_upload(image)
        img_bytes = await image.read()
        img = read_image(img_bytes)
        _log.info(f"Image read & decode took: {time.time() - t_read:.3f}s")
        
        if img is None:
             return {"error": "Failed to decode image. Please upload a valid image file."}

        # --- HIGH-RES DOWNSAMPLING (For speed) ---
        t_resize = time.time()
        h_orig, w_orig = img.shape[:2]
        max_dim = 1024
        if max(h_orig, w_orig) > max_dim:
            scale = max_dim / max(h_orig, w_orig)
            img = cv2.resize(img, (0,0), fx=scale, fy=scale)
            _log.info(f"Downsampled large image ({w_orig}x{h_orig}) to ({img.shape[1]}x{img.shape[0]}) for performance")
        _log.info(f"Resizing check took: {time.time() - t_resize:.3f}s")

        # --- PROFESSIONAL QUALITY VALIDATION ---
        t_qual = time.time()
        from app.pipeline.preprocess import ImageQualityValidator
        quality = ImageQualityValidator.validate(img)
        _log.info(f"Quality validation took: {time.time() - t_qual:.3f}s")
        if not quality["passed"]:
            return {
                "success": False,
                "error": "Quality Check Failed",
                "message": quality["errors"][0],
                "details": quality["details"],
                "professional_tip": "For precise analysis, ensure you are in a well-lit area and hold the camera still."
            }

        t_det = time.time()
        faces = detect_faces(img)
        _log.info(f"Face detection took: {time.time() - t_det:.3f}s")

        if len(faces) == 0:
            return {
                "faceShape": "N/A",
                "gender": "N/A",
                "skinScores": {},
                "recommendations": [],
                "error": "No face detected. Please ensure the face is clearly visible."
            }

        # Multi-face handling: if more than one face is detected, analyze the
        # largest one (by bounding-box area) rather than always taking faces[0].
        # This is additive — single-face requests behave exactly as before.
        multiple_faces_detected = len(faces) > 1
        if multiple_faces_detected:
            face_data = max(faces, key=lambda f: f["bbox"][2] * f["bbox"][3])
            _log.info(f"Multiple faces detected ({len(faces)}); analyzing the largest face.")
        else:
            face_data = faces[0]
        bbox = face_data["bbox"]
        landmarks = face_data["landmarks"]

        x, y, w, h = bbox

        # Additive, non-blocking face-geometry diagnostic (face-area-ratio +
        # rough frontal-pose check). This never rejects the request -- it only
        # surfaces a helpful tip in the response if the capture is borderline.
        from app.pipeline.preprocess import ImageQualityValidator
        face_quality = ImageQualityValidator.validate_face_geometry(img, landmarks)

        # 1. Face Shape & Gender Analysis
        t_shape = time.time()
        from app.ml.analysis_cv import classify_gender_geometric
        shape_name, shape_conf, _ = calculate_face_shape(landmarks, img.shape[1], img.shape[0], img)
        gender = classify_gender_geometric(landmarks, img.shape[1], img.shape[0], img, face_shape=shape_name)
        _log.info(f"Shape & Gender detection took: {time.time() - t_shape:.3f}s")

        # Additive: surface whether the face-shape result came from the trained
        # CNN or the geometric fallback, so the frontend can show a transparent
        # "method" badge. Never raises -- defaults to "UNKNOWN" on any error.
        try:
            from app.ml.face_shape_predictor import get_face_shape_model_status
            face_shape_model_status = get_face_shape_model_status()
        except Exception:
            face_shape_model_status = "UNKNOWN"

        # 2. Skin Analysis (OpenCV)
        t_skin = time.time()
        # FIX: Passing the full resized image to ensure landmarks match relative coordinates
        skin_scores = analyze_skin_cv(img, landmarks) 
        _log.info(f"Skin analysis (CV) took: {time.time() - t_skin:.3f}s")

        # 3. COLOR ANALYSIS
        t_color = time.time()
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
        _log.info(f"Color analysis took: {time.time() - t_color:.3f}s")
        
        # 3.5 ADVANCED DIAGNOSTICS
        t_adv = time.time()
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
        _log.info(f"Advanced diagnostics took: {time.time() - t_adv:.3f}s")

        # 4. PARALLEL GENERATION (Weather, Tips, Consultation)
        import asyncio
        from app.utils.weather_utils import get_weather_intelligence
        from app.ml.personalized_tips import generate_personalized_tips

        _log.info("Launching parallel AI generations...")
        t_parallel = time.time()
        
        async def run_parallel():
            loop = asyncio.get_running_loop()
            # Wrap synchronous functions to run in a thread pool
            tasks = [
                loop.run_in_executor(None, get_weather_intelligence),
                loop.run_in_executor(None, lambda: generate_consultation(
                    shape_name, skin_scores, gender, img, landmarks,
                    skin_tone=skin_tone, undertone=undertone,
                    eye_color=eye_color, hair_color=hair_color,
                    season=season, hair_properties=hair_props,
                    weather_data={}
                )),
                loop.run_in_executor(None, lambda: generate_personalized_tips(
                    face_shape=shape_name, gender=gender, skin_scores=skin_scores,
                    skin_tone=skin_tone, undertone=undertone,
                    eye_color=eye_color, hair_color=hair_color,
                    season=season, hair_properties=hair_props
                ))
            ]
            return await asyncio.gather(*tasks)

        try:
            weather_info, recommendations, personalized_tips = await run_parallel()
            
            # Merge weather advice into recommendations
            if weather_info and weather_info.get("advice"):
                 recommendations.append(f"\n🌍 **Environment Intelligence**: {weather_info['advice']}")
        except Exception as parallel_err:
            _log.warning("Parallel AI task error: %s", parallel_err)
            # Fallbacks if parallel execution fails
            weather_info = {}
            recommendations = []
            personalized_tips = ["AI insights are momentarily unavailable. Please check your network."]

        _log.info(f"Parallel AI logic took: {time.time() - t_parallel:.3f}s")

        # --- GENERATE ANNOTATED IMAGE ---
        t_anno = time.time()
        annotated_img = generate_annotated_image(img, landmarks, gender)
        _log.info(f"Annotation took: {time.time() - t_anno:.3f}s")
        
        # --- SAVE TO DB & DISK ---
        t_save = time.time()
        try:
            filename = f"{uuid.uuid4().hex}.jpg"
            file_path = os.path.join("static/uploads", filename)
            with open(file_path, "wb") as f:
                f.write(img_bytes)

            annotated_filename = f"annotated_{filename}"
            annotated_path = os.path.join("static/uploads", annotated_filename)
            cv2.imwrite(annotated_path, annotated_img)

            image_url = f"{BASE_URL}/static/uploads/{filename}"
            annotated_image_url = f"{BASE_URL}/static/uploads/{annotated_filename}"

            analysis_doc = {
                "user_email": current_user.get("sub"),
                "image_url": image_url,
                "annotated_image_url": annotated_image_url,
                "face_shape": shape_name,
                "face_shape_conf": shape_conf,
                "gender": gender,
                "skin_scores": skin_scores,
                "skin_tone": skin_tone,
                "undertone": undertone,
                "eye_color": eye_color,
                "hair_color": hair_color,
                "season": season,
                "hair_properties": hair_props,
                "symmetry": symmetry_data,
                "eyebrows": eyebrow_data,
                "undereye": undereye_data,
                "recommendations": recommendations,
                "personalized_tips": personalized_tips,
                "created_at": datetime.utcnow()
            }
            analysis_collection.insert_one(analysis_doc)
            increment_usage(user_email, "analysis")
        except Exception as db_err:
            _log.warning(f"DB save failed: {db_err}")
            image_url = None
            annotated_image_url = None
        _log.info(f"DB/disk save took: {time.time() - t_save:.3f}s")

        _log.info(f"Total analysis time: {time.time() - start_total:.3f}s")

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
                    "texture": float(skin_scores.get('texture', 0)),
                    "hydration": float(skin_scores.get('hydration', 60)),
                    "barrier": float(skin_scores.get('barrier', 60)),
                    "evenness": float(skin_scores.get('evenness', 60)),
                    "pores": float(skin_scores.get('pores', 60)),
                    "elasticity": float(skin_scores.get('elasticity', 60))
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
                "faces_detected_count": len(faces),
                "multiple_faces_detected": multiple_faces_detected,
                "face_quality": face_quality,
                "face_shape_model_status": face_shape_model_status,
            }
        }
    except Exception as e:
        _log.exception("Analysis endpoint error")
        return {"error": "An unexpected error occurred during analysis. Please try again."}

@router.get("/history")
async def get_history(
    current_user: dict = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
):
    try:
        email = current_user.get("sub")
        query = {"user_email": email}
        total = analysis_collection.count_documents(query)
        skip = (page - 1) * limit
        history = list(
            analysis_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        )
        result = []
        for item in history:
            item["id"] = str(item["_id"])
            del item["_id"]
            # Normalize scan image URLs dynamically using current BASE_URL
            for url_key in ["image_url", "annotated_image_url"]:
                if item.get(url_key):
                    filename = item[url_key].split("/")[-1]
                    item[url_key] = f"{BASE_URL}/static/uploads/{filename}"
            if "created_at" in item:
                item["date"] = item["created_at"].strftime("%Y-%m-%d")
                item["time"] = item["created_at"].strftime("%H:%M")
                del item["created_at"]
            result.append(item)
        return {
            "history": result,
            "total": total,
            "page": page,
            "pages": -(-total // limit),
        }
    except Exception:
        _log.exception("Error fetching analysis history")
        return {"history": [], "total": 0, "page": page, "pages": 0}

# --- AI CONSULTANT CHATBOT (LLM POWERED) ---
from pydantic import BaseModel
import requests
import json
import os

class ChatRequest(BaseModel):
    message: str

def load_api_key():
    """Load OpenRouter API key from environment variable"""
    key = os.getenv("OPENROUTER_API_KEY")
    if key:
        _log.info(f"Loaded OpenRouter API key from environment: {key[:10]}...")
        return key

    _log.warning("No OPENROUTER_API_KEY found in environment variables")
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
        ]
        
        import time
        for model in models_to_try:
            try:
                _log.info(f"Trying OpenRouter model: {model}...")
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
                    timeout=5
                )
                
                if response.status_code == 401:
                    _log.warning("OpenRouter auth failed (401). Breaking.")
                    break

                if response.status_code == 200:
                    data = response.json()
                    if 'choices' in data and len(data['choices']) > 0:
                        ai_reply = data['choices'][0]['message']['content']
                        _log.info(f"OpenRouter success: {ai_reply[:100]}...")
                        return {"reply": ai_reply}

                _log.warning(f"Model {model} failed: {response.status_code}")
                
            except Exception as e:
                _log.warning("Non-critical error in sub-step", exc_info=True)
                continue
        
        _log.warning("All OpenRouter models failed, using local fallback...")
    
    # 3. FALLBACK TO LOCAL CHATBOT (always reliable)
    from app.ml.chatbot import get_bot_response
    
    try:
        reply = get_bot_response(msg, user_context)
        _log.info(f"Local chatbot response: {reply[:100]}...")
        return {"reply": reply}
    except Exception as e:
        _log.error("Chatbot error", exc_info=True)
        return {"reply": "I'm here to help! Ask me about skincare, makeup, hairstyles, or our salon services. ✨"}

