"""
AI-Powered Personalized Beauty Tips Generator
Generates unique, contextual tips for each user based on their complete analysis.
"""
import requests
import json
import os

def load_api_key():
    """Load OpenRouter API key from the environment.

    Previously this only read a local ".env" file on disk, which is empty on
    most hosting platforms (Render, Docker, Heroku, etc.) where the key is
    injected directly as a real environment variable rather than shipped as a
    file. python-dotenv (loaded once in app/main.py) already copies any
    .env-file values into os.environ at startup, so os.getenv() picks up the
    key either way -- from an injected env var OR from a local .env file --
    while the old code only ever worked for the latter.
    """
    key = os.getenv("OPENROUTER_API_KEY")
    if key:
        return key

    # Last-resort fallback for any environment where .env exists but wasn't
    # loaded into the process environment for some reason.
    try:
        with open(".env", "r") as f:
            for line in f:
                if line.startswith("OPENROUTER_API_KEY"):
                    return line.strip().split("=", 1)[1]
    except Exception:
        return None
    return None

def generate_personalized_tips(face_shape, gender, skin_scores, skin_tone=None, undertone=None, 
                               eye_color=None, hair_color=None, season=None, hair_properties=None):
    """
    Generate unique, personalized beauty tips using AI based on complete facial analysis.
    
    Args:
        face_shape: Detected face shape (Oval, Round, Square, etc.)
        gender: Male/Female
        skin_scores: Dict with acne, oiliness, texture scores (0-1)
        skin_tone: Detected skin tone
        undertone: Warm/Cool/Neutral
        eye_color: Detected eye color
        hair_color: Detected hair color
        season: Color season (Spring/Summer/Autumn/Winter)
    
    Returns:
        List of personalized tip strings
    """
    
    # Extract skin metrics
    acne = skin_scores.get('acne', 0)
    oiliness = skin_scores.get('oiliness', 0)
    texture = skin_scores.get('texture', 0)
    
    # Determine skin type
    skin_type = "Normal"
    if oiliness > 0.6 and texture < 0.4:
        skin_type = "Oily"
    elif oiliness < 0.4 and texture > 0.5:
        skin_type = "Dry"
    elif oiliness > 0.5 and texture > 0.4:
        skin_type = "Combination"
    else:
        skin_type = "Balanced"
    
    # Build comprehensive context for AI
    context = f"""
    **Client Profile:**
    - Gender: {gender}
    - Face Shape: {face_shape}
    - Skin Type: {skin_type}
    - Acne Level: {acne*100:.0f}% (0=clear, 100=severe)
    - Oiliness: {oiliness*100:.0f}% (0=dry, 100=very oily)
    - Texture/Roughness: {texture*100:.0f}% (0=smooth, 100=rough)
    """
    
    if hair_properties:
        context += f"""
    - Hair Density: {hair_properties.get('density')}
    - Hair Texture: {hair_properties.get('texture')}
    - Hairline Status: {hair_properties.get('recession_status')}
    - Curl Pattern: {hair_properties.get('curl_pattern')}
    """
    
    if skin_tone and eye_color and hair_color:
        context += f"""
    - Skin Tone: {skin_tone} ({undertone} undertone)
    - Eye Color: {eye_color}
    - Hair Color: {hair_color}
    - Color Season: {season}
    """
    
    # Create AI prompt
    system_prompt = """You are an elite beauty consultant with 20+ years of experience in skincare, makeup, and styling. 
    You provide personalized, actionable beauty tips based on scientific analysis.
    
    **Your Task:**
    Generate 5-7 unique, personalized beauty tips for this specific client. Each tip should be:
    1. Highly specific to their unique combination of features
    2. Actionable and practical
    3. Professional yet warm in tone
    4. Based on dermatological science and beauty expertise
    5. Include specific product types, techniques, or lifestyle advice
    
    **Format:**
    Return ONLY a JSON array of tip strings. Each tip should start with an emoji and be 1-2 sentences.
    Example: ["💧 Tip about hydration...", "✨ Tip about makeup..."]
    
    **Focus Areas:**
    - Skincare routine tailored to their skin type and concerns
    - Makeup techniques for their face shape and coloring
    - Hairstyle recommendations
    - Color palette suggestions
    - Lifestyle tips (diet, sleep, stress)
    - Professional treatments they might benefit from
    """
    
    user_prompt = f"""Based on this client's analysis, generate personalized beauty tips:
    
    {context}
    
    Make each tip unique and specific to THIS person's combination of features. Avoid generic advice.
    Return ONLY a valid JSON array of strings, nothing else."""
    
    # Try to get AI-generated tips
    api_key = load_api_key()
    if not api_key:
        print("⚠️ No API key found, using fallback tips")
        return generate_fallback_tips(face_shape, gender, skin_type, acne, oiliness, texture, season)
    
    # Models to try (prioritize faster, reliable ones)
    models_to_try = [
        "google/gemini-2.0-flash-exp:free",  # Ultra-fast, high quality
        "meta-llama/llama-3.1-8b-instruct:free", # Fast fallback
    ]
    
    for model in models_to_try:
        try:
            print(f"🤖 Generating personalized tips with {model}...")
            response = requests.post(
                url="https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.8,
                    "max_tokens": 300 # Reduced tokens for speed
                },
                timeout=4 # Reduced timeout to avoid hanging
            )
            
            if response.status_code == 401:
                print("⚠️ OpenRouter Auth Failed (401). Check your API Key. Breaking.")
                break
                
            if response.status_code == 200:
                data = response.json()
                if 'choices' in data and len(data['choices']) > 0:
                    ai_reply = data['choices'][0]['message']['content']
                    
                    # Parse JSON response
                    try:
                        # Try to extract JSON array from response
                        import re
                        json_match = re.search(r'\[.*\]', ai_reply, re.DOTALL)
                        if json_match:
                            tips = json.loads(json_match.group())
                            if isinstance(tips, list) and len(tips) > 0:
                                print(f"✅ Generated {len(tips)} personalized tips")
                                return tips
                    except json.JSONDecodeError:
                        print(f"⚠️ Failed to parse AI response as JSON")
                        continue
            
            print(f"⚠️ Model {model} failed ({response.status_code})")
            
        except Exception as e:
            print(f"⚠️ Error with {model}: {str(e)}")
            continue
    
    # If all AI attempts fail, use intelligent fallback
    print("⚠️ All AI models failed, using enhanced fallback")
    return generate_fallback_tips(face_shape, gender, skin_type, acne, oiliness, texture, season, hair_properties)


def generate_fallback_tips(face_shape, gender, skin_type, acne, oiliness, texture, season=None, hair_properties=None):
    """
    Generate personalized tips using rule-based logic when AI is unavailable.
    Still highly personalized based on the specific combination of features.
    """
    tips = []
    
    # Tip 1: Skin Type Specific
    if skin_type == "Oily":
        tips.append("💧 Your oily skin needs lightweight, oil-free products. Try a gel-based moisturizer with niacinamide to control sebum production without clogging pores.")
    elif skin_type == "Dry":
        tips.append("💧 Combat dryness with a ceramide-rich moisturizer and hyaluronic acid serum. Apply while skin is still damp to lock in maximum hydration.")
    elif skin_type == "Combination":
        tips.append("💧 Your combination skin benefits from multi-masking: use a clay mask on your T-zone and a hydrating mask on your cheeks weekly.")
    else:
        tips.append("💧 Maintain your balanced skin with a simple routine: gentle cleanser, vitamin C serum, and broad-spectrum SPF 30+ daily.")
    
    # Tip 2: Acne-specific
    if acne > 0.4:
        tips.append("🧪 For active breakouts, use a spot treatment with 2% salicylic acid at night. Avoid picking to prevent scarring and hyperpigmentation.")
    elif acne > 0.2:
        tips.append("🧪 Prevent future breakouts by incorporating a gentle BHA exfoliant 2-3x weekly and always removing makeup before bed.")
    
    # Tip 3: Texture-specific
    if texture > 0.5:
        tips.append("✨ Improve skin texture with gentle chemical exfoliation using AHAs (lactic or glycolic acid) 2x per week, followed by a soothing moisturizer.")
    elif texture > 0.3:
        tips.append("✨ Boost skin smoothness with a vitamin C serum in the morning and retinol at night (start with 2x per week if new to retinol).")
    
    # Tip 4: Face Shape Styling
    face_shape_tips = {
        "Oval": f"💇 Your {face_shape} face shape is versatile! {'Try a textured quiff or side part' if gender == 'Male' else 'Experiment with any hairstyle - center parts and sleek bobs look stunning on you'}.",
        "Round": f"💇 Elongate your {face_shape} face with {'angular cuts and vertical volume' if gender == 'Male' else 'long layers and side-swept bangs that create the illusion of length'}.",
        "Square": f"💇 Soften your strong {face_shape} jawline with {'textured, messy styles or a light stubble' if gender == 'Male' else 'soft waves, rounded layers, or side parts that add curves'}.",
        "Heart": f"💇 Balance your {face_shape} face by {'keeping fuller volume at the chin with a beard' if gender == 'Male' else 'adding width at the jawline with chin-length bobs or outward curls'}.",
        "Long": f"💇 Add width to your {face_shape} face with {'horizontal layers and side volume' if gender == 'Male' else 'blunt cuts, bangs, or waves at cheek level to create horizontal lines'}.",
        "Diamond": f"💇 Highlight your {face_shape} cheekbones with {'clean lines and short sides' if gender == 'Male' else 'styles that showcase your face, like updos or hair tucked behind ears'}."
    }
    if face_shape in face_shape_tips:
        tips.append(face_shape_tips[face_shape])
    
    # Tip 4.5: Advanced Hair Properties
    if hair_properties:
        if "Recession" in hair_properties.get('recession_status', ''):
            tips.append("🛡️ To manage your hairline, avoid high-tension styles and use a scalp massager to promote blood flow to the follicles.")
        if "Coily" in hair_properties.get('curl_pattern', ''):
            tips.append("🌀 Your coily hair pattern is prone to dryness. Using the 'LOC' method (Liquid-Oil-Cream) will help lock in vital moisture.")
        elif "Fine" in hair_properties.get('density', ''):
            tips.append("💇 For fine hair density, look for 'texturizing' sprays rather than gels to add body without over-saturating the hair.")
    
    # Tip 5: Color Season (if available)
    if season:
        season_tips = {
            "Spring": "🎨 Your Spring coloring shines in warm, bright colors. Wear peach, coral, and golden tones. For makeup, try peachy blush and warm bronze eyeshadow.",
            "Summer": "🎨 Your Summer coloring looks best in cool, soft hues. Choose rose, lavender, and soft blues. For makeup, opt for rose blush and cool-toned mauves.",
            "Autumn": "🎨 Your Autumn coloring glows in warm, rich earth tones. Embrace rust, olive, and terracotta. For makeup, try warm bronze and brick red shades.",
            "Winter": "🎨 Your Winter coloring pops in cool, bold colors. Wear jewel tones like emerald, sapphire, and ruby. For makeup, choose bold reds and cool pinks."
        }
        if season in season_tips:
            tips.append(season_tips[season])
    
    # Tip 6: Lifestyle tip
    lifestyle_tips = [
        "🌙 Quality sleep is your best beauty treatment! Aim for 7-9 hours and use a silk pillowcase to prevent sleep lines and hair breakage.",
        "🥗 Hydration starts from within. Drink 8 glasses of water daily and eat omega-3 rich foods (salmon, walnuts) for glowing skin.",
        "🧘 Stress shows on your skin. Practice 10 minutes of daily meditation or deep breathing to reduce cortisol and prevent stress-related breakouts."
    ]
    import random
    tips.append(random.choice(lifestyle_tips))
    
    # Tip 7: Professional treatment recommendation
    if acne > 0.5 or texture > 0.6:
        tips.append("💆 Consider professional treatments like chemical peels or microdermabrasion at our salon for faster results on skin concerns.")
    elif oiliness > 0.6:
        tips.append("💆 A professional deep-cleansing facial with extractions can help reset your skin and minimize enlarged pores.")
    else:
        tips.append("💆 Maintain your skin's health with monthly professional facials tailored to your skin type for optimal glow.")
    
    return tips
