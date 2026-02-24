def generate_consultation(face_shape, skin_scores, gender="Female", image=None, landmarks=None,
                         skin_tone=None, undertone=None, eye_color=None, hair_color=None, 
                         season=None, hair_properties=None, weather_data=None):
    """
    Acts as a Beauty Consultant to generate personalized advice.
    Now includes comprehensive color analysis.
    Adapts based on Gender, Skin Tone, Eye Color, Hair Color, and Seasonal Palette.
    """
    acne = skin_scores.get('acne', 0)
    oiliness = skin_scores.get('oiliness', 0)
    texture = skin_scores.get('texture', 0) 

    # 1. Determine Skin Type
    skin_type = "Normal"
    if oiliness > 0.6 and texture < 0.4:
        skin_type = "Oily"
    elif oiliness < 0.4 and texture > 0.5:
        skin_type = "Dry"
    elif oiliness > 0.5 and texture > 0.4:
        skin_type = "Combination"
    else:
        skin_type = "Balanced"

    # 2. Build Routine
    routine = []
    
    # 2a. Gender-Specific Intro
    brand_voice = "Gentlemen's Care" if gender == "Male" else "Beauty Routine"
    
    # 2b. Cleansing
    if skin_type in ["Oily", "Combination"]:
        routine.append("🧴 **Cleanser**: Use a Gel or Foam cleanser with Salicylic Acid to control oil.")
    elif skin_type == "Dry":
        routine.append("🧴 **Cleanser**: Use a Cream-based hydrating cleanser.")
    else:
        routine.append("🧴 **Cleanser**: Use a gentle daily cleanser.")

    # 2c. Shaving (Male) vs Toning (Female)
    if gender == "Male":
        if acne > 0.1 or texture > 0.3:
            routine.append("🪒 **Shaving**: Use a sensitive shaving gel and change blades often to prevent irritation.")
    
    # 2d. Treatment
    if acne > 0.3:
        routine.append("🧪 **Treatment**: Apply Niacinamide (AM) and Spot Treatment (PM) for breakouts.")
    elif texture > 0.4:
        serum = "Lactic Acid" if gender == "Female" else "a gentle Exfoliant"
        routine.append(f"🧪 **Treatment**: Use Vitamin C (AM) and {serum} (PM) for smoothness.")
    elif oiliness > 0.5:
         routine.append("🧪 **Treatment**: Niacinamide Serum to regulate sebum.")

    # 2e. Moisturizer
    if skin_type == "Oily":
        routine.append("💧 **Moisturizer**: Lightweight, oil-free matte gel.")
    elif skin_type == "Dry":
        routine.append("💧 **Moisturizer**: Rich hydration cream.")
        if gender == "Male":
            routine.append("🧔 **Beard**: Apply beard oil to prevent skin dryness underneath.")
    else:
        routine.append("💧 **Moisturizer**: Daily hydrating lotion.")

    # 2f. Sunscreen
    routine.append("☀️ **SPF**: Daily Sunscreen is non-negotiable!")

    # 3. Salon & Spa Recommendations (Your Signature Menu)
    from app.ml.services_db import PARLOR_SERVICES
    
    # Determine primary issue
    primary_issue = "Oily" # Default
    if acne > 0.4: primary_issue = "Acne"
    elif texture > 0.4: primary_issue = "Texture" # Roughness/Scars
    elif oiliness > 0.6: primary_issue = "Oily"
    elif oiliness < 0.3 and texture > 0.3: primary_issue = "Dry"
    # Additional logic for Dullness/Aging could be added here
    
    # Fallback for "Normal" skin -> "Dull" (Glow treatments) or "Dry" (Hydration)
    if skin_type == "Balanced" and primary_issue == "Oily": 
         primary_issue = "Dull" 

    # Select Issue Category
    # Ensure keys match keys in services_db
    issue_key = primary_issue
    if issue_key not in ["Acne", "Oily", "Dry", "Dull", "Texture", "Aging"]:
        issue_key = "Dull" # Safe fallback

    services = PARLOR_SERVICES.get(gender, PARLOR_SERVICES["Female"]).get(issue_key, [])
    
    # Also fetch Combos if user has multiple intense issues?
    # For now, just append services.
    
    # Format Recommendations
    salon_recs = [f"💆 **Our Signature Care ({issue_key})**:"]
    for svc in services:
        salon_recs.append(f"- **{svc['name']}** ({svc['price']}): {svc['desc']}")

    # 4. COLOR ANALYSIS SECTION (NEW)
    color_analysis = []
    if skin_tone and eye_color and hair_color:
        color_analysis.append("\n🎨 **Color Analysis**:")
        color_analysis.append(f"- **Skin Tone**: {skin_tone} ({undertone} undertone)")
        color_analysis.append(f"- **Eye Color**: {eye_color}")
        color_analysis.append(f"- **Hair Color**: {hair_color}")
        
        if season:
            color_analysis.append(f"\n✨ **Your Season**: {season}")
            color_analysis.append(f"- Best colors for you: {palette if 'palette' in locals() else 'Warm, vibrant tones'}")
            
            # Makeup recommendations based on coloring
            if season == "Spring":
                color_analysis.append("- **Makeup**: Peachy blush, coral lips, golden eyeshadow")
            elif season == "Summer":
                color_analysis.append("- **Makeup**: Rose blush, berry lips, cool-toned eyeshadow")
            elif season == "Autumn":
                color_analysis.append("- **Makeup**: Terracotta blush, brick red lips, warm bronze eyeshadow")
            else:  # Winter
                color_analysis.append("- **Makeup**: Pink blush, bold red lips, jewel-toned eyeshadow")

    # 5. Final Compilation
    final_recs = [f"**Diagnosis ({gender})**: {skin_type} Skin"] + color_analysis + routine + salon_recs
    
    # 6. Styling / Grooming Tip + HAIRSTYLE RECS
    if face_shape:
        # Hairstyle Database
        from app.ml.services_db import HAIRSTYLES
        
        # Get styles
        styles = HAIRSTYLES.get(gender, HAIRSTYLES["Female"]).get(face_shape, [])
        style_str = ", ".join(styles) if styles else "Classic Styles"

        tip_icon = "🧔" if gender == "Male" else "💇‍♀️"
        topic = "Grooming" if gender == "Male" else "Hair"
        
        final_recs.append(f"{tip_icon} **Recommended Hairstyles**: Best cuts for your {face_shape} face are: {style_str}.")
        
        # Specific Tip
        if face_shape in ["Round", "Square"]:
             if gender == "Male":
                 final_recs.append(f"💡 **Style Tip**: A squared beard style adds structure to a {face_shape} face.")
             else:
                 final_recs.append(f"💡 **Style Tip**: Opt for styles that add height to elongate your {face_shape} features.")
        
        elif face_shape in ["Oval", "Diamond"]:
             if gender == "Male":
                 final_recs.append(f"💡 **Style Tip**: A clean shave or short stubble highlights your {face_shape} symmetry.")
             else:
                 final_recs.append(f"💡 **Style Tip**: Tuck hair behind ears to show off your {face_shape} cheekbones.")
        
        elif face_shape == "Heart":
             if gender == "Male":
                 final_recs.append(f"💡 **Style Tip**: A fuller beard at the chin balances a {face_shape} face.")
             else:
                 final_recs.append(f"💡 **Style Tip**: Avoid heavy bangs; try side-swept looks to balance {face_shape} width.")

    # 6.5 ADVANCED HAIR CONSULTATION (NEW)
    if hair_properties:
        final_recs.append("\n🔬 **Hair Morphology Report**:")
        density = hair_properties.get("density", "Normal")
        texture = hair_properties.get("texture", "Straight")
        recession_status = hair_properties.get("recession_status", "Optimal")
        curl_pattern = hair_properties.get("curl_pattern", "Unknown")
        
        final_recs.append(f"- **Density**: {density}")
        final_recs.append(f"- **Pattern**: {curl_pattern}")
        final_recs.append(f"- **Hairline**: {recession_status}")
        
        # Actionable Advice
        if "Recession" in recession_status:
            final_recs.append("💊 **Hair Care**: Consider Biotin supplements and caffeine-infused shampoos to stimulate follicles.")
        if "Coily" in curl_pattern or "Curly" in curl_pattern:
            final_recs.append("🧴 **Hair Care**: Use sulfate-free co-washes and leave-in creams to maintain moisture for your pattern.")
        elif "Fine" in density:
            final_recs.append("🧴 **Hair Care**: Use volumizing mouses and avoid heavy oils that weigh down fine hair.")

    # 6. FOUNDATION SHADE MATCHING (CIEDE2000)
    if image is not None and landmarks is not None:
        try:
            from app.ml.color_matching import extract_dominant_skin_color, rgb_to_lab, ciede2000, get_undertone
            from app.ml.foundation_db import FOUNDATION_SHADES, get_shade_category
            
            # Extract dominant skin color
            dominant_rgb = extract_dominant_skin_color(image, landmarks)
            dominant_lab = rgb_to_lab(dominant_rgb)
            undertone = get_undertone(dominant_rgb)
            
            # Get shade category
            category = get_shade_category(dominant_lab[0])
            
            # Find best match using CIEDE2000
            best_match = None
            min_distance = float('inf')
            
            for shade_cat, shades in FOUNDATION_SHADES.items():
                for shade in shades:
                    distance = ciede2000(dominant_lab, np.array(shade['lab']))
                    if distance < min_distance:
                        min_distance = distance
                        best_match = shade
            
            if best_match:
                final_recs.append(f"💄 **Foundation Match**: {best_match['name']} ({category} range, {undertone} undertone)")
                
        except Exception as e:
            print(f"⚠️ Foundation matching error: {e}")
            pass

    # 7. ENVIRONMENT INTELLIGENCE (NEW)
    if weather_data and weather_data.get("advice"):
        final_recs.append(f"\n🌍 **Environment Intelligence ({weather_data.get('city', 'Local')})**:")
        final_recs.append(f"- {weather_data['advice']}")

    return final_recs
