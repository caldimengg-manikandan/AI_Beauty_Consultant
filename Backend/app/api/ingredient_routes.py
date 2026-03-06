from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from app.auth.jwt_handler import get_current_user
from pydantic import BaseModel
from typing import List, Optional
import os
import io

router = APIRouter(prefix="/api/ingredients", tags=["Ingredient Scanner"])

from app.ml.ingredient_db import INGREDIENT_DB, SYNONYMS

class IngredientRequest(BaseModel):
    ingredients_text: str

# --- Tesseract binary path (Windows) ---
TESSERACT_PATH = None
for _path in [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    r"C:\Users\jasmi\AppData\Local\Programs\Tesseract-OCR\tesseract.exe",
]:
    if os.path.exists(_path):
        TESSERACT_PATH = _path
        break


@router.post("/ocr")
async def ocr_ingredients(image: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """
    Offline OCR using Tesseract. No API keys or quotas. Completely free.
    """
    try:
        import pytesseract
        from PIL import Image, ImageFilter, ImageEnhance

        # Set Tesseract binary path
        if TESSERACT_PATH:
            pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH
        else:
            raise Exception("Tesseract not found. Please install from: https://github.com/UB-Mannheim/tesseract/wiki")

        print("[OCR] Running Tesseract on uploaded label..."
)
        contents = await image.read()

        # --- IMAGE PREPROCESSING for better OCR accuracy ---
        img = Image.open(io.BytesIO(contents))

        # Convert to RGB if needed
        if img.mode not in ['RGB', 'L']:
            img = img.convert('RGB')

        # Upscale for better character recognition (2x)
        w, h = img.size
        img = img.resize((w * 2, h * 2), Image.LANCZOS)

        # Convert to grayscale
        img = img.convert('L')

        # Sharpen edges
        img = img.filter(ImageFilter.SHARPEN)
        img = img.filter(ImageFilter.SHARPEN)

        # Increase contrast
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(2.5)

        # --- RUN OCR ---
        # PSM 6 = Assume single uniform block of text (best for ingredient lists)
        raw_text = pytesseract.image_to_string(img, config='--psm 6 --oem 3')
        print(f"[OCR] Raw text:\n{raw_text}")

        if not raw_text.strip():
            return {
                "success": False,
                "message": "OCR couldn't read the image. Please upload a clear, well-lit, close-up photo of the ingredient label."
            }

        # --- CLEAN & EXTRACT ---
        lines = raw_text.split('\n')
        ingredient_lines = []
        for line in lines:
            line = line.strip()
            if not line or len(line) < 3:
                continue
            if not any(c.isalpha() for c in line):
                continue
            ingredient_lines.append(line)

        extracted_text = ', '.join(ingredient_lines)
        print(f"[OCR] Cleaned text: {extracted_text}")

        if not extracted_text.strip():
            return {"success": False, "message": "No readable text found. Please try a clearer photo."}

        scan_res = await scan_ingredients(IngredientRequest(ingredients_text=extracted_text), current_user)
        return {
            "success": True,
            "extracted_text": extracted_text,
            **scan_res
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[OCR] Error: {e}")
        raise HTTPException(status_code=500, detail=f"OCR Error: {str(e)}")


@router.post("/scan")
async def scan_ingredients(req: IngredientRequest, current_user: dict = Depends(get_current_user)):
    text = req.ingredients_text.lower()

    # Pre-process text — split on common separators
    raw_list = [
        i.strip()
        for i in text
            .replace(';', ',')
            .replace('\n', ',')
            .replace('&', ',')
            .replace('(', ',')
            .replace(')', ',')
            .split(',')
        if i.strip() and len(i.strip()) > 1
    ]

    found = []
    found_names = set()

    for raw_item in raw_list:
        search_term = raw_item.strip()

        # Apply synonym mapping first
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
                    break

    # Safety red flag detection for unlisted ingredients
    red_flags = ["paraben", "sulfate", "phthalate", "dye", "alcohol", "fragrance", "parfum"]
    for raw_item in raw_list:
        if any(flag in raw_item for flag in red_flags):
            already_caught = any(raw_item.lower() in i["name"].lower() for i in found)
            if not already_caught:
                found.append({
                    "name": raw_item.title(),
                    "risk": "Medium",
                    "note": "Potentially contains restricted additives. Review carefully.",
                    "type": "Irritant",
                    "scanned_as": raw_item.title()
                })

    return {
        "success": True,
        "total_checked": len(raw_list),
        "recognized_count": len(found),
        "harmful_count": len([i for i in found if i.get("type") == "Harmful"]),
        "beneficial_count": len([i for i in found if i.get("type") == "Beneficial"]),
        "active_count": len([i for i in found if i.get("type") == "Active"]),
        "matches": found
    }
