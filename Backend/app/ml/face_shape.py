# def infer_face_shape(landmarks):
#     # Landmark indexes are from MediaPipe FaceMesh
#     forehead_width = abs(landmarks[10].x - landmarks[338].x)
#     cheekbone_width = abs(landmarks[234].x - landmarks[454].x)
#     jaw_width = abs(landmarks[172].x - landmarks[397].x)
#     face_height = abs(landmarks[10].y - landmarks[152].y)

#     height_ratio = face_height / cheekbone_width

#     if height_ratio > 1.6:
#         return "Oval"
#     elif jaw_width > cheekbone_width * 0.95:
#         return "Square"
#     elif cheekbone_width > forehead_width * 1.1:
#         return "Diamond"
#     elif forehead_width > jaw_width * 1.1:
#         return "Heart"
#     else:
#         return "Round"
def predict_face_shape(face_img):
    # Simple heuristic (replace later)
    return "Triangle"

