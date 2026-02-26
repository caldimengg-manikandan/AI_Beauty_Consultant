from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from app.auth.jwt_handler import get_current_user
from pydantic import BaseModel
from typing import List, Optional
import base64
import requests
import os

router = APIRouter(prefix="/api/ingredients", tags=["Ingredient Scanner"])

from app.ml.ingredient_db import INGREDIENT_DB, SYNONYMS

class IngredientRequest(BaseModel):
    ingredients_text: str

def load_api_key():
    token = os.getenv("OPENROUTER_API_KEY")
    if not token:
        # Fallback to reading .env directly if environment variable isn't set (dev mode)
        try:
            with open(".env", "r") as f:
                for line in f:
                    if line.startswith("OPENROUTER_API_KEY"):
                        return line.strip().split("=")[1]
        except: return None
    return token

@router.post("/ocr")
async def ocr_ingredients(image: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """
    AI-Powered OCR using Gemini Flash. 
    Extracts ingredient names from a product label photo.
    """
    api_key = load_api_key()
    if not api_key:
        raise HTTPException(status_code=500, detail="AI Service Busy: No API Key found.")

    try:
        contents = await image.read()
        base64_image = base64.b64encode(contents).decode('utf-8')
        
        # Call Gemini via OpenRouter
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "google/gemini-2.0-flash-exp:free",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Extract all skincare ingredients listed in this image. Return ONLY a comma-separated list of ingredient names. If no ingredients are found, return 'None'."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ]
            },
            timeout=20
        )
        
        if response.status_code == 200:
            result = response.json()
            extracted_text = result['choices'][0]['message']['content']
            
            if "none" in extracted_text.lower() and len(extracted_text) < 10:
                 return {"success": False, "message": "No ingredients detected. Please try a clearer photo."}
            
            # Now run the scan logic on the extracted text
            scan_res = await scan_ingredients(IngredientRequest(ingredients_text=extracted_text), current_user)
            return {
                "success": True,
                "extracted_text": extracted_text,
                **scan_res
            }
        else:
            print(f"OCR Error: {response.text}")
            raise HTTPException(status_code=500, detail="AI Extraction failed. Try manual entry.")

    except Exception as e:
        print(f"⚡ OCR CRASH: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scan")
async def scan_ingredients(req: IngredientRequest, current_user: dict = Depends(get_current_user)):
    text = req.ingredients_text.lower()
    
    # Pre-process text (clean up commas/formatting)
    raw_list = [i.strip() for i in text.replace(';', ',').replace('\n', ',').replace('.', ',').split(',') if i.strip()]
    
    found = []
    found_names = set()
    
    for raw_item in raw_list:
        match_found = False
        search_term = raw_item
        if search_term in SYNONYMS:
             search_term = SYNONYMS[search_term]

        for ing, data in INGREDIENT_DB.items():
            if ing in search_term or search_term in ing:
                if ing not in found_names:
                    found.append({
                        "name": ing.title(),
                        "scanned_as": raw_item.title(),
                        **data
                    })
                    found_names.add(ing)
                    match_found = True
                    break
        
        if match_found: continue

    # Safety red flags
    red_flags = ["paraben", "sulfate", "phthalate", "dye", "alcohol", "fragrance", "parfum"]
    for raw_item in raw_list:
        if any(flag in raw_item for flag in red_flags):
             already_caught = any(raw_item.title().lower() in i["name"].lower() for i in found)
             if not already_caught:
                 found.append({
                     "name": raw_item.title(),
                     "risk": "Medium",
                     "note": "Potentially contains restricted additives. Review carefully.",
                     "type": "Irritant"
                 })

    return {
        "success": True,
        "total_checked": len(raw_list),
        "recognized_count": len(found),
        "harmful_count": len([i for i in found if i["type"] == "Harmful"]),
        "beneficial_count": len([i for i in found if i["type"] == "Beneficial"]),
        "active_count": len([i for i in found if i["type"] == "Active"]),
        "matches": found
    }
