"""
Comprehensive database of beauty and skincare ingredients.
Categorized by type, risk level, and diagnostic notes.
"""

INGREDIENT_DB = {
    # --- HARMFUL / TOXIC ---
    "parabens": {"risk": "High", "note": "Endocrine disruptor. Linked to hormone imbalanced.", "type": "Harmful"},
    "methylparaben": {"risk": "High", "note": "Common preservative. Endocrine disruptor.", "type": "Harmful"},
    "propylparaben": {"risk": "High", "note": "Endocrine disruptor. Avoid if possible.", "type": "Harmful"},
    "butylparaben": {"risk": "High", "note": "High risk preservative.", "type": "Harmful"},
    "formaldehyde": {"risk": "Severe", "note": "Known human carcinogen. Extremely toxic.", "type": "Harmful"},
    "phthalates": {"risk": "High", "note": "Linked to reproductive issues and plastic pollution.", "type": "Harmful"},
    "dibutyl phthalate": {"risk": "High", "note": "Toluene substitute. Reproductive toxin.", "type": "Harmful"},
    "toluene": {"risk": "High", "note": "Solvent linked to developmental issues.", "type": "Harmful"},
    "hydroquinone": {"risk": "High", "note": "Skin bleaching agent. Banned in many countries.", "type": "Harmful"},
    "mercury": {"risk": "Severe", "note": "Extremely toxic heavy metal.", "type": "Harmful"},
    "oxybenzone": {"risk": "High", "note": "Chemical sunscreen filter. Endocrine disruptor.", "type": "Harmful"},
    "triclosan": {"risk": "Medium", "note": "Antibacterial agent. Potential endocrine disruptor.", "type": "Harmful"},

    # --- IRRITANTS / ALLERGENS ---
    "sulfates": {"risk": "Medium", "note": "Aggressive surfactant. Strips skin of natural oils.", "type": "Irritant"},
    "sodium lauryl sulfate": {"risk": "Medium", "note": "Common foaming agent. Can cause dryness and irritation.", "type": "Irritant"},
    "sls": {"risk": "Medium", "note": "See Sodium Lauryl Sulfate.", "type": "Irritant"},
    "fragrance": {"risk": "High", "note": "Common allergen. Can cause contact dermatitis.", "type": "Irritant"},
    "parfum": {"risk": "High", "note": "French for fragrance. High allergy risk.", "type": "Irritant"},
    "alcohol denat": {"risk": "Medium", "note": "Drying alcohol. Disrupts skin barrier.", "type": "Irritant"},
    "denatured alcohol": {"risk": "Medium", "note": "Same as Alcohol Denat.", "type": "Irritant"},
    "essential oils": {"risk": "Medium", "note": "Contains volatile compounds that can sensitize skin.", "type": "Irritant"},
    "limonene": {"risk": "Low", "note": "Fragrance component. Can oxidize and irritate skin.", "type": "Irritant"},
    "linalool": {"risk": "Low", "note": "Common fragrance allergen.", "type": "Irritant"},

    # --- COMEDOGENIC (PORE CLOGGING) ---
    "silicones": {"risk": "Low", "note": "Creates a film on skin. Can trap oil and clog pores.", "type": "Comedogenic"},
    "dimethicone": {"risk": "Low", "note": "Most common silicone. Can be pore-clogging for some.", "type": "Comedogenic"},
    "coconut oil": {"risk": "High", "note": "Highly comedogenic. Avoid if you have acne-prone skin.", "type": "Comedogenic"},
    "isopropyl myristate": {"risk": "High", "note": "Strong solvent. Significant pore-clogging potential.", "type": "Comedogenic"},
    "petrolatum": {"risk": "Low", "note": "Petroleum jelly. Very occlusive, can trap bacteria.", "type": "Comedogenic"},
    "mineral oil": {"risk": "Low", "note": "Occlusive barrier. Safe but heavy for oily skin.", "type": "Comedogenic"},

    # --- BENEFICIAL / BOOSTERS ---
    "hyaluronic acid": {"risk": "None", "note": "Magnet for moisture. Holds 1000x its weight in water.", "type": "Beneficial"},
    "sodium hyaluronate": {"risk": "None", "note": "Salt form of Hyaluronic Acid. Better absorbed.", "type": "Beneficial"},
    "niacinamide": {"risk": "None", "note": "Vitamin B3. Pore refiner and brightness booster.", "type": "Beneficial"},
    "ceramides": {"risk": "None", "note": "Lipids that restore and protect the skin barrier.", "type": "Beneficial"},
    "ceramide np": {"risk": "None", "note": "Pure ceramide for barrier repair.", "type": "Beneficial"},
    "vitamin c": {"risk": "None", "note": "Powerful antioxidant. Brightens and prevents aging.", "type": "Beneficial"},
    "ascorbic acid": {"risk": "None", "note": "Pure Vitamin C. Highly effective but unstable.", "type": "Beneficial"},
    "ferulic acid": {"risk": "None", "note": "Boosts stability of Vitamin C and E.", "type": "Beneficial"},
    "panthenol": {"risk": "None", "note": "Pro-vitamin B5. Soothes and heals skin.", "type": "Beneficial"},
    "allantoin": {"risk": "None", "note": "Exceptional soothing and skin-softening agent.", "type": "Beneficial"},
    "green tea extract": {"risk": "None", "note": "Potent antioxidant and anti-inflammatory.", "type": "Beneficial"},
    "centella asiatica": {"risk": "None", "note": "Cica. Famous for healing and soothing redness.", "type": "Beneficial"},
    "glycerin": {"risk": "None", "note": "Classic humectant that keeps skin soft.", "type": "Beneficial"},
    "squalane": {"risk": "None", "note": "Lightweight olive/sugar-derived oil. Mimics skin lipids.", "type": "Beneficial"},

    # --- ACTIVES (POTENT BUT NEED CARE) ---
    "retinol": {"risk": "Medium", "note": "Anti-aging gold standard. Can cause initial peeling.", "type": "Active"},
    "retinyl palmitate": {"risk": "Low", "note": "Gentle version of Retinol.", "type": "Active"},
    "salicylic acid": {"risk": "Medium", "note": "BHA. Dissolves oil and fights acne deep in pores.", "type": "Active"},
    "glycolic acid": {"risk": "High", "note": "AHA. Powerful exfoliant. Increases sun sensitivity.", "type": "Active"},
    "lactic acid": {"risk": "Medium", "note": "Gentler AHA. Exfoliates while hydrating.", "type": "Active"},
    "azelaic acid": {"risk": "None", "note": "Fights acne and redness. Very gentle.", "type": "Active"},
    "benzoyl peroxide": {"risk": "Medium", "note": "Kills acne bacteria. Can bleach fabric and dry skin.", "type": "Active"},
    "bakuchiol": {"risk": "None", "note": "Plant-based alternative to Retinol. Very gentle and pregnancy safe.", "type": "Active"},
    "peptide": {"risk": "None", "note": "Protein building block. Firms and repairs skin.", "type": "Active"},
    "copper peptide": {"risk": "Low", "note": "Advanced repair peptide. Promotes healing and collagen.", "type": "Active"},
    "alpha arbutin": {"risk": "None", "note": "Safe alternative to Hydroquinone for spots.", "type": "Active"},
    "snail mucin": {"risk": "None", "note": "Deeply hydrating and soothing. Great for barrier repair.", "type": "Beneficial"},
    "snail secretion filtrate": {"risk": "None", "note": "Technically Snail Mucin. Powerful healer.", "type": "Beneficial"},
    "propolis": {"risk": "None", "note": "Honey bee resin. Strong antibacterial and soothing properties.", "type": "Beneficial"},
    "honey extract": {"risk": "None", "note": "Natural humectant and antibacterial agent.", "type": "Beneficial"},
    "resveratrol": {"risk": "None", "note": "Super-antioxidant from grapes. Fights aging.", "type": "Beneficial"},
    "idebenone": {"risk": "Low", "note": "Powerful antioxidant. Can be slightly irritating for some.", "type": "Active"},
    "phenoxyethanol": {"risk": "Low", "note": "Common preservative. Safe under 1% concentration.", "type": "Neutral"},
    "ethylhexylglycerin": {"risk": "None", "note": "Conditioning agent and preservative booster.", "type": "Neutral"},
    "polyethylene glycol": {"risk": "Low", "note": "PEG. Solvent and thickener. Generally safe.", "type": "Neutral"},
    "peg-100 stearate": {"risk": "Low", "note": "Emulsifier. Low risk but can be an irritant for sensitive skin.", "type": "Neutral"},
}

# Synonyms for better matching
SYNONYMS = {
    "water": "aqua",
    "aqua": "water",
    "bha": "salicylic acid",
    "aha": "glycolic acid",
    "v-c": "vitamin c",
    "b3": "niacinamide",
    "b5": "panthenol",
    "h-a": "hyaluronic acid",
    "sls": "sodium lauryl sulfate",
    "sles": "sodium laureth sulfate",
    "cica": "centella asiatica",
    "tea tree": "melaleuca alternifolia",
    "witch hazel": "hamamelis virginiana",
}
