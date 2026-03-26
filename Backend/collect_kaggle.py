"""
Method 1: Kaggle Dataset Downloader
Downloads public skin datasets from Kaggle
"""
import os
import subprocess
import zipfile
import shutil
import json
import kaggle
import sys
from pathlib import Path

# Force UTF-8 encoding for Windows terminal
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def setup_kaggle_api():
    """
    Setup Kaggle API credentials.
    
    Instructions:
    1. Go to https://www.kaggle.com/settings
    2. Click "Create New API Token"
    3. Download kaggle.json
    4. Place it in: C:/Users/<username>/.kaggle/kaggle.json
    """
    kaggle_dir = Path.home() / '.kaggle'
    kaggle_json = kaggle_dir / 'kaggle.json'
    
    if not kaggle_json.exists():
        print("❌ Kaggle API not configured!")
        print("\n📋 Setup Instructions:")
        print("1. Go to: https://www.kaggle.com/settings")
        print("2. Scroll to 'API' section")
        print("3. Click 'Create New API Token'")
        print("4. Save kaggle.json to:", kaggle_dir)
        print("\nThen run this script again.")
        return False
    
    print("✅ Kaggle API configured")
    return True

def download_kaggle_dataset(dataset_name, output_dir='kaggle_data'):
    """
    Download a Kaggle dataset.
    
    Args:
        dataset_name: Kaggle dataset identifier (e.g., 'rutviklathiyateksun/acne-detection-dataset')
        output_dir: Where to save downloaded data
    """
    try:
        print(f"📥 Downloading {dataset_name}...")
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        # Download using Kaggle API directly (fixes 'command not found' errors)
        try:
            from kaggle.api.kaggle_api_extended import KaggleApi
            api = KaggleApi()
            api.authenticate()
            api.dataset_download_files(dataset_name, path=output_dir, unzip=True)
            print(f"✅ Downloaded and extracted to {output_dir}")
            return True
        except Exception as api_error:
            print(f"❌ Kaggle API Error: {api_error}")
            return False
        
        print(f"✅ Downloaded to {output_dir}")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def download_all_skin_datasets():
    """
    Download all recommended skin datasets from Kaggle.
    """
    if not setup_kaggle_api():
        return
    
    datasets = [
        {
            'name': 'rutviklathiyateksun/acne-detection-dataset',
            'description': 'Acne Detection Dataset (1,000+ images)',
            'output': 'kaggle_data/acne_dataset'
        },
        {
            'name': 'shubhamgoel27/dermnet',
            'description': 'DermNet Skin Diseases (23,000+ images)',
            'output': 'kaggle_data/dermnet'
        },
        {
            'name': 'kmader/skin-cancer-mnist-ham10000',
            'description': 'HAM10000 Skin Lesions (10,000+ images)',
            'output': 'kaggle_data/ham10000'
        }
    ]
    
    print("🚀 Starting Kaggle Dataset Downloads\n")
    
    for dataset in datasets:
        print(f"\n📂 {dataset['description']}")
        download_kaggle_dataset(dataset['name'], dataset['output'])
    
    print("\n✅ All downloads complete!")
    print("\n📋 Next steps:")
    print("1. Review downloaded images in kaggle_data/")
    print("2. Copy relevant images to source_data/acne, source_data/normal, source_data/oily")
    print("3. Run: python generate_dataset.py")

def organize_kaggle_data():
    """
    Helper to organize downloaded Kaggle data into source_data structure.
    """
    print("🔧 Organizing Kaggle data...")
    
    # Create source directories
    for category in ['acne', 'normal', 'oily']:
        os.makedirs(f'source_data/{category}', exist_ok=True)
    
    # Move acne images
    acne_dir = Path('kaggle_data/acne_dataset')
    if acne_dir.exists():
        acne_images = list(acne_dir.rglob('*.jpg')) + list(acne_dir.rglob('*.png'))
        for i, img in enumerate(acne_images[:100]):  # Take first 100
            shutil.copy(img, f'source_data/acne/kaggle_acne_{i}.jpg')
        print(f"✅ Copied {min(100, len(acne_images))} acne images")
    
    # For normal/oily, you'll need to manually sort from dermnet
    print("⚠️ Please manually sort dermnet images into normal/oily categories")
    print("   Location: kaggle_data/dermnet/")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == 'organize':
        organize_kaggle_data()
    else:
        download_all_skin_datasets()
