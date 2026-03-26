"""
Method 2: Stock Photo Scraper
Downloads images from Pexels and Unsplash (free & legal)
"""
import requests
import os
import time
from pathlib import Path

# API Keys (Free tier - no credit card needed)
PEXELS_API_KEY = "YOUR_PEXELS_API_KEY"  # Get from: https://www.pexels.com/api/
UNSPLASH_ACCESS_KEY = "YOUR_UNSPLASH_KEY"  # Get from: https://unsplash.com/developers

def setup_api_keys():
    """
    Check if API keys are configured.
    """
    if PEXELS_API_KEY == "YOUR_PEXELS_API_KEY":
        print("⚠️ Pexels API key not configured")
        print("Get free key: https://www.pexels.com/api/")
        print("Update PEXELS_API_KEY in this file\n")
        return False
    
    if UNSPLASH_ACCESS_KEY == "YOUR_UNSPLASH_KEY":
        print("⚠️ Unsplash API key not configured")
        print("Get free key: https://unsplash.com/developers")
        print("Update UNSPLASH_ACCESS_KEY in this file\n")
        return False
    
    return True

def download_from_pexels(query, num_images=50, output_dir='stock_photos'):
    """
    Download images from Pexels.
    
    Args:
        query: Search term (e.g., 'acne face', 'oily skin')
        num_images: Number of images to download
        output_dir: Output directory
    """
    print(f"📸 Searching Pexels for '{query}'...")
    
    os.makedirs(output_dir, exist_ok=True)
    
    headers = {
        'Authorization': PEXELS_API_KEY
    }
    
    downloaded = 0
    page = 1
    
    while downloaded < num_images:
        # Search API
        url = f'https://api.pexels.com/v1/search?query={query}&per_page=80&page={page}'
        response = requests.get(url, headers=headers)
        
        if response.status_code != 200:
            print(f"❌ API Error: {response.status_code}")
            break
        
        data = response.json()
        photos = data.get('photos', [])
        
        if not photos:
            print("No more results")
            break
        
        for photo in photos:
            if downloaded >= num_images:
                break
            
            try:
                # Download medium size image
                img_url = photo['src']['medium']
                img_data = requests.get(img_url).content
                
                filename = f"{query.replace(' ', '_')}_{downloaded}.jpg"
                filepath = os.path.join(output_dir, filename)
                
                with open(filepath, 'wb') as f:
                    f.write(img_data)
                
                downloaded += 1
                print(f"  Downloaded {downloaded}/{num_images}", end='\r')
                
                time.sleep(0.5)  # Rate limiting
                
            except Exception as e:
                print(f"\n❌ Error downloading: {e}")
                continue
        
        page += 1
    
    print(f"\n✅ Downloaded {downloaded} images from Pexels")
    return downloaded

def download_from_unsplash(query, num_images=50, output_dir='stock_photos'):
    """
    Download images from Unsplash.
    
    Args:
        query: Search term
        num_images: Number of images
        output_dir: Output directory
    """
    print(f"📸 Searching Unsplash for '{query}'...")
    
    os.makedirs(output_dir, exist_ok=True)
    
    headers = {
        'Authorization': f'Client-ID {UNSPLASH_ACCESS_KEY}'
    }
    
    downloaded = 0
    page = 1
    
    while downloaded < num_images:
        url = f'https://api.unsplash.com/search/photos?query={query}&per_page=30&page={page}'
        response = requests.get(url, headers=headers)
        
        if response.status_code != 200:
            print(f"❌ API Error: {response.status_code}")
            break
        
        data = response.json()
        results = data.get('results', [])
        
        if not results:
            break
        
        for photo in results:
            if downloaded >= num_images:
                break
            
            try:
                img_url = photo['urls']['regular']
                img_data = requests.get(img_url).content
                
                filename = f"{query.replace(' ', '_')}_{downloaded}.jpg"
                filepath = os.path.join(output_dir, filename)
                
                with open(filepath, 'wb') as f:
                    f.write(img_data)
                
                downloaded += 1
                print(f"  Downloaded {downloaded}/{num_images}", end='\r')
                
                time.sleep(1)  # Rate limiting
                
            except Exception as e:
                print(f"\n❌ Error: {e}")
                continue
        
        page += 1
    
    print(f"\n✅ Downloaded {downloaded} images from Unsplash")
    return downloaded

def collect_all_stock_photos():
    """
    Download images for all categories from both sources.
    """
    if not setup_api_keys():
        print("\n📋 Quick Setup:")
        print("1. Get Pexels key: https://www.pexels.com/api/ (free, instant)")
        print("2. Get Unsplash key: https://unsplash.com/developers (free, instant)")
        print("3. Update API keys in collect_stock.py")
        print("4. Run this script again")
        return
    
    searches = [
        {'query': 'acne face close up', 'category': 'acne', 'count': 50},
        {'query': 'normal skin face', 'category': 'normal', 'count': 50},
        {'query': 'oily skin face', 'category': 'oily', 'count': 50},
    ]
    
    print("🚀 Starting Stock Photo Collection\n")
    
    for search in searches:
        print(f"\n📂 Collecting {search['category']} images...")
        
        output_dir = f"stock_photos/{search['category']}"
        
        # Download from both sources
        download_from_pexels(search['query'], search['count']//2, output_dir)
        download_from_unsplash(search['query'], search['count']//2, output_dir)
    
    print("\n✅ All stock photos collected!")
    print("\n📋 Next steps:")
    print("1. Review images in stock_photos/")
    print("2. Copy to source_data/ (or run organize script)")
    print("3. Run: python generate_dataset.py")

def organize_stock_photos():
    """
    Move stock photos to source_data structure.
    """
    print("🔧 Organizing stock photos...")
    
    for category in ['acne', 'normal', 'oily']:
        source = f'stock_photos/{category}'
        dest = f'source_data/{category}'
        
        if os.path.exists(source):
            os.makedirs(dest, exist_ok=True)
            
            images = list(Path(source).glob('*.jpg'))
            for img in images:
                shutil.copy(img, dest)
            
            print(f"✅ Moved {len(images)} {category} images")

if __name__ == "__main__":
    import sys
    import shutil
    
    if len(sys.argv) > 1 and sys.argv[1] == 'organize':
        organize_stock_photos()
    else:
        collect_all_stock_photos()
