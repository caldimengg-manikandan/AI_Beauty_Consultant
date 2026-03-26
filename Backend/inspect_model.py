import os
import tensorflow as tf
from tensorflow.keras.models import load_model

MODEL_PATH = r"d:\AI_Beauty_consultant\Backend\app\models\skin_cnn.h5"

def inspect_model():
    if not os.path.exists(MODEL_PATH):
        print(f"❌ Model not found at {MODEL_PATH}")
        return

    try:
        model = load_model(MODEL_PATH)
        print("✅ Model Loaded Successfully!")
        model.summary()
        
        print("\n--- Input Info ---")
        print(model.input_shape)
        
        print("\n--- Output Info ---")
        print(model.output_shape)
        
    except Exception as e:
        print(f"❌ Failed to load model: {e}")

if __name__ == "__main__":
    inspect_model()
