# Foundation Shade Database (Industry Standard Shades)
# LAB values for accurate CIEDE2000 matching

FOUNDATION_SHADES = {
    "Fair": [
        {"name": "Porcelain", "lab": [92, 2, 10], "undertone": "Cool", "hex": "#F5E8DD"},
        {"name": "Ivory", "lab": [90, 3, 12], "undertone": "Neutral", "hex": "#F4E4D7"},
        {"name": "Warm Ivory", "lab": [88, 5, 15], "undertone": "Warm", "hex": "#F2DEC8"},
    ],
    "Light": [
        {"name": "Natural Beige", "lab": [80, 8, 18], "undertone": "Neutral", "hex": "#E8D4B8"},
        {"name": "Warm Beige", "lab": [78, 10, 22], "undertone": "Warm", "hex": "#E5CFAD"},
        {"name": "Cool Beige", "lab": [82, 6, 14], "undertone": "Cool", "hex": "#EBD8C0"},
    ],
    "Medium": [
        {"name": "Sand", "lab": [70, 12, 25], "undertone": "Neutral", "hex": "#D4B896"},
        {"name": "Golden", "lab": [68, 14, 28], "undertone": "Warm", "hex": "#D0B088"},
        {"name": "Honey", "lab": [72, 10, 22], "undertone": "Warm", "hex": "#D8BEA0"},
        {"name": "Tan", "lab": [65, 15, 26], "undertone": "Neutral", "hex": "#C8A882"},
    ],
    "Tan": [
        {"name": "Caramel", "lab": [58, 18, 28], "undertone": "Warm", "hex": "#B89570"},
        {"name": "Cocoa", "lab": [55, 20, 26], "undertone": "Neutral", "hex": "#B08868"},
        {"name": "Toffee", "lab": [60, 16, 30], "undertone": "Warm", "hex": "#BC9A78"},
    ],
    "Deep": [
        {"name": "Espresso", "lab": [45, 22, 24], "undertone": "Warm", "hex": "#8E6F50"},
        {"name": "Mahogany", "lab": [42, 24, 22], "undertone": "Cool", "hex": "#86654A"},
        {"name": "Ebony", "lab": [38, 20, 18], "undertone": "Neutral", "hex": "#7A5E45"},
    ],
    "Very Deep": [
        {"name": "Chocolate", "lab": [32, 18, 16], "undertone": "Warm", "hex": "#654D38"},
        {"name": "Mocha", "lab": [35, 16, 18], "undertone": "Neutral", "hex": "#6B533E"},
        {"name": "Midnight", "lab": [28, 14, 12], "undertone": "Cool", "hex": "#5A4530"},
    ]
}

def get_shade_category(lightness):
    """
    Determine shade category from LAB lightness value.
    """
    if lightness >= 85:
        return "Fair"
    elif lightness >= 75:
        return "Light"
    elif lightness >= 62:
        return "Medium"
    elif lightness >= 50:
        return "Tan"
    elif lightness >= 35:
        return "Deep"
    else:
        return "Very Deep"
