"""
Create a minimal working dataset without external downloads
Uses the existing system to generate synthetic training data
"""
import cv2
import numpy as np
import os

def create_synthetic_skin_image(skin_type, index):
    """
    Create a synthetic skin texture image for testing.
    """
    # Create 224x224 image
    img = np.zeros((224, 224, 3), dtype=np.uint8)
    
    if skin_type == 'acne':
        # Reddish base with spots
        img[:, :] = [180, 140, 130]  # Base skin tone
        # Add random red spots (acne)
        for _ in range(20):
            x, y = np.random.randint(50, 174, 2)
            cv2.circle(img, (x, y), np.random.randint(3, 8), (120, 80, 80), -1)
    
    elif skin_type == 'oily':
        # Shinier appearance
        img[:, :] = [200, 180, 160]
        # Add shine effect
        overlay = img.copy()
        cv2.ellipse(overlay, (112, 112), (80, 80), 0, 0, 360, (220, 210, 200), -1)
        img = cv2.addWeighted(img, 0.7, overlay, 0.3, 0)
    
    else:  # normal
        # Clean, even tone
        img[:, :] = [210, 190, 170]
    
    # Add some texture
    noise = np.random.randint(-10, 10, img.shape, dtype=np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    
    return img

def create_minimal_dataset():
    """
    Create a minimal dataset with synthetic images.
    This is just for testing - you should replace with real images later.
    """
    print("🎨 Creating minimal synthetic dataset for testing...")
    
    categories = ['acne', 'normal', 'oily']
    images_per_category = 30  # Minimum for testing
    
    for category in categories:
        output_dir = f'source_data/{category}'
        os.makedirs(output_dir, exist_ok=True)
        
        print(f"\n📂 Creating {category} images...")
        for i in range(images_per_category):
            img = create_synthetic_skin_image(category, i)
            filename = f'{output_dir}/synthetic_{i:03d}.jpg'
            cv2.imwrite(filename, img)
            print(f"  Created {i+1}/{images_per_category}", end='\r')
        
        print(f"\n✅ Created {images_per_category} {category} images")
    
    print("\n✅ Minimal dataset created!")
    print("\n⚠️ NOTE: These are synthetic test images.")
    print("For production, replace with real images from:")
    print("- Google Images (manual download)")
    print("- Your own photos")
    print("- Kaggle (if you set up API)")
    
    print("\n📋 Next steps:")
    print("1. Run: python generate_dataset.py")
    print("2. Run: python train_densenet.py")

if __name__ == "__main__":
    create_minimal_dataset()
