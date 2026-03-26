"""
Training Script for DenseNet-201 Skin Analysis
Includes data augmentation and callbacks for optimal performance
"""
import sys
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
from setup_densenet import create_densenet_model, unfreeze_and_finetune
import os

# Force UTF-8 encoding for Windows terminal
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Configuration
BATCH_SIZE = 32
EPOCHS_INITIAL = 20
EPOCHS_FINETUNE = 30
IMG_SIZE = (224, 224)

def create_data_generators(train_dir, val_dir):
    """
    Create data generators with augmentation.
    
    Directory structure should be:
    train_dir/
        acne/
        normal/
        oily/
    val_dir/
        acne/
        normal/
        oily/
    """
    # Training data augmentation (industry standard)
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True,
        zoom_range=0.15,
        brightness_range=[0.8, 1.2],
        fill_mode='nearest'
    )
    
    # Validation data (no augmentation)
    val_datagen = ImageDataGenerator(rescale=1./255)
    
    train_generator = train_datagen.flow_from_directory(
        train_dir,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        shuffle=True
    )
    
    val_generator = val_datagen.flow_from_directory(
        val_dir,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        shuffle=False
    )
    
    return train_generator, val_generator

def get_callbacks():
    """Create training callbacks"""
    return [
        # Save best model
        ModelCheckpoint(
            'app/models/densenet_skin_best.h5',
            monitor='val_accuracy',
            save_best_only=True,
            verbose=1
        ),
        # Early stopping
        EarlyStopping(
            monitor='val_loss',
            patience=5,
            restore_best_weights=True,
            verbose=1
        ),
        # Reduce learning rate on plateau
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=3,
            min_lr=1e-7,
            verbose=1
        )
    ]

def train_model(train_dir, val_dir):
    """
    Complete training pipeline.
    
    Args:
        train_dir: Path to training data directory
        val_dir: Path to validation data directory
    """
    print("🚀 Starting DenseNet-201 Training Pipeline\n")
    
    # Create data generators
    print("📂 Loading data...")
    train_gen, val_gen = create_data_generators(train_dir, val_dir)
    
    print(f"   Training samples: {train_gen.samples}")
    print(f"   Validation samples: {val_gen.samples}")
    print(f"   Classes: {train_gen.class_indices}\n")
    
    # Create model
    model = create_densenet_model(num_classes=len(train_gen.class_indices))
    
    # Phase 1: Train classification head
    print("\n📚 Phase 1: Training classification head...")
    history1 = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=EPOCHS_INITIAL,
        callbacks=get_callbacks(),
        verbose=1
    )
    
    # Phase 2: Fine-tune entire model
    print("\n🔥 Phase 2: Fine-tuning entire model...")
    model = unfreeze_and_finetune(model, learning_rate=0.0001)
    
    history2 = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=EPOCHS_FINETUNE,
        callbacks=get_callbacks(),
        verbose=1
    )
    
    # Save final model
    model.save('app/models/densenet_skin.h5')
    print("\n✅ Training complete! Model saved to app/models/densenet_skin.h5")
    
    # Print final metrics
    final_val_acc = history2.history['val_accuracy'][-1]
    print(f"\n📊 Final Validation Accuracy: {final_val_acc*100:.2f}%")
    
    return model, history1, history2

if __name__ == "__main__":
    # Example usage
    TRAIN_DIR = "data/skin_dataset/train"  # Update with your path
    VAL_DIR = "data/skin_dataset/val"      # Update with your path
    
    # Check if directories exist
    if not os.path.exists(TRAIN_DIR):
        print(f"❌ Training directory not found: {TRAIN_DIR}")
        print("\n📋 To use this script:")
        print("1. Organize your dataset into train/val folders")
        print("2. Each folder should have subfolders: acne/, normal/, oily/")
        print("3. Update TRAIN_DIR and VAL_DIR paths above")
        print("4. Run: python train_densenet.py")
    else:
        train_model(TRAIN_DIR, VAL_DIR)
