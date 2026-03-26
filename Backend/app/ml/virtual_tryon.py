import cv2
import numpy as np
import math

def apply_lipstick(image, landmarks, color_bgr, intensity=0.7, finish="Satin"):
    try:
        h, w, _ = image.shape
        def get_pt(idx): return (int(landmarks[idx].x * w), int(landmarks[idx].y * h))
        outer_lip_indices = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185]
        inner_lip_indices = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191]
        mask = np.zeros_like(image)
        outer_pts = np.array([get_pt(i) for i in outer_lip_indices], np.int32)
        inner_pts = np.array([get_pt(i) for i in inner_lip_indices], np.int32)
        cv2.fillPoly(mask, [outer_pts], color_bgr)
        cv2.fillPoly(mask, [inner_pts], (0, 0, 0))
        mask_gray = cv2.cvtColor(mask, cv2.COLOR_BGR2GRAY)
        _, alpha_mask = cv2.threshold(mask_gray, 0, 255, cv2.THRESH_BINARY)
        alpha_mask = cv2.GaussianBlur(alpha_mask, (7, 7), 0) / 255.0
        alpha_mask = np.expand_dims(alpha_mask, axis=-1) * intensity
        if finish == "Glossy":
            original_gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            highlights = cv2.threshold(original_gray, 200, 255, cv2.THRESH_BINARY)[1]
            highlights = cv2.GaussianBlur(highlights, (15, 15), 0) / 255.0
            highlights = np.expand_dims(highlights, axis=-1)
            mask = cv2.addWeighted(mask, 1.0, (highlights * 255).astype(np.uint8), 0.4, 0)
        elif finish == "Matte":
            hsv = cv2.cvtColor(mask, cv2.COLOR_BGR2HSV)
            hsv[:,:,1] = hsv[:,:,1] * 0.8
            mask = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
        result = (image * (1 - alpha_mask) + mask * alpha_mask).astype(np.uint8)
        return result
    except: return image

def apply_eyeshadow(image, landmarks, color_bgr, intensity=0.4):
    try:
        h, w, _ = image.shape
        def get_pt(idx): return (int(landmarks[idx].x * w), int(landmarks[idx].y * h))
        left_eye_top = [226, 247, 30, 29, 27, 28, 56, 190, 243]
        right_eye_top = [463, 414, 286, 258, 257, 259, 260, 467, 446]
        mask = np.zeros_like(image)
        l_pts = np.array([get_pt(i) for i in left_eye_top], np.int32)
        r_pts = np.array([get_pt(i) for i in right_eye_top], np.int32)
        cv2.fillPoly(mask, [l_pts], color_bgr)
        cv2.fillPoly(mask, [r_pts], color_bgr)
        mask_gray = cv2.cvtColor(mask, cv2.COLOR_BGR2GRAY)
        _, alpha_mask = cv2.threshold(mask_gray, 0, 255, cv2.THRESH_BINARY)
        blur_k = int(w * 0.05) | 1
        alpha_mask = cv2.GaussianBlur(alpha_mask, (blur_k, blur_k), 0) / 255.0
        alpha_mask = np.expand_dims(alpha_mask, axis=-1) * intensity
        result = (image * (1 - alpha_mask) + mask * alpha_mask).astype(np.uint8)
        return result
    except: return image

def apply_blush(image, landmarks, color_bgr, intensity=0.3):
    try:
        h, w, _ = image.shape
        left_cheek = landmarks[205]
        right_cheek = landmarks[425]
        mask = np.zeros_like(image)
        lx, ly = int(left_cheek.x * w), int(left_cheek.y * h)
        cv2.circle(mask, (lx, ly), int(w * 0.05), color_bgr, -1)
        rx, ry = int(right_cheek.x * w), int(right_cheek.y * h)
        cv2.circle(mask, (rx, ry), int(w * 0.05), color_bgr, -1)
        mask_gray = cv2.cvtColor(mask, cv2.COLOR_BGR2GRAY)
        _, alpha_mask = cv2.threshold(mask_gray, 0, 255, cv2.THRESH_BINARY)
        blur_k = int(w * 0.1) | 1
        alpha_mask = cv2.GaussianBlur(alpha_mask, (blur_k, blur_k), 0) / 255.0
        alpha_mask = np.expand_dims(alpha_mask, axis=-1) * intensity
        result = (image * (1 - alpha_mask) + mask * alpha_mask).astype(np.uint8)
        return result
    except: return image

def apply_skin_smoothing(image, intensity=0.5):
    try:
        smooth = cv2.bilateralFilter(image, 9, 75, 75)
        result = cv2.addWeighted(image, 1 - intensity, smooth, intensity, 0)
        return result
    except: return image

def apply_hair_dye(image, landmarks, color_bgr, intensity=0.4):
    try:
        h, w, _ = image.shape
        top_head = landmarks[10]
        chin = landmarks[152]
        head_height = abs(chin.y - top_head.y) * h
        mask = np.zeros_like(image)
        top_y, mid_x = int(top_head.y * h), int(top_head.x * w)
        y1, y2 = max(0, int(top_y - head_height * 0.6)), int(top_y + head_height * 0.3)
        x1, x2 = max(0, int(mid_x - head_height * 0.8)), min(w, int(mid_x + head_height * 0.8))
        cv2.rectangle(mask, (x1, y1), (x2, y2), color_bgr, -1)
        face_indices = [10, 109, 67, 103, 54, 21, 162, 127, 234, 93, 132, 58, 172, 150, 149, 148, 152, 377, 378, 379, 397, 288, 361, 323, 454, 389, 251, 284, 332, 297, 338]
        face_pts = np.array([(int(landmarks[i].x * w), int(landmarks[i].y * h)) for i in face_indices], np.int32)
        cv2.fillPoly(mask, [face_pts], (0, 0, 0))
        mask_gray = cv2.cvtColor(mask, cv2.COLOR_BGR2GRAY)
        _, alpha_mask = cv2.threshold(mask_gray, 0, 255, cv2.THRESH_BINARY)
        blur_k = int(head_height * 0.4) | 1
        alpha_mask = cv2.GaussianBlur(alpha_mask, (blur_k, blur_k), 0) / 255.0
        alpha_mask = np.expand_dims(alpha_mask, axis=-1) * intensity
        result = (image * (1 - alpha_mask) + mask * alpha_mask).astype(np.uint8)
        return result
    except: return image

def apply_foundation(image, landmarks, color_bgr, intensity=0.5):
    try:
        h, w, _ = image.shape
        mask = np.zeros((h, w), dtype=np.uint8)
        face_indices = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10]
        face_pts = np.array([(int(landmarks[i].x * w), int(landmarks[i].y * h)) for i in face_indices], np.int32)
        cv2.fillPoly(mask, [face_pts], 255)
        exclusions = [
            [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
            [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
            [70, 63, 105, 66, 107, 55, 193], [300, 293, 334, 296, 336, 285, 417],
            [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185]
        ]
        for poly in exclusions:
            pts = np.array([(int(landmarks[i].x * w), int(landmarks[i].y * h)) for i in poly], np.int32)
            cv2.fillPoly(mask, [pts], 0)
        mask = cv2.GaussianBlur(mask, (31, 31), 0)
        alpha = np.expand_dims(mask / 255.0, axis=-1) * intensity
        foundation = np.full_like(image, color_bgr, dtype=np.uint8)
        result = (image * (1 - alpha) + foundation * alpha).astype(np.uint8)
        return cv2.bilateralFilter(result, 5, 50, 50)
    except: return image

def detect_intelligent_skin_tone(image, landmarks):
    try:
        h, w, _ = image.shape
        cheek_pts = [205, 425, 118, 347]
        colors = []
        for idx in cheek_pts:
            px, py = int(landmarks[idx].x * w), int(landmarks[idx].y * h)
            patch = image[py-5:py+5, px-5:px+5]
            if patch.size > 0: colors.append(np.mean(patch, axis=(0, 1)))
        if not colors: return {"hex": "#F5D0B5", "undertone": "Neutral"}
        avg_bgr = np.mean(colors, axis=0)
        lab = cv2.cvtColor(np.uint8([[avg_bgr]]), cv2.COLOR_BGR2LAB)[0][0]
        L, a, b_chan = lab
        ita = math.degrees(math.atan2((L - 50), b_chan))
        undertone = "Neutral"
        if a > b_chan * 1.2: undertone = "Cool"
        elif b_chan > a * 1.2: undertone = "Warm"
        h_val = "#{:02x}{:02x}{:02x}".format(int(avg_bgr[2]), int(avg_bgr[1]), int(avg_bgr[0]))
        return {"hex": h_val, "undertone": undertone, "ita": round(ita, 1), 
                "shade_category": "Very Fair" if ita > 55 else "Fair" if ita > 41 else "Intermediate" if ita > 28 else "Tan" if ita > 10 else "Deep"}
    except: return {"hex": "#F5D0B5", "undertone": "Neutral", "ita": 35.0}

def apply_pro_studio_lighting(image, intensity=0.2):
    try:
        h, w, _ = image.shape
        X, Y = np.meshgrid(np.linspace(-1, 1, w), np.linspace(-1, 1, h))
        dist = np.sqrt(X**2 + Y**2)
        light_mask = np.clip(1.0 - dist * 0.5, 0, 1)
        bright = image.astype(np.float32) * (1.0 + 0.2 * light_mask[:,:,np.newaxis])
        bright = np.clip(bright, 0, 255).astype(np.uint8)
        vignette_mask = np.clip(1.2 - dist * 0.3, 0.7, 1.0)
        vignette = (bright.astype(np.float32) * vignette_mask[:,:,np.newaxis]).astype(np.uint8)
        return cv2.addWeighted(image, 1 - intensity, vignette, intensity, 0)
    except: return image

def apply_virtual_background(image, landmarks, bg_type="Midnight"):
    if bg_type == "None" or not bg_type: return image
    try:
        h, w, _ = image.shape
        mask = np.zeros((h, w), dtype=np.uint8)
        face_pts = np.array([(int(landmarks[i].x * w), int(landmarks[i].y * h)) for i in range(468)], np.int32)
        top_head, chin = landmarks[10], landmarks[152]
        face_h = abs(chin.y - top_head.y) * h
        cv2.fillConvexPoly(mask, cv2.convexHull(face_pts), 255)
        cv2.ellipse(mask, (int(top_head.x * w), int(top_head.y * h)), (int(face_h * 0.5), int(face_h * 0.3)), 0, 0, 360, 255, -1)
        bottom_pts = face_pts[np.argsort(face_pts[:,1])[-20:]]
        cv2.rectangle(mask, (int(np.mean(bottom_pts[:,0]) - w*0.4), int(np.mean(bottom_pts[:,1]))), (int(np.mean(bottom_pts[:,0]) + w*0.4), h), 255, -1)
        mask = cv2.GaussianBlur(mask, (71, 71), 0)
        alpha = np.expand_dims(mask / 255.0, axis=-1)
        
        new_bg = np.zeros_like(image)
        if bg_type == "Midnight":
            X, Y = np.meshgrid(np.linspace(0, 1, w), np.linspace(0, 1, h))
            dist = np.sqrt((X-0.5)**2 + (Y-0.5)**2)
            grad = np.clip(1 - dist*1.2, 0, 1)[:,:,np.newaxis]
            new_bg = (grad * np.array([35, 25, 25]) + (1-grad) * np.array([12, 8, 8])).astype(np.uint8)
            image = cv2.addWeighted(image, 0.9, np.zeros_like(image), 0.1, -10) # Darken subject
        elif bg_type == "Atelier":
            X, Y = np.meshgrid(np.linspace(0, 1, w), np.linspace(0, 1, h))
            grad = (X * 0.1 + 0.9)[:,:,np.newaxis]
            new_bg = (grad * np.array([245, 248, 250])).astype(np.uint8)
            image = cv2.addWeighted(image, 1.05, np.zeros_like(image), 0, 10) # Brighten subject
        elif bg_type == "Cyber":
            new_bg[:] = (35, 15, 20)
            for pos, col in [((0.2, 0.2), (180, 50, 120)), ((0.8, 0.8), (120, 180, 50)), ((0.5, 0.1), (50, 80, 200))]:
                orb = np.zeros_like(image)
                cv2.circle(orb, (int(w*pos[0]), int(h*pos[1])), int(w*0.5), col, -1)
                new_bg = cv2.addWeighted(new_bg, 1, cv2.GaussianBlur(orb, (151, 151), 0), 0.4, 0)
            # Add neon rim light (simple version)
            image = cv2.addWeighted(image, 1.0, np.full_like(image, (60, 20, 40)), 0.1, 0)
            
        return (image * alpha + new_bg * (1 - alpha)).astype(np.uint8)
    except: return image
