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
TESSERACT_PATH = os.getenv("TESSERACT_PATH", None)
if not TESSERACT_PATH:
    for _path in [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        r"C:\Users\jasmi\AppData\Local\Programs\Tesseract-OCR\tesseract.exe",
        r"C:\Users\jasmi\tesseract.exe", # Custom path
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


# ─────────────────────────────────────────────────────────────
#  INGREDIENT CONFLICT CHECKER
# ─────────────────────────────────────────────────────────────

# Known conflict pairs: (ingredient_a_keyword, ingredient_b_keyword, risk, reason, tip)
CONFLICT_RULES = [
    ("retinol",     "vitamin c",   "High",   "Retinol + Vitamin C (L-Ascorbic Acid) can deactivate each other and cause irritation at low pH.", "Use Vitamin C in the morning and Retinol at night."),
    ("retinol",     "ascorbic",    "High",   "Ascorbic acid destabilises Retinol and can cause skin irritation.", "Separate into AM (Vitamin C) and PM (Retinol) routines."),
    ("retinol",     "aha",         "High",   "AHAs lower skin pH which can irritate skin already sensitised by Retinol.", "Alternate nights: Retinol one night, AHA the next."),
    ("retinol",     "bha",         "High",   "BHA combined with Retinol may cause excessive dryness and peeling.", "Use on alternate evenings."),
    ("niacinamide", "vitamin c",   "Medium", "High-strength Niacinamide with pure Vitamin C can form Niacin (temporary flushing). At lower percentages (below 5%), this is generally not an issue.", "Use separately or choose stable Vitamin C derivatives like Ascorbyl Glucoside."),
    ("aha",         "bha",         "Medium", "Using multiple exfoliants together can over-exfoliate and cause sensitivity.", "Use one at a time or on alternate days."),
    ("benzoyl",     "retinol",     "High",   "Benzoyl Peroxide oxidises and deactivates Retinol, making both less effective.", "Use Benzoyl Peroxide in the morning and Retinol at night."),
    ("benzoyl",     "vitamin c",   "High",   "Benzoyl Peroxide oxidises Vitamin C, drastically reducing its efficacy.", "Keep these in separate routines."),
    ("vitamin c",   "copper",      "Medium", "Copper peptides can oxidise Vitamin C, reducing its antioxidant effectiveness.", "Use Vitamin C in the morning and Copper Peptides in the evening."),
    ("spf",         "retinol",     "Low",    "SPF should always be applied last; layering Retinol under SPF during daytime can increase photosensitivity.", "Reserve Retinol for night-time use only."),
]

SAFE_COMBOS = [
    ("hyaluronic acid", "niacinamide"),
    ("ceramide",        "niacinamide"),
    ("hyaluronic acid", "vitamin c"),
    ("spf",             "vitamin c"),
    ("niacinamide",     "spf"),
    ("peptide",         "hyaluronic acid"),
]

class ConflictRequest(BaseModel):
    product_a: str
    product_b: str

@router.post("/conflict")
async def check_ingredient_conflict(
    req: ConflictRequest,
    current_user: dict = Depends(get_current_user),
):
    """Check compatibility between two product ingredient lists."""
    a = req.product_a.lower()
    b = req.product_b.lower()
    combined = a + " ||| " + b

    conflicts = []
    for (kw1, kw2, risk, reason, tip) in CONFLICT_RULES:
        in_a = kw1 in a or kw2 in a
        in_b = kw1 in b or kw2 in b
        cross = (kw1 in a and kw2 in b) or (kw2 in a and kw1 in b)
        if cross:
            conflicts.append({
                "pair": f"{kw1.title()} + {kw2.title()}",
                "risk": risk,
                "reason": reason,
                "tip": tip,
            })

    # Safe combos
    safe = []
    for (kw1, kw2) in SAFE_COMBOS:
        if (kw1 in a or kw1 in b) and (kw2 in a or kw2 in b):
            safe.append(f"{kw1.title()} + {kw2.title()}")

    general_tip = None
    if len(conflicts) == 0:
        general_tip = "No known conflicts detected. Always patch-test new combinations and introduce products gradually."
    elif any(c["risk"] == "High" for c in conflicts):
        general_tip = "High-risk conflicts found. We recommend separating these products into different routines (AM vs PM) or alternate days."

    return {
        "success": True,
        "conflicts": conflicts,
        "safe_combos": safe,
        "general_tip": general_tip,
        "total_conflicts": len(conflicts),
    }
