"""
AI → Salon Recommendation Engine
Maps skin analysis results to recommended beauty services and salon types.
"""

# Service recommendations based on detected skin conditions
CONDITION_SERVICE_MAP = {
    "acne": {
        "services": ["HydraFacial", "Chemical Peel", "Acne Treatment", "Deep Cleansing Facial"],
        "category": "Skin",
        "salon_types": ["parlour", "spa"],
        "reason": "Recommended for acne-prone skin to deep cleanse and reduce breakouts."
    },
    "dry_skin": {
        "services": ["Hydrating Facial", "Moisturizing Treatment", "Oxygen Facial"],
        "category": "Skin",
        "salon_types": ["parlour", "spa"],
        "reason": "Recommended to restore moisture and improve skin hydration."
    },
    "oily_skin": {
        "services": ["Deep Cleansing Facial", "Pore Minimizing", "Mattifying Treatment"],
        "category": "Skin",
        "salon_types": ["parlour", "spa"],
        "reason": "Recommended to control excess oil and minimize pores."
    },
    "hyperpigmentation": {
        "services": ["Vitamin C Facial", "Brightening Treatment", "Chemical Peel"],
        "category": "Skin",
        "salon_types": ["parlour", "spa"],
        "reason": "Recommended to reduce dark spots and even skin tone."
    },
    "wrinkles": {
        "services": ["Anti-Aging Facial", "Collagen Treatment", "Botox Consultation"],
        "category": "Skin",
        "salon_types": ["parlour", "spa"],
        "reason": "Recommended for anti-aging skin rejuvenation."
    },
    "normal": {
        "services": ["Facial", "Head Massage", "Mani-Pedi", "Hair Spa"],
        "category": "General",
        "salon_types": ["parlour", "salon", "spa"],
        "reason": "Your skin is healthy! Treat yourself to a relaxing session."
    },
    "sensitive": {
        "services": ["Gentle Facial", "Soothing Treatment", "Aromatherapy"],
        "category": "Skin",
        "salon_types": ["spa", "parlour"],
        "reason": "Recommended gentle, hypoallergenic treatments for sensitive skin."
    },
}

# Face shape → hairstyle recommendations
FACE_SHAPE_SERVICE_MAP = {
    "oval": {
        "services": ["Hair Cut", "Hair Color", "Keratin"],
        "reason": "Oval face suits most hairstyles. Consider layers or highlights."
    },
    "round": {
        "services": ["Hair Cut", "Hair Styling", "Blow Dry"],
        "reason": "Elongating styles work best for round faces."
    },
    "square": {
        "services": ["Hair Cut", "Soft Waves", "Hair Spa"],
        "reason": "Soft waves and layers flatter a square face shape."
    },
    "heart": {
        "services": ["Hair Cut", "Side Swept", "Balayage"],
        "reason": "Chin-length cuts and side-swept styles complement heart-shaped faces."
    },
    "oblong": {
        "services": ["Hair Cut", "Beach Waves", "Volume Treatment"],
        "reason": "Volume-adding styles and beach waves suit oblong face shapes."
    },
}


def get_recommendations_from_analysis(analysis_result: dict) -> dict:
    """
    Given a skin analysis result dict, return service recommendations
    and recommended salon types.
    """
    recommendations = []
    recommended_services = set()
    recommended_salon_types = set()

    # Map skin conditions
    skin_conditions = analysis_result.get("skin_conditions", [])
    face_shape = analysis_result.get("face_shape", "").lower()
    skin_type = analysis_result.get("skin_type", "normal").lower()

    # Check skin type
    skin_key = None
    if "acne" in str(skin_conditions).lower() or "acne" in skin_type:
        skin_key = "acne"
    elif "dry" in skin_type:
        skin_key = "dry_skin"
    elif "oily" in skin_type:
        skin_key = "oily_skin"
    elif "sensitive" in skin_type:
        skin_key = "sensitive"
    else:
        skin_key = "normal"

    if skin_key in CONDITION_SERVICE_MAP:
        entry = CONDITION_SERVICE_MAP[skin_key]
        recommendations.append({
            "type": "skin",
            "reason": entry["reason"],
            "services": entry["services"][:3],
        })
        recommended_services.update(entry["services"])
        recommended_salon_types.update(entry["salon_types"])

    # Check face shape
    for shape, data in FACE_SHAPE_SERVICE_MAP.items():
        if shape in face_shape:
            recommendations.append({
                "type": "hairstyle",
                "reason": data["reason"],
                "services": data["services"][:3],
            })
            recommended_services.update(data["services"])
            recommended_salon_types.add("salon")
            break

    return {
        "recommendations": recommendations,
        "recommended_services": list(recommended_services)[:8],
        "recommended_salon_types": list(recommended_salon_types),
        "summary": f"Based on your skin analysis, we recommend these services for your skin type."
    }
