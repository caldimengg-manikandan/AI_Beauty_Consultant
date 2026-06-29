import logging
_log = logging.getLogger("beauty_api.reels")

from app.utils.upload_validator import validate_video_upload
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, Query
from app.auth.jwt_handler import get_current_user
from app.mongodb.collections import reels_collection, salons_collection
import uuid
from datetime import datetime
import os

router = APIRouter(prefix="/api/reels", tags=["Reels & Videos"])

MOCK_VIDEOS = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
]


def seed_reels_if_empty():
    count = reels_collection.count_documents({})
    if count == 0:
        salon      = salons_collection.find_one({})
        salon_id   = salon["id"]              if salon else "default_salon_123"
        salon_name = salon.get("name", "Luxe Studio") if salon else "Luxe Studio"

        mock_reels = [
            {
                "id": str(uuid.uuid4()),
                "salon_id": salon_id, "salon_name": salon_name,
                "owner_user_id": None, "stylist_name": "Elena R.",
                "video_url": MOCK_VIDEOS[0],
                "thumbnail_url": "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=400&q=80",
                "caption": "Summer balayage transformation! ☀️💇‍♀️ #balayage #summerhair",
                "service_name": "Balayage Treatment", "service_price": 3500,
                "category": "Hair",
                "likes_count": 1245, "comments_count": 42, "shares_count": 18,
                "saves_count": 0, "views_count": 3100,
                "liked_by": [], "saved_by": [],
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "salon_id": salon_id, "salon_name": salon_name,
                "owner_user_id": None, "stylist_name": "Marcus T.",
                "video_url": MOCK_VIDEOS[1],
                "thumbnail_url": "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=400&q=80",
                "caption": "Glass skin facial routine step-by-step ✨💆‍♀️ #skincare #facial",
                "service_name": "Glass Skin Facial", "service_price": 2500,
                "category": "Skin",
                "likes_count": 3890, "comments_count": 115, "shares_count": 210,
                "saves_count": 0, "views_count": 9800,
                "liked_by": [], "saved_by": [],
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "salon_id": salon_id, "salon_name": salon_name,
                "owner_user_id": None, "stylist_name": "Sarah J.",
                "video_url": MOCK_VIDEOS[2],
                "thumbnail_url": "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=400&q=80",
                "caption": "Bridal makeup trial! Rate this look 1-10 👰💖 #bridalmakeup #glam",
                "service_name": "Bridal Makeup Trial", "service_price": 5500,
                "category": "Makeup",
                "likes_count": 5200, "comments_count": 340, "shares_count": 89,
                "saves_count": 0, "views_count": 14300,
                "liked_by": [], "saved_by": [],
                "created_at": datetime.utcnow().isoformat()
            }
        ]
        reels_collection.insert_many(mock_reels)


# ─── GET /api/reels/feed ──────────────────────────────────────────────────────
@router.get("/feed")
async def get_reels_feed(
    category: str = Query(None),
    current_user: dict = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=50),
):
    """Public discovery feed — for all roles. Supports pagination."""
    seed_reels_if_empty()
    user_id = current_user.get("sub")
    query   = {}
    if category:
        query["category"] = category

    total = reels_collection.count_documents(query)
    skip  = (page - 1) * limit
    reels = list(reels_collection.find(query).sort("created_at", -1).skip(skip).limit(limit))
    result = []
    for r in reels:
        r.pop("_id", None)
        r["is_liked"] = user_id in r.get("liked_by", [])
        r["is_saved"] = user_id in r.get("saved_by", [])
        result.append(r)
    return {"reels": result, "total": total, "page": page, "pages": -(-total // limit)}


# ─── GET /api/reels/owner/my-reels ───────────────────────────────────────────
@router.get("/owner/my-reels")
async def get_owner_reels(current_user: dict = Depends(get_current_user)):
    """Shop owner sees only their own reels with analytics summary."""
    user_id = current_user.get("sub")
    role    = current_user.get("role", "user")
    if role not in ("shop_owner", "admin"):
        raise HTTPException(status_code=403, detail="Shop owner access required")

    reels = list(reels_collection.find({"owner_user_id": user_id}).sort("created_at", -1))
    result = []
    for r in reels:
        r.pop("_id", None)
        r["is_liked"] = False
        r["is_saved"] = False
        r["analytics"] = {
            "views":    r.get("views_count", 0),
            "likes":    r.get("likes_count", 0),
            "shares":   r.get("shares_count", 0),
            "saves":    r.get("saves_count", 0),
            "comments": r.get("comments_count", 0),
            "ctr":      round(r.get("likes_count", 0) / max(r.get("views_count", 1), 1) * 100, 1),
        }
        result.append(r)
    return result


# ─── POST /api/reels/{reel_id}/like ──────────────────────────────────────────
@router.post("/{reel_id}/like")
async def toggle_reel_like(reel_id: str, current_user: dict = Depends(get_current_user)):
    """Toggle a like on a reel for the current user."""
    user_id = current_user.get("sub")
    reel = reels_collection.find_one({"id": reel_id})
    if not reel:
        raise HTTPException(status_code=404, detail="Reel not found")

    liked_by = reel.get("liked_by", [])
    if user_id in liked_by:
        liked_by.remove(user_id)
        inc = -1; is_liked = False
    else:
        liked_by.append(user_id)
        inc = 1; is_liked = True

    reels_collection.update_one(
        {"id": reel_id},
        {"$set": {"liked_by": liked_by}, "$inc": {"likes_count": inc}}
    )
    return {"status": "success", "is_liked": is_liked, "likes_count": reel.get("likes_count", 0) + inc}


# ─── POST /api/reels/{reel_id}/save ──────────────────────────────────────────
@router.post("/{reel_id}/save")
async def toggle_reel_save(reel_id: str, current_user: dict = Depends(get_current_user)):
    """Toggle save / bookmark on a reel."""
    user_id = current_user.get("sub")
    reel = reels_collection.find_one({"id": reel_id})
    if not reel:
        raise HTTPException(status_code=404, detail="Reel not found")

    saved_by = reel.get("saved_by", [])
    if user_id in saved_by:
        saved_by.remove(user_id)
        inc = -1; is_saved = False
    else:
        saved_by.append(user_id)
        inc = 1; is_saved = True

    reels_collection.update_one(
        {"id": reel_id},
        {"$set": {"saved_by": saved_by}, "$inc": {"saves_count": inc}}
    )
    return {"status": "success", "is_saved": is_saved, "saves_count": reel.get("saves_count", 0) + inc}


# ─── POST /api/reels/{reel_id}/view ──────────────────────────────────────────
@router.post("/{reel_id}/view")
async def increment_view(reel_id: str, current_user: dict = Depends(get_current_user)):
    """Increment view count once per watch session."""
    reels_collection.update_one({"id": reel_id}, {"$inc": {"views_count": 1}})
    return {"status": "ok"}


# ─── DELETE /api/reels/{reel_id} ─────────────────────────────────────────────
@router.delete("/{reel_id}")
async def delete_reel(reel_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a reel. Only uploader or admin may delete."""
    user_id = current_user.get("sub")
    role    = current_user.get("role", "user")
    reel    = reels_collection.find_one({"id": reel_id})
    if not reel:
        raise HTTPException(status_code=404, detail="Reel not found")
    if reel.get("owner_user_id") != user_id and role != "admin":
        raise HTTPException(status_code=403, detail="You can only delete your own reels")
    reels_collection.delete_one({"id": reel_id})
    return {"status": "success", "message": "Reel deleted"}


# ─── POST /api/reels/upload ───────────────────────────────────────────────────
@router.post("/upload")
async def upload_reel(
    video: UploadFile    = File(...),
    caption: str         = Form(""),
    service_name: str    = Form(""),
    service_price: float = Form(0),
    category: str        = Form("General"),
    current_user: dict   = Depends(get_current_user),
):
    """Upload a new beauty reel. Resolves uploader's own salon automatically."""
    user_id = current_user.get("sub")

    # Reel videos are public-facing content (marketing videos displayed to all users).
    # They live under static/public/ which is served by the public StaticFiles mount —
    # NOT static/uploads/ which is now reserved for private biometric face-scan images.
    filename  = f"reel_{uuid.uuid4().hex}.mp4"
    file_path = os.path.join("static/public/reels", filename)
    os.makedirs("static/public/reels", exist_ok=True)

    video_bytes = await validate_video_upload(video)
    try:
        with open(file_path, "wb") as f:
            f.write(video_bytes)
    except Exception:
        _log.exception("Failed to save reel video to disk")
        raise HTTPException(status_code=500, detail="An unexpected error occurred saving the video.")

    BASE_URL  = os.getenv("BASE_URL", "http://localhost:8000")
    video_url = f"{BASE_URL}/static/public/reels/{filename}"

    # Resolve the uploader's own salon (shop_owner flow) or fall back
    salon = (
        salons_collection.find_one({"owner_user_id": user_id})
        or salons_collection.find_one({"owner_email": user_id})
        or salons_collection.find_one({})
    )
    salon_id   = salon["id"]              if salon else "default_salon_123"
    salon_name = salon.get("name", "Luxe Studio") if salon else "Luxe Studio"

    new_reel = {
        "id": str(uuid.uuid4()),
        "salon_id":      salon_id,
        "salon_name":    salon_name,
        "owner_user_id": user_id,
        "stylist_name":  user_id.split("@")[0].capitalize(),
        "video_url":     video_url,
        "thumbnail_url": "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=400&q=80",
        "caption":       caption,
        "service_name":  service_name,
        "service_price": service_price,
        "category":      category,
        "likes_count":   0, "comments_count": 0, "shares_count": 0,
        "saves_count":   0, "views_count": 0,
        "liked_by": [], "saved_by": [],
        "created_at": datetime.utcnow().isoformat(),
    }

    reels_collection.insert_one(new_reel)
    new_reel.pop("_id", None)
    new_reel["is_liked"] = False
    new_reel["is_saved"] = False

    return {"status": "success", "message": "Reel uploaded successfully!", "reel": new_reel}
