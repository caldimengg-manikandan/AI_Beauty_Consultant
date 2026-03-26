def generate_recommendations(face_shape, skin):
    recs = []

    # Skincare logic
    if skin["acne"] > 0.6:
        recs.append("Use salicylic acid or benzoyl peroxide cleanser")
        recs.append("Avoid heavy comedogenic products")

    if skin["pigmentation"] > 0.5:
        recs.append("Use Vitamin C serum and sunscreen SPF 50+")

    if skin["dryness"] > 0.6:
        recs.append("Use ceramide-based moisturizer")

    if skin["oiliness"] > 0.6:
        recs.append("Use gel-based, oil-free skincare")

    # Face shape logic
    if face_shape == "Round":
        recs.append("Contouring along jawline enhances face structure")
    elif face_shape == "Square":
        recs.append("Soft curls and rounded frames suit your face shape")
    elif face_shape == "Oval":
        recs.append("Most hairstyles suit oval face shape")
    elif face_shape == "Heart":
        recs.append("Balance forehead with chin-length hairstyles")
    elif face_shape == "Diamond":
        recs.append("Highlight cheekbones with soft layers")

    return recs
