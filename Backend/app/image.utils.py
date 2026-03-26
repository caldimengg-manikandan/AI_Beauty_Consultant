# import numpy as np
# import cv2

# def read_image(upload_file):
#     contents = upload_file.file.read()
#     np_img = np.frombuffer(contents, np.uint8)
#     img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

#     if img is None:
#         raise ValueError("Invalid image")

#     # Convert BGR → RGB (VERY IMPORTANT)
#     img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
#     return img

import cv2
import numpy as np

def read_image(file_bytes: bytes):
    np_arr = np.frombuffer(file_bytes, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return image
