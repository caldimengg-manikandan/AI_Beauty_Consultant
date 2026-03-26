import cv2
import numpy as np

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

def detect_faces(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    return faces

def preprocess_for_cnn(image):
    """
    Preprocess image for CNN model input.
    Resizes to 224x224, converts to RGB, normalizes, and adds batch dimension.
    """
    # Resize to 224x224
    image = cv2.resize(image, (224, 224))

    # Convert BGR to RGB
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Normalize to [0, 1]
    image = image.astype(np.float32) / 255.0

    # Add batch dimension
    image = np.expand_dims(image, axis=0)

    return image
