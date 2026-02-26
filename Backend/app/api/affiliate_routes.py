"""
Product Affiliate API Routes
Recommends real products based on skin analysis and matches them with affiliate data
"""
from fastapi import APIRouter, Depends, HTTPException
from app.auth.jwt_handler import get_current_user
from app.mongodb.client import db
from pydantic import BaseModel
from typing import List, Optional
import random

router = APIRouter(prefix="/api/affiliate", tags=["Affiliate & Products"])

# Demo product database (In production, replace with real API or scraped data)
FEATURED_PRODUCTS = [
    {
        "id": "p1",
        "name": "CeraVe Hydrating Facial Cleanser",
        "brand": "CeraVe",
        "price": 899,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1612817288484-6f916008241d?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.amazon.in/CeraVe-Hydrating-Cleanser-Normal-Skin/dp/B01MSSDEPK",
        "category": "Cleanser",
        "suitable_for": ["dry", "normal", "sensitive"],
        "concerns": ["dehydration", "sensitivity"],
        "rating": 4.8,
        "reviews": 12450
    },
    {
        "id": "p2",
        "name": "The Ordinary Niacinamide 10% + Zinc 1%",
        "brand": "The Ordinary",
        "price": 650,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.nykaa.com/the-ordinary-niacinamide-10-percent-zinc-1-percent/p/5003152",
        "category": "Serum",
        "suitable_for": ["oily", "combination"],
        "concerns": ["acne", "oiliness", "pores"],
        "rating": 4.6,
        "reviews": 8900
    },
    {
        "id": "p3",
        "name": "La Roche-Posay Anthelios Melt-in Milk Sunscreen SPF 60",
        "brand": "La Roche-Posay",
        "price": 2200,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.amazon.in/Roche-Posay-Anthelios-Melt-Sunscreen-Ounce/dp/B002CML1VG",
        "category": "Sunscreen",
        "suitable_for": ["normal", "dry", "combination", "oily", "sensitive"],
        "concerns": ["aging", "sun protection"],
        "rating": 4.9,
        "reviews": 5600
    },
    {
        "id": "p4",
        "name": "Paula's Choice Skin Perfecting 2% BHA Liquid Exfoliant",
        "brand": "Paula's Choice",
        "price": 2700,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.amazon.in/Paulas-Choice-SKIN-PERFECTING-Exfoliant-Salicylic/dp/B00949CTQQ",
        "category": "Exfoliant",
        "suitable_for": ["oily", "combination"],
        "concerns": ["acne", "texture", "blackheads"],
        "rating": 4.7,
        "reviews": 15000
    },
    {
        "id": "p5",
        "name": "Neutrogena Hydro Boost Water Gel",
        "brand": "Neutrogena",
        "price": 1050,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.amazon.in/Neutrogena-Hydro-Boost-Water-50g/dp/B00H76X7R2",
        "category": "Moisturizer",
        "suitable_for": ["normal", "combination", "oily"],
        "concerns": ["dehydration"],
        "rating": 4.5,
        "reviews": 22000
    },
    {
        "id": "p6",
        "name": "Cosrx Advanced Snail 96 Mucin Power Essence",
        "brand": "Cosrx",
        "price": 1450,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.nykaa.com/cosrx-advanced-snail-96-mucin-power-essence/p/950530",
        "category": "Serum",
        "suitable_for": ["dry", "combination", "sensitive"],
        "concerns": ["texture", "dehydration", "aging"],
        "rating": 4.8,
        "reviews": 35000
    },
    {
        "id": "p7",
        "name": "Minimalist Salicylic Acid 2% Face Cleanser",
        "brand": "Minimalist",
        "price": 299,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.amazon.in/Minimalist-Salicylic-Cleanser-Exfoliating-Anti-Acne/dp/B08WKPPX72",
        "category": "Cleanser",
        "suitable_for": ["oily", "acne-prone"],
        "concerns": ["acne", "oiliness"],
        "rating": 4.4,
        "reviews": 12000
    },
    {
        "id": "p8",
        "name": "Beauty of Joseon Relief Sun : Rice + Probiotics",
        "brand": "Beauty of Joseon",
        "price": 1650,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1594411494883-911e3895e347?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.nykaa.com/beauty-of-joseon-relief-sun-rice-probiotics-spf50-pa/p/7423371",
        "category": "Sunscreen",
        "suitable_for": ["all", "sensitive"],
        "concerns": ["sun protection"],
        "rating": 4.9,
        "reviews": 28000
    },
    {
        "id": "p9",
        "name": "Bioderma Sensibio H2O Micellar Water",
        "brand": "Bioderma",
        "price": 990,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1570172619385-2db170364d9c?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.nykaa.com/bioderma-sensibio-h2o/p/5042",
        "category": "Cleanser",
        "suitable_for": ["sensitive", "all"],
        "concerns": ["sensitivity"],
        "rating": 4.7,
        "reviews": 45000
    },
    {
        "id": "p10",
        "name": "The Ordinary Glycolic Acid 7% Toning Solution",
        "brand": "The Ordinary",
        "price": 1250,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.nykaa.com/the-ordinary-glycolic-acid-7-percent-toning-solution/p/5003154",
        "category": "Exfoliant",
        "suitable_for": ["combination", "oily", "normal"],
        "concerns": ["texture", "dullness"],
        "rating": 4.5,
        "reviews": 19000
    },
    {
        "id": "p11",
        "name": "Kiehl's Ultra Facial Cream",
        "brand": "Kiehl's",
        "price": 2850,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1629732047847-50bad15339f5?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.kiehls.in/ultra-facial-cream.html",
        "category": "Moisturizer",
        "suitable_for": ["dry", "normal", "sensitive"],
        "concerns": ["dehydration"],
        "rating": 4.7,
        "reviews": 18000
    },
    {
        "id": "p12",
        "name": "Laneige Lip Sleeping Mask",
        "brand": "Laneige",
        "price": 1380,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1616683693504-3ea769ad6fcd?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.nykaa.com/laneige-lip-sleeping-mask-berry/p/363841",
        "category": "Serum",
        "suitable_for": ["all"],
        "concerns": ["dry lips"],
        "rating": 4.8,
        "reviews": 55000
    },
    {
        "id": "p13",
        "name": "SK-II Facial Treatment Essence",
        "brand": "SK-II",
        "price": 16500,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1556228852-80b0e5ad0010?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.amazon.in/SK-II-Facial-Treatment-Essence-Ounce/dp/B000Z63DOW",
        "category": "Serum",
        "suitable_for": ["all"],
        "concerns": ["aging", "texture", "dullness"],
        "rating": 4.9,
        "reviews": 12000
    },
    {
        "id": "p14",
        "name": "Drunk Elephant C-Firma Fresh Day Serum",
        "brand": "Drunk Elephant",
        "price": 7200,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.sephora.com/product/drunk-elephant-c-firma-day-serum-P400262",
        "category": "Serum",
        "suitable_for": ["all"],
        "concerns": ["dullness", "pigmentation", "aging"],
        "rating": 4.4,
        "reviews": 8500
    },
    {
        "id": "p15",
        "name": "The Inkey List Hyaluronic Acid Serum",
        "brand": "The Inkey List",
        "price": 750,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1620917670397-dc7bc45e6976?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.nykaa.com/the-inkey-list-hyaluronic-acid-serum/p/1090623",
        "category": "Serum",
        "suitable_for": ["all"],
        "concerns": ["dehydration"],
        "rating": 4.6,
        "reviews": 21000
    },
    {
        "id": "p16",
        "name": "Glow Recipe Watermelon Glow PHA + BHA Pore-Tight Toner",
        "brand": "Glow Recipe",
        "price": 3100,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1617897903246-7dc929280f5d?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.sephora.com/product/glow-recipe-watermelon-glow-pha-bha-pore-tight-toner-P458218",
        "category": "Exfoliant",
        "suitable_for": ["oily", "combination"],
        "concerns": ["pores", "texture"],
        "rating": 4.5,
        "reviews": 11000
    },
    {
        "id": "p17",
        "name": "First Aid Beauty Ultra Repair Cream",
        "brand": "First Aid Beauty",
        "price": 1400,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1552046122-03184de85e08?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.amazon.in/First-Aid-Beauty-Repair-Intense/dp/B004W26S2S",
        "category": "Moisturizer",
        "suitable_for": ["dry", "sensitive"],
        "concerns": ["sensitivity", "dehydration"],
        "rating": 4.8,
        "reviews": 29000
    },
    {
        "id": "p18",
        "name": "Glossier Milky Jelly Cleanser",
        "brand": "Glossier",
        "price": 1900,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1611080541599-8c6dbde6ed28?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.glossier.com/products/milky-jelly-cleanser",
        "category": "Cleanser",
        "suitable_for": ["all", "sensitive"],
        "concerns": ["cleansing"],
        "rating": 4.5,
        "reviews": 16000
    },
    {
        "id": "p19",
        "name": "Sunday Riley Good Genes Glycolic Acid Treatment",
        "brand": "Sunday Riley",
        "price": 6800,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1617897903246-7dc929280f5d?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.amazon.in/Sunday-Riley-Good-Genes-Treatment/dp/B00C7O7T3U",
        "category": "Exfoliant",
        "suitable_for": ["all"],
        "concerns": ["aging", "texture", "dullness"],
        "rating": 4.7,
        "reviews": 9000
    },
    {
        "id": "p20",
        "name": "Shiseido Ultimate Sun Protector Lotion",
        "brand": "Shiseido",
        "price": 3800,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1572635196237-14b3f281303f?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.shiseido.com/us/en/ultimate-sun-protector-lotion-spf-50-sunscreen-0729238160408.html",
        "category": "Sunscreen",
        "suitable_for": ["all"],
        "concerns": ["sun protection"],
        "rating": 4.8,
        "reviews": 14000
    },
    {
        "id": "p21",
        "name": "Biossance Squalane + Vitamin C Rose Oil",
        "brand": "Biossance",
        "price": 5400,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1612817288484-6f916008241d?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.biossance.com/p/squalane-and-vitamin-c-rose-oil/7550302/",
        "category": "Serum",
        "suitable_for": ["all"],
        "concerns": ["dullness", "aging"],
        "rating": 4.7,
        "reviews": 6000
    },
    {
        "id": "p22",
        "name": "Mario Badescu Drying Lotion",
        "brand": "Mario Badescu",
        "price": 1200,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.amazon.in/Mario-Badescu-MB-003-Drying-Lotion/dp/B0017SWIU6",
        "category": "Serum",
        "suitable_for": ["all"],
        "concerns": ["acne", "blemishes"],
        "rating": 4.5,
        "reviews": 32000
    },
    {
        "id": "p23",
        "name": "Summer Fridays Jet Lag Mask",
        "brand": "Summer Fridays",
        "price": 4200,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400",
        "link": "https://summerfridays.com/products/jet-lag-mask",
        "category": "Moisturizer",
        "suitable_for": ["dry", "normal"],
        "concerns": ["dehydration", "dullness"],
        "rating": 4.6,
        "reviews": 15000
    },
    {
        "id": "p24",
        "name": "Herbivore Lapis Facial Oil",
        "brand": "Herbivore",
        "price": 6200,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.herbivorebotanicals.com/products/lapis-facial-oil",
        "category": "Serum",
        "suitable_for": ["oily", "combination"],
        "concerns": ["redness", "skin-balance"],
        "rating": 4.7,
        "reviews": 4000
    },
    {
        "id": "p25",
        "name": "Fenty Skin Hydra Vizor Invisible Moisturizer",
        "brand": "Fenty Skin",
        "price": 3400,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=400",
        "link": "https://fentybeauty.com/products/hydra-vizor-invisible-moisturizer-broad-spectrum-spf-30-sunscreen-with-niacinamide-kalahari-melon",
        "category": "Moisturizer",
        "suitable_for": ["all"],
        "concerns": ["sun protection", "dehydration"],
        "rating": 4.8,
        "reviews": 10000
    },
    {
        "id": "p26",
        "name": "Augustinus Bader The Rich Cream",
        "brand": "Augustinus Bader",
        "price": 22500,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400",
        "link": "https://augustinusbader.com/us/en/the-rich-cream",
        "category": "Moisturizer",
        "suitable_for": ["dry"],
        "concerns": ["aging", "dehydration"],
        "rating": 4.9,
        "reviews": 5000
    },
    {
        "id": "p27",
        "name": "Tatcha The Water Cream",
        "brand": "Tatcha",
        "price": 5800,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1612817288484-6f916008241d?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.tatcha.com/product/water-cream/CL01011T.html",
        "category": "Moisturizer",
        "suitable_for": ["oily", "combination"],
        "concerns": ["pores", "oiliness"],
        "rating": 4.7,
        "reviews": 12000
    },
    {
        "id": "p28",
        "name": "Oleo-Relax Serum",
        "brand": "Kerastase",
        "price": 3200,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.nykaa.com/kerastase-discipline-oleo-relax-serum/p/568856",
        "category": "Serum",
        "suitable_for": ["all"],
        "concerns": ["frizzy-hair"],
        "rating": 4.6,
        "reviews": 8000
    },
    {
        "id": "p29",
        "name": "Supergoop! Unseen Sunscreen SPF 40",
        "brand": "Supergoop!",
        "price": 3200,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1594411494883-911e3895e347?auto=format&fit=crop&q=80&w=400",
        "link": "https://supergoop.com/products/unseen-sunscreen",
        "category": "Sunscreen",
        "suitable_for": ["all"],
        "concerns": ["sun protection"],
        "rating": 4.8,
        "reviews": 25000
    },
    {
        "id": "p30",
        "name": "Youth To The People Superfood Cleanser",
        "brand": "Youth To The People",
        "price": 3400,
        "currency": "INR",
        "image": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400",
        "link": "https://www.sephora.com/product/superfood-antioxidant-cleanser-P411387",
        "category": "Cleanser",
        "suitable_for": ["all"],
        "concerns": ["cleansing", "dullness"],
        "rating": 4.7,
        "reviews": 14000
    }
]

@router.get("/recommendations")
async def get_product_recommendations(
    skin_type: Optional[str] = None,
    concern: Optional[str] = None,
    limit: int = 4,
    current_user: dict = Depends(get_current_user)
):
    """
    Get smart product recommendations based on user's skin type and concerns.
    In a real app, this would use the user's latest analysis from DB.
    """
    recommended = []
    
    # Simple filtering logic
    for product in FEATURED_PRODUCTS:
        score = 0
        if skin_type and skin_type.lower() in product["suitable_for"]:
            score += 50
        if concern and concern.lower() in product["concerns"]:
            score += 50
            
        if score > 0:
            product_copy = product.copy()
            product_copy["match_score"] = score + random.randint(0, 45) # Add some variety
            recommended.append(product_copy)
            
    # If no matches, return top rated products
    if not recommended:
        recommended = FEATURED_PRODUCTS[:limit]
    
    # Sort by match score
    recommended.sort(key=lambda x: x.get("match_score", 0), reverse=True)
    
    return recommended[:limit]

@router.get("/featured")
async def get_featured_products():
    """Get all featured products for the store/discovery page."""
    return FEATURED_PRODUCTS
