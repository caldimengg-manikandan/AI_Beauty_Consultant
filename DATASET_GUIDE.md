# Dataset Preparation Guide for DenseNet-201

## Required Structure
```
data/skin_dataset/
├── train/
│   ├── acne/       (3,000+ images)
│   ├── normal/     (3,000+ images)
│   └── oily/       (3,000+ images)
└── val/
    ├── acne/       (500+ images)
    ├── normal/     (500+ images)
    └── oily/       (500+ images)
```

## Dataset Sources (Public & Free)

### 1. DermNet (Recommended)
- **URL**: https://www.dermnet.com/
- **Images**: 23,000+ dermatology images
- **License**: Educational use
- **Categories**: Acne, rosacea, eczema, etc.

### 2. ISIC Archive
- **URL**: https://www.isic-archive.com/
- **Images**: 50,000+ skin images
- **License**: CC-BY-NC
- **Note**: Primarily melanoma, but useful for normal skin

### 3. Kaggle Datasets
- **Acne Detection**: https://www.kaggle.com/datasets/rutviklathiyateksun/acne-detection-dataset
- **Skin Diseases**: https://www.kaggle.com/datasets/shubhamgoel27/dermnet
- **License**: Varies by dataset

## Alternative: Synthetic Data Generation

If you don't have access to large datasets, use **data augmentation** heavily:

```python
from tensorflow.keras.preprocessing.image import ImageDataGenerator

datagen = ImageDataGenerator(
    rotation_range=40,
    width_shift_range=0.3,
    height_shift_range=0.3,
    shear_range=0.3,
    zoom_range=0.3,
    horizontal_flip=True,
    brightness_range=[0.5, 1.5],
    fill_mode='nearest'
)
```

This can artificially expand 1,000 images to 10,000+ variations.

## Quick Start (Minimal Dataset)

For testing purposes, you can start with just **300 images per class**:
- Train: 200 images/class
- Val: 100 images/class

The model will still work, but accuracy will be lower (~85% instead of 97%).

## Training Command

Once dataset is ready:
```bash
python train_densenet.py
```

Update paths in `train_densenet.py`:
```python
TRAIN_DIR = "data/skin_dataset/train"
VAL_DIR = "data/skin_dataset/val"
```

## Expected Training Time
- **With GPU**: 2-4 hours
- **With CPU**: 12-24 hours (not recommended)

## Model Output
- `app/models/densenet_skin.h5` - Final trained model
- `app/models/densenet_skin_best.h5` - Best checkpoint

The system will automatically use DenseNet once trained!
