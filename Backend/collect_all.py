"""
Master Data Collection Script
Runs all three collection methods and organizes results
"""
import os
import subprocess
import sys

def print_header(text):
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60 + "\n")

def run_collection_method(method_name, script_name):
    """Run a collection script."""
    print_header(f"Method: {method_name}")
    
    try:
        result = subprocess.run(
            [sys.executable, script_name],
            capture_output=False,
            text=True
        )
        return result.returncode == 0
    except Exception as e:
        print(f"❌ Error running {script_name}: {e}")
        return False

def organize_all_data():
    """Organize data from all sources into source_data/"""
    print_header("Organizing All Collected Data")
    
    # Run organize commands for each method
    scripts = [
        ('collect_kaggle.py', 'organize'),
        ('collect_stock.py', 'organize'),
        ('collect_google.py', 'organize')
    ]
    
    for script, arg in scripts:
        if os.path.exists(script):
            try:
                subprocess.run([sys.executable, script, arg])
            except:
                pass

def count_images(directory):
    """Count images in a directory."""
    if not os.path.exists(directory):
        return 0
    
    from pathlib import Path
    return len(list(Path(directory).glob('*.jpg'))) + len(list(Path(directory).glob('*.png')))

def show_summary():
    """Show collection summary."""
    print_header("Collection Summary")
    
    categories = ['acne', 'normal', 'oily']
    total = 0
    
    for category in categories:
        count = count_images(f'source_data/{category}')
        total += count
        status = "✅" if count >= 30 else "⚠️"
        print(f"{status} {category.capitalize()}: {count} images")
    
    print(f"\n📊 Total: {total} images")
    
    if total >= 90:
        print("\n✅ You have enough images to start training!")
        print("\n📋 Next steps:")
        print("1. Run: python generate_dataset.py")
        print("2. Run: python train_densenet.py")
    else:
        print(f"\n⚠️ Need {90-total} more images (30 minimum per category)")
        print("Run individual collection scripts to get more")

def main():
    """Main collection workflow."""
    print_header("AI Beauty Consultant - Dataset Collection")
    
    print("This script will run all three collection methods:\n")
    print("1. 📥 Kaggle Datasets (requires API key)")
    print("2. 📸 Stock Photos (Pexels/Unsplash - requires API keys)")
    print("3. 🔍 Google Images (browser automation)\n")
    
    choice = input("Run all methods? (y/n): ").lower()
    
    if choice != 'y':
        print("\nYou can run individual scripts:")
        print("- python collect_kaggle.py")
        print("- python collect_stock.py")
        print("- python collect_google.py")
        return
    
    # Method 1: Kaggle
    if os.path.exists('collect_kaggle.py'):
        run_collection_method("Kaggle Datasets", "collect_kaggle.py")
    
    # Method 2: Stock Photos
    if os.path.exists('collect_stock.py'):
        run_collection_method("Stock Photos", "collect_stock.py")
    
    # Method 3: Google Images
    if os.path.exists('collect_google.py'):
        use_google = input("\nRun Google Images scraper? (slower, y/n): ").lower()
        if use_google == 'y':
            run_collection_method("Google Images", "collect_google.py")
    
    # Organize everything
    organize_all_data()
    
    # Show summary
    show_summary()

if __name__ == "__main__":
    main()
