# Real-World Service Menu (Benchmarked from Naturals Salon)

# Real-World Service Menu (Benchmarked from Green Trends India)

# Rebranded Service Menu for Owner
PARLOR_SERVICES = {
    "Male": {
        "Acne": [
            {"name": "Herbal Face Cleanup", "price": "₹655", "desc": "Antiseptic treatment to clear active acne and impurities."},
            {"name": "Skin Lightening Cleanup", "price": "₹730", "desc": "Reduces marks and balances skin tone."}
        ],
        "Oily": [
            {"name": "Oil Control Clean-up", "price": "₹545", "desc": "Deep pore cleansing to remove excess sebum."},
            {"name": "Charcoal De-Tan", "price": "₹500", "desc": "Activated charcoal mask to absorb oil and pollution."}
        ],
        "Dry": [
            {"name": "Almond Indulgence Spa", "price": "₹585", "desc": "Nourishing facial massage with almond oil for hydration."},
            {"name": "Olive Bliss Masque", "price": "₹600", "desc": "Rich olive extracts to restore moisture to dry skin."}
        ],
        "Dull": [
            {"name": "Oxygen Facial", "price": "₹1,500", "desc": "Infuses pure oxygen for an instant, radiant glow."},
            {"name": "Global Gold Facial", "price": "₹3,000", "desc": "Premium radiance treatment for grooms and special events."}
        ],
        "Texture": [
            {"name": "Advanced Fruit Acid Peel", "price": "₹1,200", "desc": "Exfoliates dead skin cells to smooth rough texture."},
            {"name": "Crystal Microdermabrasion", "price": "₹2,500", "desc": "Resurfacing treatment for acne scars and uneven skin."}
        ],
        "Hair": [
            {"name": "Anti-Dandruff Treatment", "price": "₹1,210", "desc": "Clinical treatment to clear scalp buildup."},
            {"name": "L'Oreal Hair Spa", "price": "₹845", "desc": "Relaxing massage and mask for hair vitality."}
        ],
        "Combos": [
            {"name": "The Gentleman's Cut & Detox", "price": "₹999", "desc": "Haircut + Charcoal De-Tan + Beard Trim."},
            {"name": "Wedding Ready Groom", "price": "₹4,500", "desc": "Gold Facial + Manicure + Pedicure + Hair Spa."}
        ]
    },
    "Female": {
        "Acne": [
            {"name": "Herbal Face Cleanup", "price": "₹655", "desc": "Neem and Tulsi fast-acting cleanup for breakouts."},
            {"name": "Advanced Acne Repair", "price": "₹1,800", "desc": "Targeted clinical facial for persistent acne."}
        ],
        "Oily": [
            {"name": "Mattifying Clean-up", "price": "₹600", "desc": "Controls shine and tightens pores."},
            {"name": "Kagami Whitening Facial", "price": "₹2,500", "desc": "Japanese treatment for oil balance and brightness."}
        ],
        "Dry": [
            {"name": "Honey & Milk Hydration", "price": "₹1,600", "desc": "Classic hydration for soft, supple skin."},
            {"name": "Choco-Divine Facial", "price": "₹2,200", "desc": "Antioxidant-rich cocoa butter treatment for deep moisture."}
        ],
        "Aging": [
            {"name": "Collagen Boost Facial", "price": "₹3,500", "desc": "Firms sagging skin and reduces fine lines."},
            {"name": "24K Gold Facial", "price": "₹3,200", "desc": "Luxury anti-aging treatment for elasticity."}
        ],
        "Texture": [
            {"name": "Pearl Whitening Facial", "price": "₹2,200", "desc": "Polishes skin surface for a porcelain finish."},
            {"name": "Glow-Pro Peel", "price": "₹1,500", "desc": "Mild chemical peel to reveal fresh, smooth skin."}
        ],
        "Hair": [
            {"name": "Keratin Protect Treatment", "price": "₹1,720", "desc": "Smooths frizz and adds manageable shine."},
            {"name": "Moroccan Oil Spa", "price": "₹2,600", "desc": "Intense hydration for dry, damaged hair."}
        ],
        "Nails": [
            {"name": "Ice Cream Manicure", "price": "₹440", "desc": "Fun, flavored soak and scrub for soft hands."},
            {"name": "Paraffin Pedicure", "price": "₹795", "desc": "Deep heat treatment for cracked heels and dry feet."}
        ],
        "Combos": [
            {"name": "Total Radiance Package", "price": "₹2,999", "desc": "Pearl Facial + Hair Spa + Threading."},
            {"name": "Bridal Glow Essentials", "price": "₹5,500", "desc": "Gold Facial + Body Polishing + Premium Mani-Pedi."}
        ]
    }
}

# Hairstyle Database (Mapped to Face Shape)
HAIRSTYLES = {
    "Male": {
        "Oval": ["Classic Pompadour", "Quiff", "Faux Hawk"],
        "Round": ["High Fade with Volume", "Side Part", "Angular Fringe"],
        "Square": ["Buzz Cut", "Crew Cut", "Undercut"],
        "Diamond": ["Textured Crop", "Fringes", "Messy Waves"],
        "Heart": ["Side Swept Part", "Longer Lengths", "Beard with Volume"],
        "Long": ["Man Bun", "Side Part", "Classic Short Back & Sides"],
        "Pear": ["Textured Pompadour", "Side Part with Volume", "Taper Fade"],
        "Rectangle": ["Side Part", "Crew Cut with Side Volume", "Fringe"],
        "Triangle": ["High Fade with Thick Top", "Quiff", "Side Swept Part"]
    },
    "Female": {
        "Oval": ["Blunt Bob", "Long Waves", "Shoulder-Length Cut"],
        "Round": ["Long Layers", "Pixie Cut with Volume", "Side Swept Bangs"],
        "Square": ["Soft Curtain Bangs", "Long Straight Hair", "Textured Lob"],
        "Diamond": ["Chin-Length Bob", "Deep Side Part", "Pulled Back Ponytail"],
        "Heart": ["Bouncy Layers", "Side Part Pixie", "Lob with Volume"],
        "Long": ["Blowout Curls", "Bangs with Layers", "Chin-Length Bob"],
        "Pear": ["Side-swept Bangs", "Long Layers with Volume", "Shag Cut"],
        "Rectangle": ["Curtain Bangs", "Volume at Sides", "Rounded Bob"],
        "Triangle": ["Volume at Crown", "Layered Lob", "Side Swept Bangs"]
    }
}
