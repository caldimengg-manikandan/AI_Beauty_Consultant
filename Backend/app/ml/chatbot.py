"""
Local Beauty Consultant Chatbot
Provides intelligent responses without external API dependencies
"""

import re
from datetime import datetime


class BeautyConsultantBot:
    """
    Rule-based chatbot for beauty consultation.
    Provides intelligent responses based on user context and keywords.
    """
    
    def __init__(self):
        self.greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"]
        self.thanks = ["thank", "thanks", "appreciate"]
        
    def generate_response(self, message, user_context=None):
        """
        Generate intelligent response based on message and user context.
        
        Args:
            message: User's message
            user_context: Dict with user's skin analysis data
        
        Returns:
            str: Bot's response
        """
        msg_lower = message.lower().strip()
        
        # Extract context
        gender = user_context.get("gender", "Female") if user_context else "Female"
        face_shape = user_context.get("face_shape", "Unknown") if user_context else "Unknown"
        skin_scores = user_context.get("skin_scores", {}) if user_context else {}
        skin_tone = user_context.get("skin_tone") if user_context else None
        eye_color = user_context.get("eye_color") if user_context else None
        
        # Acne level
        acne = skin_scores.get("acne", 0) * 100
        oiliness = skin_scores.get("oiliness", 0) * 100
        texture = skin_scores.get("texture", 0) * 100
        
        # 1. Greetings
        if any(greet in msg_lower for greet in self.greetings):
            return f"Hello! 👋 I'm your AI Beauty Consultant. I can help you with skincare routines, product recommendations, and beauty tips. What would you like to know?"
        
        # 2. Thanks
        if any(thank in msg_lower for thank in self.thanks):
            return "You're very welcome! 💕 Feel free to ask me anything else about your beauty routine!"
        
        # 3. Sunscreen / SPF
        if any(word in msg_lower for word in ["sunscreen", "spf", "sun protection", "sun damage"]):
            if skin_tone:
                return f"For your {skin_tone} skin tone, I recommend SPF 50+ broad-spectrum sunscreen daily. Apply 15 minutes before sun exposure and reapply every 2 hours. Look for mineral sunscreens with zinc oxide or titanium dioxide for sensitive skin. ☀️"
            return "SPF is crucial! Use SPF 50+ broad-spectrum sunscreen daily, even on cloudy days. Apply 15 minutes before going outside and reapply every 2 hours. This prevents premature aging and dark spots. ☀️"
        
        # 4. Food / Nutrition / Diet
        if any(word in msg_lower for word in ["food", "diet", "nutrition", "eat", "vitamin", "supplement"]):
            response = "**Foods for Healthy Skin** 🥗\n\n"
            
            # Customize based on skin issues
            if skin_scores:
                acne = skin_scores.get("acne", 0) * 100
                oiliness = skin_scores.get("oiliness", 0) * 100
                
                if acne > 30 or oiliness > 60:
                    response += "**For Acne-Prone/Oily Skin:**\n"
                    response += "• **Eat**: Omega-3 (salmon, walnuts), zinc (pumpkin seeds), green tea, berries\n"
                    response += "• **Avoid**: Sugar, dairy, fried foods, processed carbs\n"
                    response += "• **Drink**: 8+ glasses of water daily\n\n"
                else:
                    response += "**For Healthy Skin:**\n"
                    response += "• **Vitamin C**: Oranges, strawberries, bell peppers (collagen production)\n"
                    response += "• **Vitamin E**: Almonds, avocado, spinach (antioxidant)\n"
                    response += "• **Omega-3**: Fatty fish, chia seeds, flaxseed (anti-inflammatory)\n"
                    response += "• **Zinc**: Oysters, beef, lentils (healing)\n"
                    response += "• **Water**: 8-10 glasses daily (hydration)\n\n"
            
            response += "**General Tips:**\n"
            response += "• Limit sugar and processed foods\n"
            response += "• Eat colorful fruits and vegetables\n"
            response += "• Include healthy fats (avocado, nuts, olive oil)\n"
            response += "• Consider probiotics (yogurt, kimchi) for gut health\n"
            response += "• Green tea for antioxidants ☕"
            
            return response
        
        # 5. Acne / Breakouts
        if any(word in msg_lower for word in ["acne", "pimple", "breakout", "blemish", "spot"]):
            if acne > 30:
                return f"Based on your analysis, you have moderate acne concerns. I recommend:\n• Cleanser with Salicylic Acid (2%)\n• Niacinamide serum in the morning\n• Benzoyl Peroxide spot treatment at night\n• Oil-free moisturizer\n• Avoid touching your face! 🧴"
            return "For acne-prone skin, use a gentle salicylic acid cleanser, niacinamide serum, and oil-free moisturizer. Avoid heavy makeup and always remove it before bed. Consider seeing a dermatologist for persistent acne. 💊"
        
        # 5. Dry Skin / Hydration
        if any(word in msg_lower for word in ["dry", "dehydrat", "flaky", "moisture", "hydrat"]):
            return "For dry skin, focus on hydration! Use:\n• Cream-based cleanser (not foam)\n• Hyaluronic acid serum\n• Rich moisturizer with ceramides\n• Facial oil at night\n• Drink 8 glasses of water daily 💧"
        
        # 6. Oily Skin
        if any(word in msg_lower for word in ["oily", "greasy", "shine", "sebum"]):
            if oiliness > 60:
                return f"Your skin shows high oiliness ({oiliness:.0f}%). Use:\n• Gel or foam cleanser with salicylic acid\n• Lightweight, oil-free moisturizer\n• Niacinamide serum to control sebum\n• Clay mask 2x per week\n• Blotting papers during the day 🧴"
            return "For oily skin, use gel-based products, salicylic acid cleanser, and niacinamide serum. Don't skip moisturizer - use oil-free formulas. Clay masks help control excess oil. 🌿"
        
        # 7. Anti-Aging / Wrinkles
        if any(word in msg_lower for word in ["aging", "wrinkle", "fine line", "anti-aging", "retinol"]):
            return "For anti-aging, the gold standard is:\n• Retinol/Retinoid at night (start slow!)\n• Vitamin C serum in the morning\n• SPF 50+ daily (most important!)\n• Hyaluronic acid for plumpness\n• Eye cream for delicate areas ✨"
        
        # 8. Dark Spots / Hyperpigmentation
        if any(word in msg_lower for word in ["dark spot", "pigment", "discolor", "uneven tone"]):
            return "To fade dark spots:\n• Vitamin C serum (morning)\n• Niacinamide or Alpha Arbutin\n• Chemical exfoliant (AHA/BHA) 2-3x/week\n• SPF 50+ daily (prevents darkening)\n• Be patient - takes 6-12 weeks! 🌟"
        
        # 9. Routine / Regimen
        if any(word in msg_lower for word in ["routine", "regimen", "steps", "order", "morning", "night"]):
            return """Here's a basic routine:
            
**Morning:**
1. Cleanser
2. Toner (optional)
3. Serum (Vitamin C)
4. Moisturizer
5. SPF 50+

**Night:**
1. Cleanser (double cleanse if wearing makeup)
2. Toner
3. Treatment (Retinol/Niacinamide)
4. Moisturizer
5. Eye cream 🌙"""
        
        # 10. Product Recommendations
        if any(word in msg_lower for word in ["recommend", "suggest", "product", "brand"]):
            if "cleanser" in msg_lower:
                return "Great cleansers:\n• CeraVe Hydrating Cleanser (dry skin)\n• La Roche-Posay Effaclar (oily/acne)\n• Cetaphil Gentle (sensitive)\n• The Ordinary Squalane Cleanser (all types) 🧴"
            elif "serum" in msg_lower:
                return "Top serums:\n• The Ordinary Niacinamide 10% (oil control)\n• Skinceuticals C E Ferulic (Vitamin C)\n• The Inkey List Hyaluronic Acid (hydration)\n• Paula's Choice 2% BHA (exfoliation) 💧"
            else:
                return "I can recommend products for specific needs! Ask me about cleansers, serums, moisturizers, or treatments for your skin concern. 💄"
        
        # 11. Face Shape / Hairstyle
        if any(word in msg_lower for word in ["hairstyle", "haircut", "hair", "face shape"]):
            if face_shape and face_shape != "Unknown":
                styles = {
                    "Oval": "Lucky you! Oval faces suit almost any hairstyle. Try long layers, bobs, or even pixie cuts.",
                    "Round": "Add height and angles! Try long layers, side-swept bangs, or asymmetrical cuts.",
                    "Square": "Soften angles with waves, long layers, or side-parted styles. Avoid blunt cuts.",
                    "Heart": "Balance your face with chin-length bobs, side-swept bangs, or soft waves.",
                    "Long": "Add width with layers, waves, or curls. Avoid very long straight hair.",
                    "Diamond": "Highlight cheekbones with side-swept styles, soft waves, or chin-length cuts."
                }
                return f"You have a {face_shape} face shape! {styles.get(face_shape, 'Consult with a stylist for personalized recommendations.')} 💇‍♀️"
            return "Upload a photo for face shape analysis, and I'll suggest the perfect hairstyles for you! 💇‍♀️"
        
        # 12. Makeup
        if any(word in msg_lower for word in ["makeup", "foundation", "concealer", "blush", "lipstick"]):
            if skin_tone and eye_color:
                return f"For your {skin_tone} skin and {eye_color} eyes:\n• Foundation: Match your neck, not your face\n• Concealer: One shade lighter\n• Blush: Peachy tones for warm undertones, pink for cool\n• Lipstick: Experiment with your seasonal palette! 💄"
            return "For makeup tips, upload a photo so I can analyze your skin tone and coloring! I'll suggest the perfect shades for you. 💄"
        
        # 13. Booking / Appointment
        if any(word in msg_lower for word in ["book", "appointment", "schedule", "visit"]):
            return "I'd love to help you book! Please call our salon at (555) 123-4567 or visit our website to schedule your appointment. Our team will take great care of you! 📅"
        
        # 14. Services / Treatments
        if any(word in msg_lower for word in ["service", "treatment", "facial", "peel", "massage"]):
            return """Our popular services include:
• **Hydrating Facial** ($85) - Deep moisture boost
• **Acne Treatment** ($95) - Clear skin therapy
• **Anti-Aging Facial** ($120) - Reduce fine lines
• **Chemical Peel** ($150) - Brighten & resurface
• **Microdermabrasion** ($110) - Smooth texture

Ask me about any specific treatment! 💆‍♀️"""
        
        # 15. Price / Cost
        if any(word in msg_lower for word in ["price", "cost", "how much", "expensive"]):
            return "Our services range from $65-$200 depending on the treatment. Facials start at $85. Would you like to know about a specific service? 💰"
        
        # 16. Sensitive Skin
        if any(word in msg_lower for word in ["sensitive", "irritat", "redness", "react"]):
            return "For sensitive skin:\n• Use fragrance-free products\n• Patch test new products\n• Avoid harsh exfoliants\n• Choose gentle, hypoallergenic formulas\n• Look for soothing ingredients like centella, aloe 🌿"
        
        # 17. Eye Care
        if any(word in msg_lower for word in ["eye", "dark circle", "puffy", "under eye"]):
            return "For eye concerns:\n• **Dark circles**: Vitamin C or caffeine eye cream\n• **Puffiness**: Cold compress, jade roller\n• **Fine lines**: Retinol eye cream (gentle!)\n• Get 7-8 hours of sleep\n• Stay hydrated 👁️"
            
        # 18. Hair Care (Non-styling)
        if any(word in msg_lower for word in ["hair fall", "dandruff", "scalp", "shampoo", "conditioner"]):
            return "For hair & scalp health:\n• **Dandruff**: Ketoconazole or Zinc Pyrithione shampoo\n• **Hair fall**: Scalp massage, rosemary oil, biotin-rich diet\n• **Dry hair**: Deep conditioning mask weekly, avoid heat tools\n• Avoid washing with very hot water! 💇‍♂️"

        # 19. Nail Care
        if any(word in msg_lower for word in ["nail", "manicure", "pedicure", "cuticle"]):
            return "For healthy nails:\n• Keep them hydrated with cuticle oil\n• Avoid using nails as tools\n• Take Biotin supplements if brittle\n• Book a professional manicure for deep cleaning! 💅"
            
        # 20. Wedding / Special Event
        if any(word in msg_lower for word in ["wedding", "bride", "marriage", "party", "event"]):
            return "Getting ready for a big day? 💍 We recommend:\n• Start skin treatments 3-6 months early\n• Don't try new aggressive products 2 weeks before\n• Hydrating facial 2 days prior\n• Book a consultation for bridal hair and makeup! ✨"

        # 21. Men's Grooming / Shaving
        if any(word in msg_lower for word in ["shave", "beard", "razor", "aftershave", "grooming"]):
            return "Men's grooming tips:\n• Shave in the direction of hair growth\n• Use a sharp razor and shaving cream\n• Apply alcohol-free aftershave balm\n• Use beard oil for soft facial hair 🪒"
        
        # 18. General / Default Response
        if user_context and face_shape != "Unknown":
            return f"I see you have {face_shape} face shape and {gender.lower()} skin type. I can help with:\n• Skincare routines\n• Product recommendations\n• Hairstyle suggestions\n• Makeup tips\n• Treatment options\n\nWhat would you like to know? 💫"
        else:
            return "I'm here to help with all your beauty questions! Ask me about:\n• Skincare routines\n• Product recommendations\n• Acne, dry skin, aging concerns\n• Hairstyles and makeup\n• Our salon services\n\nOr upload a photo for personalized analysis! ✨"


def get_bot_response(message, user_context=None):
    """
    Main function to get chatbot response.
    
    Args:
        message: User's message
        user_context: Optional user analysis data
    
    Returns:
        str: Bot's response
    """
    bot = BeautyConsultantBot()
    return bot.generate_response(message, user_context)
