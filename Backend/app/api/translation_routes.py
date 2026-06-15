import logging
_log = logging.getLogger("beauty_api.translation")

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from ..ml.translation_engine import get_translation_engine

router = APIRouter(prefix="/api/translate", tags=["Translation"])

class TranslationRequest(BaseModel):
    texts: List[str]
    source_language: str
    target_language: str

class TranslationResponse(BaseModel):
    translations: List[str]

# ISO code mapping for mBART-50
LANGUAGE_MAPPING = {
    "arabic": "ar_AR",
    "english": "en_XX",
    "gujarati": "gu_IN",
    "hindi": "hi_IN",
    "bengali": "bn_IN",
    "malayalam": "ml_IN",
    "marathi": "mr_IN",
    "tamil": "ta_IN",
    "telugu": "te_IN",
    "french": "fr_XX",
    "spanish": "es_XX"
}

@router.post("/batch", response_model=TranslationResponse)
async def translate_batch(request: TranslationRequest):
    """
    Main endpoint for whole-page translation. 
    Accepts a list of strings and returns translated strings in order.
    """
    try:
        # Standardize language names to mBART codes
        src = LANGUAGE_MAPPING.get(request.source_language.lower())
        tgt = LANGUAGE_MAPPING.get(request.target_language.lower())
        
        if not src or not tgt:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported language. Supported: {list(LANGUAGE_MAPPING.keys())}"
            )
            
        engine = get_translation_engine()
        translations = engine.translate_batch(request.texts, src, tgt)
        
        return TranslationResponse(translations=translations)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

@router.get("/languages")
async def get_supported_languages():
    return {"languages": list(LANGUAGE_MAPPING.keys())}
