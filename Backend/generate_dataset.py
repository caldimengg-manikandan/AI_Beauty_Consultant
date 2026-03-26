"""
Synthetic Dataset Generator
Creates augmented training data from minimal source images
Expands 300 images -> 3,000+ variations
"""
import os
import cv2
import numpy as np
import random
import sys
from pathlib import Path
from tensorflow.keras.preprocessing.image import ImageDataGenerator, img_to_array, load_img
from tqdm import tqdm

# Force UTF-8 encoding for Windows terminal
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def create_augmented_dataset(source_dir, output_dir, augmentations_per_image=10):
    """
    Generate augmented dataset from source images.
    
    Args:
        source_dir: Directory with original images (e.g., 'source_data/acne')
        output_dir: Where to save augmented images (e.g., 'data/skin_dataset/train/acne')
        augmentations_per_image: Number of variations per source image
    """
    # Heavy augmentation for maximum diversity
    datagen = ImageDataGenerator(
        rotation_range=20,
        width_shift_range=0.1,
        height_shift_range=0.1,
        shear_range=0.1,
        zoom_range=0.1,
        horizontal_flip=True,
        brightness_range=[0.8, 1.2],
        fill_mode='nearest'
    )
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Get all images
    image_files = [f for f in os.listdir(source_dir) 
                   if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    
    print(f"📸 Found {len(image_files)} source images in {source_dir}")
    print(f"🔄 Generating {augmentations_per_image} variations each...")
    
    total_generated = 0
    
    for img_file in tqdm(image_files, desc="Augmenting"):
        img_path = os.path.join(source_dir, img_file)
        
        # Load image
        img = load_img(img_path, target_size=(224, 224))
        x = img_to_array(img)
        x = x.reshape((1,) + x.shape)
        
        # Save original
        base_name = os.path.splitext(img_file)[0]
        cv2.imwrite(
            os.path.join(output_dir, f"{base_name}_original.jpg"),
            cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        )
        total_generated += 1
        
        # Generate augmentations
        i = 0
        for batch in datagen.flow(x, batch_size=1):
            aug_img = batch[0].astype('uint8')
            cv2.imwrite(
                os.path.join(output_dir, f"{base_name}_aug_{i}.jpg"),
                cv2.cvtColor(aug_img, cv2.COLOR_RGB2BGR)
            )
            total_generated += 1
            i += 1
            if i >= augmentations_per_image:
                break
    
    print(f"✅ Generated {total_generated} images in {output_dir}")
    return total_generated

def setup_minimal_dataset():
    """
    Setup complete dataset structure from minimal source images.
    
    Expected source structure:
    source_data/
        acne/       (30-100 images)
        normal/     (30-100 images)
        oily/       (30-100 images)
    
    Creates:
    data/skin_dataset/
        train/
            acne/   (200+ images)
            normal/ (200+ images)
            oily/   (200+ images)
        val/
            acne/   (50+ images)
            normal/ (50+ images)
            oily/   (50+ images)
    """
    categories = ['acne', 'normal', 'oily']
    
    print("🚀 Starting Minimal Dataset Setup\n")
    
    # Check source directory
    if not os.path.exists('source_data'):
        print("❌ 'source_data' directory not found!")
        print("\n📋 Please create:")
        print("source_data/")
        print("  ├── acne/    (add 30-100 acne images)")
        print("  ├── normal/  (add 30-100 normal skin images)")
        print("  └── oily/    (add 30-100 oily skin images)")
        print("\nYou can collect these from:")
        print("- Google Images (search 'acne face', 'normal skin', 'oily skin')")
        print("- Your own photos")
        print("- Free stock photo sites (Pexels, Unsplash)")
        return False
    
    for category in categories:
        source_cat = f'source_data/{category}'
        
        if not os.path.exists(source_cat):
            print(f"⚠️ Missing: {source_cat}")
            continue
        
        # Count source images
        source_count = len([f for f in os.listdir(source_cat) 
                           if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
        
        if source_count < 20:
            print(f"⚠️ {category}: Only {source_count} images (need 20+ minimum)")
            continue
        
        print(f"\n📂 Processing {category} ({source_count} source images)")
        
        # Generate training set (10 augmentations per image)
        train_dir = f'data/skin_dataset/train/{category}'
        train_count = create_augmented_dataset(source_cat, train_dir, augmentations_per_image=10)
        
        # Generate validation set (2 augmentations per image)
        val_dir = f'data/skin_dataset/val/{category}'
        val_count = create_augmented_dataset(source_cat, val_dir, augmentations_per_image=2)
        
        print(f"   Train: {train_count} images")
        print(f"   Val: {val_count} images")
    
    print("\n✅ Dataset generation complete!")
    print("\n📊 Next steps:")
    print("1. Run: python train_densenet.py")
    print("2. Wait 2-4 hours (GPU) or 12-24 hours (CPU)")
    print("3. Model will auto-deploy to your system!")
    
    return True

if __name__ == "__main__":
    setup_minimal_dataset()
