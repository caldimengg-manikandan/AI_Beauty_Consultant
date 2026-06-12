from fastapi import APIRouter, Depends, HTTPException
from app.auth.jwt_handler import get_current_user
from app.mongodb.collections import reels_collection, salons_collection
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/reels", tags=["Reels & Videos"])

# Sample vertical MP4s for the demo
MOCK_VIDEOS = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
]

def seed_reels_if_empty():
    count = reels_collection.count_documents({})
    if count == 0:
        # Fetch some salon to attribute the reels to
        salon = salons_collection.find_one({})
        salon_id = salon["id"] if salon else "default_salon_123"
        salon_name = salon.get("name", "Luxe Studio") if salon else "Luxe Studio"

        mock_reels = [
            {
                "id": str(uuid.uuid4()),
                "salon_id": salon_id,
                "salon_name": salon_name,
                "stylist_name": "Elena R.",
                "video_url": MOCK_VIDEOS[0],
                "thumbnail_url": "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=400&q=80",
                "caption": "Summer balayage transformation! ☀️💇‍♀️ #balayage #summerhair",
                "likes_count": 1245,
                "comments_count": 42,
                "shares_count": 18,
                "liked_by": [],
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "salon_id": salon_id,
                "salon_name": salon_name,
                "stylist_name": "Marcus T.",
                "video_url": MOCK_VIDEOS[1],
                "thumbnail_url": "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=400&q=80",
                "caption": "Glass skin facial routine step-by-step ✨💆‍♀️ #skincare #facial",
                "likes_count": 3890,
                "comments_count": 115,
                "shares_count": 210,
                "liked_by": [],
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "salon_id": salon_id,
                "salon_name": salon_name,
                "stylist_name": "Sarah J.",
                "video_url": MOCK_VIDEOS[2],
                "thumbnail_url": "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=400&q=80",
                "caption": "Bridal makeup trial! Rate this look 1-10 👰💖 #bridalmakeup #glam",
                "likes_count": 5200,
                "comments_count": 340,
                "shares_count": 89,
                "liked_by": [],
                "created_at": datetime.utcnow().isoformat()
            }
        ]
        reels_collection.insert_many(mock_reels)

@router.get("/feed")
async def get_reels_feed(current_user: dict = Depends(get_current_user)):
    """Get the infinite scrolling feed of beauty reels."""
    seed_reels_if_empty()
    
    user_id = current_user.get("sub")
    cursor = reels_collection.find().sort("created_at", -1)
    reels = list(cursor)
    
    # Format and inject `is_liked` for the current user
    formatted_reels = []
    for r in reels:
        r.pop("_id", None)
        r["is_liked"] = user_id in r.get("liked_by", [])
        formatted_reels.append(r)
        
    return formatted_reels

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
        inc = -1
        is_liked = False
    else:
        liked_by.append(user_id)
        inc = 1
        is_liked = True
        
    reels_collection.update_one(
        {"id": reel_id},
        {
            "$set": {"liked_by": liked_by},
            "$inc": {"likes_count": inc}
        }
    )
    
    return {"status": "success", "is_liked": is_liked, "likes_count": reel.get("likes_count", 0) + inc}

from fastapi import File, UploadFile, Form
import os

@router.post("/upload")
async def upload_reel(
    video: UploadFile = File(...),
    caption: str = Form(""),
    current_user: dict = Depends(get_current_user)
):
    """Upload a new beauty reel video."""
    user_id = current_user.get("sub")
    
    # 1. Save video file to disk
    filename = f"reel_{uuid.uuid4().hex}.mp4"
    file_path = os.path.join("static/uploads", filename)
    os.makedirs("static/uploads", exist_ok=True)
    
    try:
        video_bytes = await video.read()
        with open(file_path, "wb") as f:
            f.write(video_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save video: {str(e)}")

    BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
    video_url = f"{BASE_URL}/static/uploads/{filename}"
    
    # Create a new reel document
    # Assign some dummy salon properties if the user isn't a salon owner yet
    salon = salons_collection.find_one({})
    salon_id = salon["id"] if salon else "default_salon_123"
    salon_name = salon.get("name", "Luxe Studio") if salon else "Luxe Studio"

    new_reel = {
        "id": str(uuid.uuid4()),
        "salon_id": salon_id,
        "salon_name": salon_name,
        "stylist_name": user_id.split('@')[0].capitalize(),
        "video_url": video_url,
        "thumbnail_url": "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=400&q=80",
        "caption": caption,
        "likes_count": 0,
        "comments_count": 0,
        "shares_count": 0,
        "liked_by": [],
        "created_at": datetime.utcnow().isoformat()
    }
    
    reels_collection.insert_one(new_reel)
    new_reel.pop("_id", None)
    new_reel["is_liked"] = False
    
    return {"status": "success", "message": "Reel uploaded successfully!", "reel": new_reel}

