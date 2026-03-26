"""
Test script for personalized tips generation
"""
import sys
import os
sys.path.append(os.path.abspath("."))

from app.ml.personalized_tips import generate_personalized_tips

# Test data
test_cases = [
    {
        "name": "Female with Oily Skin",
        "face_shape": "Oval",
        "gender": "Female",
        "skin_scores": {"acne": 0.6, "oiliness": 0.8, "texture": 0.3},
        "skin_tone": "Medium",
        "undertone": "warm",
        "eye_color": "Brown",
        "hair_color": "Black",
        "season": "Autumn"
    },
    {
        "name": "Male with Dry Skin",
        "face_shape": "Square",
        "gender": "Male",
        "skin_scores": {"acne": 0.1, "oiliness": 0.2, "texture": 0.7},
        "skin_tone": "Fair",
        "undertone": "cool",
        "eye_color": "Blue",
        "hair_color": "Blonde",
        "season": "Summer"
    }
]

print("🧪 Testing Personalized Tips Generation\n")
print("=" * 60)

for test in test_cases:
    print(f"\n📋 Test Case: {test['name']}")
    print(f"   Face Shape: {test['face_shape']}, Gender: {test['gender']}")
    print(f"   Skin: Acne={test['skin_scores']['acne']:.1f}, Oil={test['skin_scores']['oiliness']:.1f}, Texture={test['skin_scores']['texture']:.1f}")
    print(f"   Color: {test['skin_tone']} {test['undertone']}, {test['eye_color']} eyes, {test['hair_color']} hair")
    print(f"   Season: {test['season']}\n")
    
    tips = generate_personalized_tips(
        face_shape=test['face_shape'],
        gender=test['gender'],
        skin_scores=test['skin_scores'],
        skin_tone=test['skin_tone'],
        undertone=test['undertone'],
        eye_color=test['eye_color'],
        hair_color=test['hair_color'],
        season=test['season']
    )
    
    print(f"✨ Generated {len(tips)} tips:")
    for i, tip in enumerate(tips, 1):
        print(f"   {i}. {tip}")
    
    print("\n" + "-" * 60)

print("\n✅ Test Complete!")
