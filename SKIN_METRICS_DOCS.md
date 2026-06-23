# AI Beauty Consultant: Skin Metrics Documentation

This document outlines exactly how the 8 diagnostic metrics are calculated under the hood in the `Backend/app/ml/analysis_cv.py` processing pipeline. 

The system uses a hybrid approach, combining a **Convolutional Neural Network (CNN)** for high-level pattern recognition and **Computer Vision (CV)** algorithms for precise, localized pixel-level geometry and color analysis.

---

### Step 1: Pre-Processing the Image
Before the image is analyzed, it goes through two critical "clean up" algorithms to make sure the lighting and camera quality don't ruin the results:
1. **Bilateral Filter:** The code applies `cv2.bilateralFilter()`. This acts like a smart blur that removes digital noise and grain from the camera while keeping sharp edges (like pores and wrinkles) perfectly intact.
2. **Retinex Lighting Correction:** The code applies a custom `apply_retinex()` algorithm. This fixes bad lighting (like standing in a dark room or harsh sunlight) by balancing the shadows and highlights so the skin tone looks natural to the computer.

### Step 2: Facial Mapping (Landmarks)
The AI uses a neural network to plot hundreds of coordinates (called landmarks) on your face. It uses these exact coordinates to draw "masks" (digital stencils) so it knows exactly where your cheeks, forehead, and nose are.
* **Cheek Mask:** Uses points like `123, 50, 205...` to map the left and right cheeks.
* **T-Zone Mask:** Uses points like `103, 104, 105...` to map the forehead and the bridge of the nose.

---

### Step 3: Calculating the 8 Core Metrics

#### 1. Acne
**Method:** Hybrid (CNN + K-Means Color Clustering)
* **Computer Vision (CV):** The algorithm masks the face to isolate just the cheek regions. It converts the image into the **LAB color space** (which isolates color from brightness). It then feeds the cheek pixels into a `cv2.kmeans` algorithm, asking it to split the pixels into exactly 2 groups: normal skin and red spots. It calculates the ratio of red pixels, ignoring a 10% baseline of natural blush. A sigmoid multiplier smooths the results to avoid false positives. `base_acne = (ratio - 0.1) * 2.5`
* **Deep Learning (CNN):** A DenseNet-201 model simultaneously predicts the probability of acne.
* **Result:** The final metric is a weighted blend of both the CNN and CV scores (e.g. 70/30 weighting depending on severity).

#### 2. Oiliness
**Method:** Hybrid (Regional Luminance Ratio + CNN)
* **Computer Vision (CV):** The image is converted into **HSV color space** to isolate the "Value" (brightness) channel. The algorithm compares the average brightness of the **T-Zone** (forehead and nose) against the average brightness of the **cheeks**. A higher T-Zone brightness relative to the cheeks indicates shininess/sebum presence. `oil_ratio = mean_tzone / mean_cheek`
* **Deep Learning (CNN):** The CNN provides a secondary "oily" classification score.
* **Result:** The system takes the maximum value between the calculated CV ratio and the CNN prediction.

#### 3. Texture
**Method:** Image Entropy Analysis
* **Computer Vision (CV):** The image is converted to grayscale, and the cheek regions are isolated. The system calculates the **Shannon Entropy** of the pixel intensities. 
* **Result:** Entropy measures the randomness or variation in an image. Highly varied pixels indicate roughness, bumps, or uneven skin surfaces. The mathematical entropy value is normalized into a 0-100% score (lower entropy = smoother texture). `texture_score = (entropy - 5.5) / 2.0`

#### 4. Hydration
**Method:** Reflectance / Regional Mean Brightness
* **Computer Vision (CV):** The system measures the mean pixel brightness of the isolated cheek regions in grayscale. 
* **Result:** Healthy, well-hydrated skin naturally reflects light more evenly, resulting in a subtle glow. The raw brightness value is scaled to generate a percentage score, capped realistically between 30% and 95%. `hydration_score = (brightness / 255.0) * 100`

#### 5. Evenness (Tone & Pigmentation)
**Method:** Standard Deviation of Pixel Intensities
* **Computer Vision (CV):** The system calculates the **Standard Deviation** of pixel intensities across the cheek regions.
* **Result:** Standard deviation measures how spread out the pixel colors are from the average. A high standard deviation means the skin has dark spots, shadows, or red patches. The score is inverted, meaning a *lower* standard deviation yields a *higher* evenness percentage. `evenness_score = 100 - (std_dev * 2.0)`

#### 6. Barrier Health
**Method:** Derived Composite Metric
* **Result:** The skin barrier prevents moisture loss and protects against irritants. This metric is a weighted combination of **Hydration (60%)** and **Evenness (40%)**. High hydration and lack of irritation (evenness) mathematically indicate a strong, intact skin barrier.

#### 7. Pores
**Method:** Derived Proxy Metric
* **Result:** Enlarged, visible pores drastically increase the micro-roughness of an image. Therefore, this metric is derived directly as a scaled proxy of the **Texture score (85% of Texture)**.

#### 8. Elasticity
**Method:** Derived Composite Metric
* **Result:** Plump, youthful, and elastic skin typically exhibits two properties: it retains water well, and it is tight/smooth. This metric is calculated as a balanced composite of **Hydration (50%)** and **Texture (50%)**.
