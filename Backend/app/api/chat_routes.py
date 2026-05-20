from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import re
from datetime import datetime, timedelta
import uuid

from app.auth.jwt_handler import get_current_user
from app.mongodb.collections import appointments_collection, salons_collection

router = APIRouter(prefix="/api/chat", tags=["AI Chatbot"])

class ChatMessage(BaseModel):
    message: str
    context: dict = {}

def extract_intent(text: str):
    text = text.lower()
    
    if "book" in text or "appointment" in text or "schedule" in text:
        return "booking"
    if "cancel" in text or "reschedule" in text:
        return "modify_booking"
    if "price" in text or "cost" in text or "how much" in text:
        return "pricing"
    if "recommend" in text or "what should i get" in text or "suggest" in text:
        return "recommendation"
    if "hello" in text or "hi" in text or "hey" in text:
        return "greeting"
        
    return "unknown"

KB = [
    {
        "keys": ["oily skin", "oily face", "shiny face", "excess oil", "sebum"],
        "ans": "For **oily skin**: Use a foaming or gel cleanser, niacinamide 10% serum (controls sebum), oil-free moisturiser with hyaluronic acid, and a matte SPF 50. Avoid heavy creams. Exfoliate with salicylic acid 2% BHA 2-3x weekly."
    },
    {
        "keys": ["dry skin", "flaky skin", "tight skin", "dehydrated"],
        "ans": "For **dry skin**: Use a creamy sulphate-free cleanser, apply hyaluronic acid serum on damp skin, layer with ceramide moisturiser, and finish with SPF 50. At night, use a rich sleeping mask or squalane oil."
    },
    {
        "keys": ["sensitive skin", "redness", "reactive skin", "irritated"],
        "ans": "For **sensitive skin**: Stick to fragrance-free, minimal-ingredient products. Use Centella Asiatica or Azelaic Acid 10% to calm redness. Avoid harsh exfoliants like AHA. Always patch-test new products."
    },
    {
        "keys": ["acne", "pimple", "breakout", "blemish", "zit"],
        "ans": "For **acne**: Cleanse with salicylic acid face wash, apply benzoyl peroxide 2.5% spot treatment, and use niacinamide 10% serum. At night, use adapalene 3x weekly."
    },
    {
        "keys": ["dark spot", "pigmentation", "hyperpigmentation", "melasma", "uneven tone"],
        "ans": "For **dark spots**: Use Vitamin C 15% serum every morning (AM only). Add niacinamide 10% for extra brightening. Sunscreen SPF 50 daily is NON-NEGOTIABLE."
    },
    {
        "keys": ["wrinkle", "fine line", "aging", "anti-aging", "collagen", "firmness"],
        "ans": "For **anti-aging**: Retinol 0.3% is the gold standard — start 2x weekly at night. Add a peptide serum for collagen support. Always use SPF in the morning."
    },
    {
        "keys": ["sunscreen", "spf", "sun protection", "uv", "sunblock"],
        "ans": "**SPF is the single most important skincare step** — use SPF 50 PA++++ every morning, even indoors. Reapply every 2 hours if outdoors."
    },
    {
        "keys": ["niacinamide"],
        "ans": "**Niacinamide (Vitamin B3)**: Controls oil, minimises pores, fades dark spots, strengthens skin barrier. Safe to mix with most actives."
    },
    {
        "keys": ["hyaluronic acid", "hyaluronic"],
        "ans": "**Hyaluronic Acid**: A humectant that holds 1000x its weight in water. Apply to DAMP skin for best results, then seal with a moisturiser."
    },
    {
        "keys": ["retinol", "retinoid", "vitamin a"],
        "ans": "**Retinol**: The most scientifically proven anti-aging ingredient. Start with 0.3% twice weekly at night. Follow with moisturiser, and wear SPF next morning."
    },
    {
        "keys": ["salicylic acid", "bha"],
        "ans": "**Salicylic Acid (BHA 2%)**: Oil-soluble exfoliant that penetrates pores to clear blackheads and treat acne. Use 2-3x weekly."
    }
]

def search_kb(text: str):
    text = text.lower()
    for item in KB:
        if any(key in text for key in item["keys"]):
            return item["ans"]
    return None

def extract_booking_details(text: str):
    details = {"service": None, "time": None, "date": None}
    
    # Simple keyword extraction
    services = ["haircut", "facial", "massage", "manicure", "pedicure", "coloring", "spa", "makeup"]
    for s in services:
        if s in text.lower():
            details["service"] = s.capitalize()
            break
            
    # Mock time extraction
    if "tomorrow" in text.lower():
        details["date"] = (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d")
    elif "today" in text.lower():
        details["date"] = datetime.utcnow().strftime("%Y-%m-%d")
        
    # Time extraction (e.g., 2pm, 10am)
    time_match = re.search(r'(\d{1,2})(?::\d{2})?\s*(am|pm)', text.lower())
    if time_match:
        details["time"] = time_match.group(0)
        
    return details

@router.post("/message")
async def handle_chat_message(req: ChatMessage, current_user: dict = Depends(get_current_user)):
    user_msg = req.message
    intent = extract_intent(user_msg)
    user_id = current_user.get("sub")
    
    response_text = ""
    action = None
    action_data = None
    
    if intent == "greeting":
        response_text = "Hello! I'm your AI Beauty Assistant. How can I help you today? I can help you book appointments, check prices, or recommend treatments."
        
    elif intent == "pricing":
        response_text = "Our prices vary by salon, but generally haircuts start at ₹500, facials at ₹1200, and massages at ₹1500. Would you like to book a specific service?"
        
    elif intent == "recommendation":
        response_text = "I recommend taking our AI Skin & Face Analysis! It will scan your face and recommend the perfect treatments and products tailored specifically for you."
        action = "NAVIGATE"
        action_data = "/analyze"
        
    elif intent == "booking":
        details = extract_booking_details(user_msg)
        
        if details["service"] and details["date"] and details["time"]:
            response_text = f"Great! I can book a {details['service']} for you on {details['date']} at {details['time']}. Shall I confirm this appointment?"
            action = "CONFIRM_BOOKING"
            action_data = details
        elif details["service"]:
            response_text = f"You'd like a {details['service']}. When would you like to come in? (e.g., 'tomorrow at 2pm')"
            action = "COLLECT_TIME"
        else:
            response_text = "I can definitely help you book an appointment! What service are you looking for, and when would you like to come in?"
            action = "COLLECT_DETAILS"
            
    elif intent == "modify_booking":
        response_text = "You can view and manage all your upcoming appointments in your Dashboard. Would you like me to take you there?"
        action = "NAVIGATE"
        action_data = "/dashboard"
        
    else:
        # Check if they are confirming a booking
        if req.context.get("pending_action") == "CONFIRM_BOOKING" and ("yes" in user_msg.lower() or "sure" in user_msg.lower() or "ok" in user_msg.lower()):
            details = req.context.get("action_data", {})
            
            # Create the actual appointment
            salon = salons_collection.find_one({}) # Just pick the first salon for demo
            salon_id = str(salon["_id"]) if salon else "demo_salon"
            salon_name = salon["name"] if salon else "Luxe Beauty Lounge"
            
            new_appt = {
                "id": str(uuid.uuid4()),
                "user_email": user_id,
                "salon_id": salon_id,
                "salon_name": salon_name,
                "service": details.get("service", "General Service"),
                "date": details.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
                "time": details.get("time", "12:00 PM"),
                "status": "confirmed",
                "booked_via": "ai_chat",
                "created_at": datetime.utcnow()
            }
            appointments_collection.insert_one(new_appt)
            
            response_text = f"Awesome! Your {details.get('service')} appointment at {salon_name} is confirmed for {details.get('date')} at {details.get('time')}. See you then! ✨"
            action = "BOOKING_SUCCESS"
        else:
            # Check if keyword answers it
            kb_ans = search_kb(user_msg)
            if kb_ans:
                response_text = kb_ans
            else:
                response_text = "I'm not sure about that specific question, but I'd love to help! 🤔 I can help you book an appointment, recommend treatments, or give pricing information. What would you like to do?"
            
    return {
        "reply": response_text,
        "action": action,
        "action_data": action_data
    }
