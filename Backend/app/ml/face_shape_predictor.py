try:
    import torch
    from torchvision import transforms
except ImportError:
    torch = None
    transforms = None

from PIL import Image
import os
import numpy as np

class FaceShapePredictor:
    def __init__(self, model_path=None):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu") if torch is not None else "cpu"
        
        if transforms is not None:
            self.transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ])
        else:
            self.transform = None
            
        self.classes = ["Diamond", "Heart", "Long", "Oval", "Pear", "Round", "Square", "Triangle"]
        
        if model_path is None:
            model_path = os.path.join(os.path.dirname(__file__), "../../models/face_shape_efficientnetv2s.pth")
        
        self.model_path = model_path
        self.model = self._load_model()

    def _load_model(self):
        if torch is None:
            print("⚠️ FaceShapeModel: torch not available")
            return None
            
        try:
            import torch.nn as nn
            from torchvision import models
            # Recreate the exact same architecture used in training
            model = models.efficientnet_v2_s(weights=None)
            num_ftrs = model.classifier[1].in_features
            model.classifier[1] = nn.Linear(num_ftrs, len(self.classes))
            
            if os.path.exists(self.model_path):
                # Using weights_only=True for security and compatibility
                state_dict = torch.load(self.model_path, map_location=self.device, weights_only=True)
                
                # Check if architecture matches (number of classes)
                if state_dict['classifier.1.weight'].shape[0] != len(self.classes):
                    print(f"⚠️ FaceShapeModel: Weight mismatch! Model has {state_dict['classifier.1.weight'].shape[0]} classes, but code expects {len(self.classes)}.")
                    print("Please retrain your model with the new classes.")
                    return None
                    
                model.load_state_dict(state_dict)
                model.to(self.device).eval()
                print(f"✅ FaceShapeModel: Loaded weights from {os.path.basename(self.model_path)}")
                return model
            else:
                print(f"⚠️ FaceShapeModel: Model file not found at {self.model_path}")
                return None
        except Exception as e:
            print(f"❌ FaceShapeModel: Error loading model: {e}")
            return None

    def predict(self, face_img):
        """
        Predicts face shape from a BGR image (OpenCV format)
        Returns: (label, confidence)
        """
        if self.model is None or self.transform is None or torch is None:
            return None, 0.0
            
        try:
            # Convert OpenCV (BGR) to PIL (RGB)
            import cv2
            rgb_img = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(rgb_img)
            
            # Preprocess
            input_tensor = self.transform(pil_img).unsqueeze(0).to(self.device)
            
            # Inferences
            with torch.no_grad():
                outputs = self.model(input_tensor)
                probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
                conf, index = torch.max(probabilities, 0)
                
            label = self.classes[index.item()]
            return label, conf.item()
        except Exception as e:
            print(f"⚠️ FaceShapeModel: Prediction error: {e}")
            return None, 0.0

# Singleton instance
_predictor = None

def get_face_shape_predictor():
    global _predictor
    if _predictor is None:
        _predictor = FaceShapePredictor()
    return _predictor
