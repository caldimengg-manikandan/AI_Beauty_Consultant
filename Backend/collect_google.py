"""
Method 3: Google Images Downloader
Semi-automated browser tool for collecting images from Google
"""
import os
import time
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def setup_chrome_driver():
    """
    Setup Chrome driver for Selenium.
    """
    options = Options()
    options.add_argument('--start-maximized')
    options.add_argument('--disable-blink-features=AutomationControlled')
    
    try:
        driver = webdriver.Chrome(options=options)
        return driver
    except Exception as e:
        print("❌ Chrome driver not found!")
        print("\n📋 Install ChromeDriver:")
        print("1. Download: https://chromedriver.chromium.org/")
        print("2. Add to PATH or place in project folder")
        print("\nOr install via: pip install webdriver-manager")
        return None

def download_google_images(search_query, num_images=50, output_dir='google_images'):
    """
    Download images from Google Images.
    
    Args:
        search_query: Search term (e.g., 'acne face')
        num_images: Number of images to download
        output_dir: Output directory
    """
    driver = setup_chrome_driver()
    if not driver:
        return 0
    
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"🔍 Searching Google Images for '{search_query}'...")
    
    # Navigate to Google Images
    url = f"https://www.google.com/search?q={search_query}&tbm=isch"
    driver.get(url)
    time.sleep(2)
    
    # Scroll to load more images
    print("📜 Loading images...")
    for _ in range(5):
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(1)
    
    # Find image elements
    images = driver.find_elements(By.CSS_SELECTOR, "img.rg_i")
    print(f"Found {len(images)} images")
    
    downloaded = 0
    
    for idx, img in enumerate(images):
        if downloaded >= num_images:
            break
        
        try:
            # Click to get full-size image
            img.click()
            time.sleep(0.5)
            
            # Get actual image URL
            actual_images = driver.find_elements(By.CSS_SELECTOR, "img.n3VNCb")
            
            for actual_img in actual_images:
                img_url = actual_img.get_attribute('src')
                
                if img_url and img_url.startswith('http'):
                    try:
                        # Download image
                        img_data = requests.get(img_url, timeout=5).content
                        
                        filename = f"{search_query.replace(' ', '_')}_{downloaded}.jpg"
                        filepath = os.path.join(output_dir, filename)
                        
                        with open(filepath, 'wb') as f:
                            f.write(img_data)
                        
                        downloaded += 1
                        print(f"  Downloaded {downloaded}/{num_images}", end='\r')
                        break
                        
                    except Exception as e:
                        continue
            
        except Exception as e:
            continue
    
    driver.quit()
    print(f"\n✅ Downloaded {downloaded} images from Google")
    return downloaded

def collect_all_google_images():
    """
    Download images for all categories from Google.
    """
    searches = [
        {'query': 'acne face close up', 'category': 'acne', 'count': 50},
        {'query': 'normal skin face portrait', 'category': 'normal', 'count': 50},
        {'query': 'oily skin face shiny', 'category': 'oily', 'count': 50},
    ]
    
    print("🚀 Starting Google Images Collection\n")
    print("⚠️ Note: This uses browser automation and may be slow")
    print("Consider using Kaggle or Stock Photo methods for faster results\n")
    
    for search in searches:
        print(f"\n📂 Collecting {search['category']} images...")
        output_dir = f"google_images/{search['category']}"
        download_google_images(search['query'], search['count'], output_dir)
        time.sleep(3)  # Pause between searches
    
    print("\n✅ All Google images collected!")
    print("\n📋 Next steps:")
    print("1. Review images in google_images/")
    print("2. Delete any irrelevant/low-quality images")
    print("3. Copy to source_data/")
    print("4. Run: python generate_dataset.py")

def organize_google_images():
    """
    Move Google images to source_data structure.
    """
    print("🔧 Organizing Google images...")
    
    for category in ['acne', 'normal', 'oily']:
        source = f'google_images/{category}'
        dest = f'source_data/{category}'
        
        if os.path.exists(source):
            os.makedirs(dest, exist_ok=True)
            
            from pathlib import Path
            images = list(Path(source).glob('*.jpg'))
            
            import shutil
            for img in images:
                shutil.copy(img, dest)
            
            print(f"✅ Moved {len(images)} {category} images")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == 'organize':
        organize_google_images()
    else:
        collect_all_google_images()
