"""
Face Shape Dataset Augmentation Script
Augments preprocessed face images to create larger training dataset

Augmentation techniques (from research paper):
1. Rotation: -50° to +30°
2. Gaussian noise
3. Horizontal flip
4. Contrast adjustment (gamma=2)

Target: 5x augmentation (4000 → 20,000+ images)
"""

import os
import cv2
import numpy as np
import sys
from pathlib import Path
from tqdm import tqdm
import random

# Force UTF-8 encoding for Windows terminal
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Configuration
CROPPED_DIR = "datasets/face_shape_cropped"
AUGMENTED_DIR = "datasets/face_shape_augmented"
AUGMENTATION_FACTOR = 5  # Create 5 variants per image

# Face shape classes
CLASSES = ["Heart", "Oblong", "Oval", "Round", "Square"]

# Augmentation parameters
ROTATION_RANGE = (-50, 30)  # degrees
GAMMA_VALUE = 2.0
NOISE_SIGMA = 10


def rotate_image(image, angle):
    """
    Rotate image by given angle
    
    Args:
        image: Input image
        angle: Rotation angle in degrees
        
    Returns:
        Rotated image
    """
    h, w = image.shape[:2]
    center = (w // 2, h // 2)
    
    # Get rotation matrix
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    
    # Rotate image
    rotated = cv2.warpAffine(image, M, (w, h), 
                             borderMode=cv2.BORDER_REFLECT,
                             flags=cv2.INTER_LINEAR)
    
    return rotated


def add_gaussian_noise(image, sigma=10):
    """
    Add Gaussian noise to image
    
    Args:
        image: Input image
        sigma: Standard deviation of noise
        
    Returns:
        Noisy image
    """
    noise = np.random.normal(0, sigma, image.shape).astype(np.float32)
    noisy = image.astype(np.float32) + noise
    noisy = np.clip(noisy, 0, 255).astype(np.uint8)
    
    return noisy


def flip_horizontal(image):
    """
    Flip image horizontally
    
    Args:
        image: Input image
        
    Returns:
        Flipped image
    """
    return cv2.flip(image, 1)


def adjust_contrast(image, gamma=2.0):
    """
    Adjust image contrast using gamma correction
    
    Args:
        image: Input image
        gamma: Gamma value for correction
        
    Returns:
        Contrast-adjusted image
    """
    # Build lookup table
    inv_gamma = 1.0 / gamma
    table = np.array([((i / 255.0) ** inv_gamma) * 255 
                      for i in range(256)]).astype(np.uint8)
    
    # Apply gamma correction
    adjusted = cv2.LUT(image, table)
    
    return adjusted


def augment_image(image, variant_idx):
    """
    Apply augmentation to image based on variant index
    
    Args:
        image: Input image
        variant_idx: Variant number (0-4)
        
    Returns:
        Augmented image
    """
    if variant_idx == 0:
        # Original image
        return image.copy()
    
    elif variant_idx == 1:
        # Rotation only
        angle = random.uniform(*ROTATION_RANGE)
        return rotate_image(image, angle)
    
    elif variant_idx == 2:
        # Gaussian noise only
        return add_gaussian_noise(image, NOISE_SIGMA)
    
    elif variant_idx == 3:
        # Horizontal flip + rotation
        flipped = flip_horizontal(image)
        angle = random.uniform(*ROTATION_RANGE)
        return rotate_image(flipped, angle)
    
    elif variant_idx == 4:
        # Contrast adjustment + rotation
        contrasted = adjust_contrast(image, GAMMA_VALUE)
        angle = random.uniform(*ROTATION_RANGE)
        return rotate_image(contrasted, angle)
    
    else:
        # Combination: rotation + noise
        angle = random.uniform(*ROTATION_RANGE)
        rotated = rotate_image(image, angle)
        return add_gaussian_noise(rotated, NOISE_SIGMA // 2)


def augment_dataset():
    """Augment entire dataset"""
    print("\n🔄 Augmenting dataset...")
    
    # Create output directory
    os.makedirs(AUGMENTED_DIR, exist_ok=True)
    
    stats = {
        "total_original": 0,
        "total_augmented": 0,
        "per_class": {}
    }
    
    # Process each class
    for class_name in CLASSES:
        print(f"\n📂 Augmenting {class_name} faces...")
        
        # Input and output directories
        input_class_dir = Path(CROPPED_DIR) / class_name
        output_class_dir = Path(AUGMENTED_DIR) / class_name
        output_class_dir.mkdir(parents=True, exist_ok=True)
        
        if not input_class_dir.exists():
            print(f"⚠️  {class_name} directory not found, skipping...")
            continue
        
        # Get all images
        image_files = []
        for ext in ['*.jpg', '*.jpeg', '*.png']:
            image_files.extend(input_class_dir.glob(ext))
        
        stats["per_class"][class_name] = {
            "original": len(image_files),
            "augmented": 0
        }
        stats["total_original"] += len(image_files)
        
        # Process each image
        for img_path in tqdm(image_files, desc=f"{class_name}"):
            # Read image
            img = cv2.imread(str(img_path))
            if img is None:
                continue
            
            # Create augmented variants
            for variant_idx in range(AUGMENTATION_FACTOR):
                # Apply augmentation
                augmented = augment_image(img, variant_idx)
                
                # Generate output filename
                stem = img_path.stem
                output_name = f"{stem}_aug{variant_idx}{img_path.suffix}"
                output_path = output_class_dir / output_name
                
                # Save augmented image
                cv2.imwrite(str(output_path), augmented)
                stats["total_augmented"] += 1
                stats["per_class"][class_name]["augmented"] += 1
    
    # Print statistics
    print("\n" + "="*60)
    print("📊 AUGMENTATION STATISTICS")
    print("="*60)
    print(f"Original images: {stats['total_original']}")
    print(f"Augmented images: {stats['total_augmented']}")
    print(f"Augmentation factor: {stats['total_augmented'] / stats['total_original']:.1f}x")
    print("\nPer-class breakdown:")
    for class_name, class_stats in stats["per_class"].items():
        print(f"  {class_name:10s}: {class_stats['original']:4d} → {class_stats['augmented']:5d} images")
    print("="*60)
    
    return stats


def verify_augmented_dataset():
    """Verify augmented dataset"""
    print("\n🔍 Verifying augmented dataset...")
    
    total = 0
    for class_name in CLASSES:
        class_dir = Path(AUGMENTED_DIR) / class_name
        if class_dir.exists():
            count = len(list(class_dir.glob("*.jpg"))) + len(list(class_dir.glob("*.png")))
            total += count
            print(f"  {class_name:10s}: {count:5d} images")
        else:
            print(f"  {class_name:10s}: Directory not found!")
    
    print(f"\n  {'TOTAL':10s}: {total:5d} images")
    
    return total


def create_train_test_split():
    """Create train/test split info"""
    print("\n📋 Creating train/test split...")
    
    split_info = {
        "train": {},
        "test": {}
    }
    
    for class_name in CLASSES:
        class_dir = Path(AUGMENTED_DIR) / class_name
        if not class_dir.exists():
            continue
        
        # Get all images
        image_files = sorted(list(class_dir.glob("*.jpg")) + list(class_dir.glob("*.png")))
        
        # Split: 80% train, 20% test
        split_idx = int(len(image_files) * 0.8)
        
        split_info["train"][class_name] = len(image_files[:split_idx])
        split_info["test"][class_name] = len(image_files[split_idx:])
    
    print("\nTrain/Test split (80/20):")
    print(f"  {'Class':10s} {'Train':>6s} {'Test':>6s}")
    print("  " + "-"*24)
    
    total_train = 0
    total_test = 0
    
    for class_name in CLASSES:
        train_count = split_info["train"].get(class_name, 0)
        test_count = split_info["test"].get(class_name, 0)
        total_train += train_count
        total_test += test_count
        print(f"  {class_name:10s} {train_count:6d} {test_count:6d}")
    
    print("  " + "-"*24)
    print(f"  {'TOTAL':10s} {total_train:6d} {total_test:6d}")
    
    return split_info


if __name__ == "__main__":
    print("="*60)
    print("🎨 FACE SHAPE DATASET AUGMENTATION")
    print("="*60)
    
    # Check if preprocessed dataset exists
    if not Path(CROPPED_DIR).exists():
        print("❌ Preprocessed dataset not found!")
        print("Please run: python scripts/preprocess_dataset.py")
        exit(1)
    
    # Set random seed for reproducibility
    random.seed(42)
    np.random.seed(42)
    
    # Step 1: Augment dataset
    stats = augment_dataset()
    
    # Step 2: Verify dataset
    total_images = verify_augmented_dataset()
    
    # Step 3: Create split info
    split_info = create_train_test_split()
    
    print("\n✅ Augmentation complete!")
    print(f"📁 Augmented images saved to: {AUGMENTED_DIR}")
    print(f"📊 Total augmented images: {total_images}")
    print("\n📝 Next steps:")
    print("1. Review augmented images")
    print("2. Install training dependencies: pip install -r requirements_training.txt")
    print("3. Train model: python scripts/train_efficientnet.py")
