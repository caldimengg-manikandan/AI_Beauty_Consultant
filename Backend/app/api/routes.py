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

from app.utils.signed_url import sign_filename, verify_signed_filename


def _secure_image_url(filename: str) -> str:
    """Builds a short-lived signed URL for a face/annotated scan image instead
    of a bare public /static/uploads/... link. See app/utils/signed_url.py."""
    sig, exp = sign_filename(filename)
    return f"{BASE_URL}/api/analyze/secure-image/{filename}?exp={exp}&sig={sig}"

from app.auth.jwt_handler import verify_access_token, get_current_user, oauth2_scheme
from app.mongodb.collections import analysis_collection

# ── Background-queue analysis ─────────────────────────────────────────────────
# Previously the entire CV + LLM pipeline (several seconds of CPU work + external
# API calls) ran synchronously inside the async request handler.  On a single
# Uvicorn worker this blocked the event loop for the full duration, meaning:
#   • Any concurrent request queued behind it.
#   • The default 30-second Uvicorn timeout was regularly breached under load.
#
# The new pattern:
#   POST /analyze   → validate image fast, enqueue heavy work, return 202 + job_id
#   GET  /analyze/status/{job_id} → poll until "done" or "error"
#
# The frontend polls every 2 seconds; the job result is kept for 10 minutes.
from app.core.analysis_queue import submit_analysis, get_job, JobStatus
from fastapi.responses import JSONResponse


def _run_analysis(img_bytes: bytes, img, user_email: str) -> dict:
    """
    Pure synchronous function that runs the full CV + LLM analysis pipeline.
    Executed in a background thread pool by analysis_queue.submit_analysis().
    Must not use any async primitives.
    """
    import time
    start_total = time.time()

    # --- HIGH-RES DOWNSAMPLING (For speed) ---
    h_orig, w_orig = img.shape[:2]
    max_dim = 1024
    if max(h_orig, w_orig) > max_dim:
        scale = max_dim / max(h_orig, w_orig)
        img = cv2.resize(img, (0, 0), fx=scale, fy=scale)
        _log.info("Downsampled large image (%dx%d) to (%dx%d)", w_orig, h_orig, img.shape[1], img.shape[0])

    # --- PROFESSIONAL QUALITY VALIDATION ---
    from app.pipeline.preprocess import ImageQualityValidator
    quality = ImageQualityValidator.validate(img)
    if not quality["passed"]:
        return {
            "success": False,
            "error": "Quality Check Failed",
            "message": quality["errors"][0],
            "details": quality["details"],
            "professional_tip": "For precise analysis, ensure you are in a well-lit area and hold the camera still.",
        }

    faces = detect_faces(img)
    if len(faces) == 0:
        return {
            "faceShape": "N/A",
            "gender": "N/A",
            "skinScores": {},
            "recommendations": [],
            "error": "No face detected. Please ensure the face is clearly visible.",
        }

    # Multi-face handling: analyze the largest face.
    multiple_faces_detected = len(faces) > 1
    face_data = max(faces, key=lambda f: f["bbox"][2] * f["bbox"][3]) if multiple_faces_detected else faces[0]
    bbox = face_data["bbox"]
    landmarks = face_data["landmarks"]
    x, y, w, h = bbox

    face_quality = ImageQualityValidator.validate_face_geometry(img, landmarks)

    # 1. Face Shape & Gender
    from app.ml.analysis_cv import classify_gender_geometric
    shape_name, shape_conf, _ = calculate_face_shape(landmarks, img.shape[1], img.shape[0], img)
    gender = classify_gender_geometric(landmarks, img.shape[1], img.shape[0], img, face_shape=shape_name)

    try:
        from app.ml.face_shape_predictor import get_face_shape_model_status
        face_shape_model_status = get_face_shape_model_status()
    except Exception:
        face_shape_model_status = "UNKNOWN"

    # 2. Skin Analysis
    skin_scores = analyze_skin_cv(img, landmarks)

    # 3. Color Analysis
    from app.ml.color_analysis import (
        detect_skin_tone, detect_eye_color, detect_hair_color, get_seasonal_color_palette
    )
    skin_tone, undertone, skin_hex = detect_skin_tone(img, landmarks)
    eye_color, eye_hex = detect_eye_color(img, landmarks)
    hair_color, hair_hex = detect_hair_color(img, landmarks)
    season, palette = get_seasonal_color_palette(skin_tone, undertone, eye_color, hair_color)

    # 3.5 Advanced Diagnostics
    from app.ml.analysis_cv import (
        calculate_facial_symmetry, analyze_eyebrows, detect_undereye_concerns, detect_hair_properties
    )
    symmetry_data  = calculate_facial_symmetry(landmarks, img.shape[1], img.shape[0])
    eyebrow_data   = analyze_eyebrows(landmarks, img.shape[1], img.shape[0], shape_name)
    undereye_data  = detect_undereye_concerns(img, landmarks)
    hair_props     = detect_hair_properties(img, landmarks)

    # 4. AI Generation (weather + consultation + personalized tips) — all sync calls
    from app.utils.weather_utils import get_weather_intelligence
    from app.ml.personalized_tips import generate_personalized_tips

    try:
        weather_info      = get_weather_intelligence()
        recommendations   = generate_consultation(
            shape_name, skin_scores, gender, img, landmarks,
            skin_tone=skin_tone, undertone=undertone,
            eye_color=eye_color, hair_color=hair_color,
            season=season, hair_properties=hair_props,
            weather_data={}
        )
        personalized_tips = generate_personalized_tips(
            face_shape=shape_name, gender=gender, skin_scores=skin_scores,
            skin_tone=skin_tone, undertone=undertone,
            eye_color=eye_color, hair_color=hair_color,
            season=season, hair_properties=hair_props
        )
        if weather_info and weather_info.get("advice"):
            recommendations.append(f"\n🌍 **Environment Intelligence**: {weather_info['advice']}")
    except Exception as ai_err:
        _log.warning("AI generation error: %s", ai_err)
        weather_info      = {}
        recommendations   = []
        personalized_tips = ["AI insights are momentarily unavailable. Please check your network."]

    # 5. Generate annotated image
    annotated_img = generate_annotated_image(img, landmarks, gender)

    # 6. Save to DB directly as Base64
    image_url = None
    annotated_image_url = None
    try:
        from app.auth.rbac import increment_usage
        import base64

        # Convert original img (OpenCV BGR) to compressed JPEG Base64
        _, raw_buffer = cv2.imencode('.jpg', img, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
        raw_b64 = base64.b64encode(raw_buffer).decode('utf-8')
        image_url = f"data:image/jpeg;base64,{raw_b64}"

        # Convert annotated img to compressed JPEG Base64
        _, ann_buffer = cv2.imencode('.jpg', annotated_img, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
        ann_b64 = base64.b64encode(ann_buffer).decode('utf-8')
        annotated_image_url = f"data:image/jpeg;base64,{ann_b64}"

        analysis_doc = {
            "user_email":           user_email,
            "image_url":            image_url,
            "annotated_image_url":  annotated_image_url,
            "face_shape":           shape_name,
            "face_shape_conf":      shape_conf,
            "gender":               gender,
            "skin_scores":          skin_scores,
            "skin_tone":            skin_tone,
            "undertone":            undertone,
            "eye_color":            eye_color,
            "hair_color":           hair_color,
            "season":               season,
            "hair_properties":      hair_props,
            "symmetry":             symmetry_data,
            "eyebrows":             eyebrow_data,
            "undereye":             undereye_data,
            "recommendations":      recommendations,
            "personalized_tips":    personalized_tips,
            "created_at":           datetime.utcnow(),
        }
        analysis_collection.insert_one(analysis_doc)
        increment_usage(user_email, "analysis")
    except Exception as db_err:
        _log.warning("DB/disk save failed: %s", db_err)

    _log.info("Background analysis completed in %.3fs", time.time() - start_total)

    return {
        "success": True,
        "data": {
            "face_shape":        shape_name,
            "confidence":        float(shape_conf),
            "gender":            gender,
            "skin_analysis": {
                "acne":       float(skin_scores.get("acne", 0)),
                "oiliness":   float(skin_scores.get("oiliness", 0)),
                "texture":    float(skin_scores.get("texture", 0)),
                "hydration":  float(skin_scores.get("hydration", 60)),
                "barrier":    float(skin_scores.get("barrier", 60)),
                "evenness":   float(skin_scores.get("evenness", 60)),
                "pores":      float(skin_scores.get("pores", 60)),
                "elasticity": float(skin_scores.get("elasticity", 60)),
            },
            "color_analysis": {
                "skin_tone":       skin_tone,
                "undertone":       undertone,
                "skin_hex":        skin_hex,
                "eye_color":       eye_color,
                "eye_hex":         eye_hex,
                "hair_color":      hair_color,
                "hair_hex":        hair_hex,
                "hair_properties": hair_props,
                "season":          season,
            },
            "recommendations":        recommendations,
            "personalized_tips":      personalized_tips,
            "image_url":              image_url,
            "annotated_image_url":    annotated_image_url,
            "hair_properties":        hair_props,
            "symmetry":               symmetry_data,
            "eyebrows":               eyebrow_data,
            "undereye":               undereye_data,
            "faces_detected_count":   len(faces),
            "multiple_faces_detected": multiple_faces_detected,
            "face_quality":           face_quality,
            "face_shape_model_status": face_shape_model_status,
        },
    }


@router.post("/analyze")
async def analyze_face(image: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """
    Accept an image upload, run fast validation, then enqueue the heavy CV + LLM
    pipeline in a background thread.  Returns HTTP 202 immediately with a job_id.

    The client should poll GET /analyze/status/{job_id} every 2 seconds until the
    job status is "done" or "error".  Results are retained for 10 minutes.
    """
    try:
        user_email = current_user.get("sub")
        _log.info("Analysis submitted by user: %s", user_email)

        # ── Fast checks — run in the request handler ──────────────────────────
        # Check usage limits (RBAC) — this is a DB read, fast.
        from app.auth.rbac import check_usage_limit
        usage_check = check_usage_limit(user_email, "analysis_per_month")
        if not usage_check["allowed"]:
            return JSONResponse(status_code=429, content={
                "error": "Usage limit reached",
                "message": usage_check["message"],
                "current": usage_check["current"],
                "limit": usage_check["limit"],
                "upgrade_required": True,
            })

        # Read & validate the image here (fast I/O) so we can return a 400 error
        # immediately on a bad file instead of deferring it to the background job.
        await validate_image_upload(image)
        img_bytes = await image.read()
        img = read_image(img_bytes)

        if img is None:
            raise HTTPException(status_code=400, detail="Failed to decode image. Please upload a valid image file.")

        # ── Submit heavy work to background thread pool ───────────────────────
        job_id = submit_analysis(_run_analysis, img_bytes, img, user_email)
        _log.info("Analysis job %s enqueued for user %s", job_id, user_email)

        return JSONResponse(
            status_code=202,
            content={
                "status":   "pending",
                "job_id":   job_id,
                "message":  "Analysis started. Poll /analyze/status/{job_id} for results.",
                "poll_url": f"/analyze/status/{job_id}",
            },
        )
    except HTTPException:
        raise
    except Exception:
        _log.exception("Analysis submit error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again.",
        )


@router.get("/analyze/status/{job_id}")
async def get_analysis_status(job_id: str, current_user: dict = Depends(get_current_user)):
    """
    Poll the status of a background analysis job.

    Response shapes:
      • {"status": "pending"} or {"status": "running"} — not done yet, poll again.
      • {"status": "done",  "result": {...}}            — analysis complete.
      • {"status": "error", "error": "..."}             — pipeline failed.
      • 404  — job_id unknown or expired (> 10 minutes old).
    """
    if not job_id or len(job_id) > 64:
        raise HTTPException(status_code=400, detail="Invalid job ID.")

    job = get_job(job_id)
    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found. It may have expired (results are kept for 10 minutes).",
        )

    if job["status"] == JobStatus.DONE:
        return {"status": "done", "result": job["result"]}
    if job["status"] == JobStatus.ERROR:
        raise HTTPException(
            status_code=500,
            detail=job["error"] or "Analysis failed."
        )

    # Still pending or running — return 200 so the client keeps polling
    return {"status": job["status"]}


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
                if item.get(url_key) and not item[url_key].startswith("data:image"):
                    filename = item[url_key].split("/")[-1].split("?")[0]
                    item[url_key] = _secure_image_url(filename)
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


@router.get("/analyze/secure-image/{filename}")
async def get_secure_analysis_image(filename: str, exp: int, sig: str):
    """
    Serves a face/annotated scan image via a short-lived signed link instead
    of the public /static/uploads/... mount. See app/utils/signed_url.py for
    why: this is additive — it does not change how /static serves any other
    upload (salon galleries, reels, expert thumbnails), only how these
    specific biometric images are linked from /analyze, /history, and the
    expert review queue.
    """
    from fastapi.responses import FileResponse

    # Defense in depth against path traversal, even though filenames here are
    # always server-generated uuid4 hex strings.
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename.")

    if not verify_signed_filename(filename, exp, sig):
        raise HTTPException(status_code=403, detail="This image link has expired or is invalid.")

    file_path = os.path.join("static/uploads", filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Image not found.")

    return FileResponse(file_path)

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

