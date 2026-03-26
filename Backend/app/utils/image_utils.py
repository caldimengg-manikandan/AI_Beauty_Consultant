



# import cv2
# import numpy as np

# def read_image(file_bytes: bytes):
#     np_arr = np.frombuffer(file_bytes, np.uint8)
#     img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
#     return img



import cv2
import numpy as np

def read_image(bytes_data):
    img_arr = np.frombuffer(bytes_data, np.uint8)
    return cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
