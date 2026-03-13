from typing import List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Use Many-to-Many model for multi-language support (not just English to Many)
MODEL_NAME = "facebook/mbart-large-50-many-to-many-mmt"

class TranslationEngine:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.device = "cpu"
        self._loaded = False

    def _lazy_load(self):
        """Only load the heavy mBART model when actually needed."""
        if self._loaded:
            return
            
        logger.info(f"Attempting to load mBART-50 model: {MODEL_NAME}")
        try:
            # Check for memory environment - if on a 512MB RAM instance, DON'T load
            # This is a safety check for Render Free Tier
            import psutil
            total_ram = psutil.virtual_memory().total / (1024**3) # GB
            if total_ram < 1.0: # If less than 1GB RAM, don't even try
                logger.warning("Low memory environment detected (<1GB). Skipping heavy model load.")
                self._loaded = True
                return

            from transformers import MBartForConditionalGeneration, MBart50TokenizerFast
            import torch
            
            self.tokenizer = MBart50TokenizerFast.from_pretrained(MODEL_NAME)
            self.model = MBartForConditionalGeneration.from_pretrained(MODEL_NAME)
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            self.model.to(self.device)
            logger.info(f"Model loaded successfully on {self.device}")
        except Exception as e:
            logger.error(f"Failed to load translation model: {str(e)}")
            self.model = None
            self.tokenizer = None
            
        self._loaded = True

    def translate_batch(self, texts: List[str], src_lang: str, tgt_lang: str, batch_size: int = 4) -> List[str]:
        """
        Translates a list of strings while preserving order and handling batching.
        """
        if not texts:
            return []
            
        self._lazy_load()
        
        if self.model is None or self.tokenizer is None:
            # Fallback: Return original text if model failed to load
            logger.warning("Translation model unavailable. Returning original text.")
            return texts

        # Set source language on tokenizer
        self.tokenizer.src_lang = src_lang
        
        translated_texts = []
        
        # Process in batches for better performance and memory management
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            
            # Tokenize input
            inputs = self.tokenizer(
                batch, 
                return_tensors="pt", 
                padding=True, 
                truncation=True, 
                max_length=1024
            ).to(self.device)
            
            # Generate translation tokens with professional-grade parameters
            generated_tokens = self.model.generate(
                **inputs,
                forced_bos_token_id=self.tokenizer.lang_code_to_id[tgt_lang],
                num_beams=5,
                early_stopping=True,
                repetition_penalty=1.2
            )
            
            # Decode translations
            decoded = self.tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)
            translated_texts.extend(decoded)
            
        return translated_texts

# Singleton instance for the app
translation_engine = None

def get_translation_engine():
    global translation_engine
    if translation_engine is None:
        translation_engine = TranslationEngine()
    return translation_engine
