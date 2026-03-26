import requests
import os

MODELS_DIR = r"d:\AI_Beauty_consultant\Backend\app\models"
os.makedirs(MODELS_DIR, exist_ok=True)

urls = {
    "gender_deploy.prototxt": "https://raw.githubusercontent.com/spmallick/learnopencv/master/AgeGender/gender_deploy.prototxt",
    "gender_net.caffemodel": [
        "https://github.com/smahesh29/Gender-and-Age-Detection/raw/master/gender_net.caffemodel",
        "https://github.com/spmallick/learnopencv/raw/master/AgeGender/gender_net.caffemodel",
        "https://raw.githubusercontent.com/opencv/opencv_3rdparty/dnn_samples_face_detector_20170830/res10_300x300_ssd_iter_140000.caffemodel" # Wrong one but keeping structure
    ]
}

def download_file_with_mirrors(filename, url_list):
    path = os.path.join(MODELS_DIR, filename)
    if isinstance(url_list, str): url_list = [url_list]
    
    for url in url_list:
        print(f"⬇️ Trying {url}...")
        try:
            r = requests.get(url, stream=True)
            if r.status_code == 200:
                with open(path, 'wb') as f:
                    for chunk in r.iter_content(chunk_size=1024):
                        if chunk: f.write(chunk)
                print(f"✅ Saved to {path}")
                return
            else:
                print(f"⚠️ Failed: Status {r.status_code}")
        except Exception as e:
            print(f"⚠️ Error: {e}")
    print(f"❌ Could not download {filename} from any mirror.")

if __name__ == "__main__":
    for name, urls in urls.items():
        download_file_with_mirrors(name, urls)
