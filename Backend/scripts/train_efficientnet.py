"""
EfficientNetV2S Face Shape Classification Training Script
Trains model using transfer learning on augmented face shape dataset

Based on research paper achieving 96.32% accuracy:
- Model: EfficientNetV2S (pretrained on ImageNet)
- Dataset: Augmented face shapes (5 classes)
- Training: 500 epochs, batch size 16, Adam optimizer
"""

import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Reduce TF warnings

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import EfficientNetV2S
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path
import json
from datetime import datetime

# Configuration
DATASET_DIR = "datasets/face_shape_augmented"
MODEL_DIR = "models"
IMAGE_SIZE = 150
BATCH_SIZE = 16
EPOCHS = 500
LEARNING_RATE = 0.0001
NUM_CLASSES = 5

# Class names
CLASS_NAMES = ["Heart", "Oblong", "Oval", "Round", "Square"]

# Create model directory
os.makedirs(MODEL_DIR, exist_ok=True)


def create_data_generators():
    """Create train and validation data generators"""
    print("📊 Creating data generators...")
    
    # Training data generator (no augmentation - already augmented)
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2  # 80% train, 20% validation
    )
    
    # Training generator
    train_generator = train_datagen.flow_from_directory(
        DATASET_DIR,
        target_size=(IMAGE_SIZE, IMAGE_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='training',
        shuffle=True,
        seed=42
    )
    
    # Validation generator
    validation_generator = train_datagen.flow_from_directory(
        DATASET_DIR,
        target_size=(IMAGE_SIZE, IMAGE_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='validation',
        shuffle=False,
        seed=42
    )
    
    print(f"✅ Training samples: {train_generator.samples}")
    print(f"✅ Validation samples: {validation_generator.samples}")
    print(f"✅ Classes: {train_generator.class_indices}")
    
    return train_generator, validation_generator


def build_model():
    """Build EfficientNetV2S model with transfer learning"""
    print("\n🏗️  Building EfficientNetV2S model...")
    
    # Load pretrained EfficientNetV2S (ImageNet weights)
    base_model = EfficientNetV2S(
        include_top=False,
        weights='imagenet',
        input_shape=(IMAGE_SIZE, IMAGE_SIZE, 3)
    )
    
    # Freeze base model layers
    base_model.trainable = False
    
    # Build model
    inputs = keras.Input(shape=(IMAGE_SIZE, IMAGE_SIZE, 3))
    
    # Preprocessing (EfficientNet expects values in [0, 255])
    x = inputs * 255.0
    
    # Base model
    x = base_model(x, training=False)
    
    # Classification head
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(1280, activation='relu', name='fc1')(x)
    outputs = layers.Dense(NUM_CLASSES, activation='softmax', name='predictions')(x)
    
    model = keras.Model(inputs, outputs, name='EfficientNetV2S_FaceShape')
    
    # Compile model
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=LEARNING_RATE),
        loss='categorical_crossentropy',
        metrics=['accuracy', 
                 keras.metrics.Precision(name='precision'),
                 keras.metrics.Recall(name='recall')]
    )
    
    print(f"✅ Model built successfully!")
    print(f"   Total parameters: {model.count_params():,}")
    print(f"   Trainable parameters: {sum([tf.size(w).numpy() for w in model.trainable_weights]):,}")
    
    return model


def create_callbacks():
    """Create training callbacks"""
    print("\n⚙️  Setting up callbacks...")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    callbacks = [
        # Save best model
        keras.callbacks.ModelCheckpoint(
            filepath=f"{MODEL_DIR}/face_shape_efficientnet_best.h5",
            monitor='val_accuracy',
            save_best_only=True,
            mode='max',
            verbose=1
        ),
        
        # Reduce learning rate on plateau
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=10,
            min_lr=1e-7,
            verbose=1
        ),
        
        # Early stopping
        keras.callbacks.EarlyStopping(
            monitor='val_accuracy',
            patience=50,
            restore_best_weights=True,
            verbose=1
        ),
        
        # TensorBoard logging
        keras.callbacks.TensorBoard(
            log_dir=f"{MODEL_DIR}/logs/{timestamp}",
            histogram_freq=1
        ),
        
        # CSV logger
        keras.callbacks.CSVLogger(
            f"{MODEL_DIR}/training_log_{timestamp}.csv"
        )
    ]
    
    print("✅ Callbacks configured")
    return callbacks


def plot_training_history(history, save_path):
    """Plot and save training history"""
    print("\n📈 Plotting training history...")
    
    fig, axes = plt.subplots(2, 2, figsize=(15, 10))
    
    # Accuracy
    axes[0, 0].plot(history.history['accuracy'], label='Train')
    axes[0, 0].plot(history.history['val_accuracy'], label='Validation')
    axes[0, 0].set_title('Model Accuracy')
    axes[0, 0].set_xlabel('Epoch')
    axes[0, 0].set_ylabel('Accuracy')
    axes[0, 0].legend()
    axes[0, 0].grid(True)
    
    # Loss
    axes[0, 1].plot(history.history['loss'], label='Train')
    axes[0, 1].plot(history.history['val_loss'], label='Validation')
    axes[0, 1].set_title('Model Loss')
    axes[0, 1].set_xlabel('Epoch')
    axes[0, 1].set_ylabel('Loss')
    axes[0, 1].legend()
    axes[0, 1].grid(True)
    
    # Precision
    axes[1, 0].plot(history.history['precision'], label='Train')
    axes[1, 0].plot(history.history['val_precision'], label='Validation')
    axes[1, 0].set_title('Model Precision')
    axes[1, 0].set_xlabel('Epoch')
    axes[1, 0].set_ylabel('Precision')
    axes[1, 0].legend()
    axes[1, 0].grid(True)
    
    # Recall
    axes[1, 1].plot(history.history['recall'], label='Train')
    axes[1, 1].plot(history.history['val_recall'], label='Validation')
    axes[1, 1].set_title('Model Recall')
    axes[1, 1].set_xlabel('Epoch')
    axes[1, 1].set_ylabel('Recall')
    axes[1, 1].legend()
    axes[1, 1].grid(True)
    
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    print(f"✅ Training history saved to: {save_path}")
    
    plt.close()


def save_training_info(history, train_gen, val_gen):
    """Save training information to JSON"""
    print("\n💾 Saving training information...")
    
    info = {
        "model": "EfficientNetV2S",
        "dataset": DATASET_DIR,
        "image_size": IMAGE_SIZE,
        "batch_size": BATCH_SIZE,
        "epochs": len(history.history['accuracy']),
        "learning_rate": LEARNING_RATE,
        "num_classes": NUM_CLASSES,
        "class_names": CLASS_NAMES,
        "train_samples": train_gen.samples,
        "val_samples": val_gen.samples,
        "final_train_accuracy": float(history.history['accuracy'][-1]),
        "final_val_accuracy": float(history.history['val_accuracy'][-1]),
        "best_val_accuracy": float(max(history.history['val_accuracy'])),
        "timestamp": datetime.now().isoformat()
    }
    
    info_path = f"{MODEL_DIR}/training_info.json"
    with open(info_path, 'w') as f:
        json.dump(info, f, indent=2)
    
    print(f"✅ Training info saved to: {info_path}")


if __name__ == "__main__":
    print("="*70)
    print("🎯 EFFICIENTNETV2S FACE SHAPE CLASSIFICATION TRAINING")
    print("="*70)
    
    # Check GPU availability
    print("\n🖥️  Checking GPU availability...")
    gpus = tf.config.list_physical_devices('GPU')
    if gpus:
        print(f"✅ Found {len(gpus)} GPU(s):")
        for gpu in gpus:
            print(f"   - {gpu.name}")
        # Enable memory growth
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
    else:
        print("⚠️  No GPU found, training will use CPU (slower)")
    
    # Check dataset
    if not Path(DATASET_DIR).exists():
        print("\n❌ Augmented dataset not found!")
        print("Please run: python scripts/augment_dataset.py")
        exit(1)
    
    # Create data generators
    train_gen, val_gen = create_data_generators()
    
    # Build model
    model = build_model()
    
    # Print model summary
    print("\n📋 Model Summary:")
    model.summary()
    
    # Create callbacks
    callbacks = create_callbacks()
    
    # Train model
    print("\n🚀 Starting training...")
    print(f"   Epochs: {EPOCHS}")
    print(f"   Batch size: {BATCH_SIZE}")
    print(f"   Learning rate: {LEARNING_RATE}")
    print("="*70)
    
    history = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=EPOCHS,
        callbacks=callbacks,
        verbose=1
    )
    
    # Save final model
    final_model_path = f"{MODEL_DIR}/face_shape_efficientnet_final.h5"
    model.save(final_model_path)
    print(f"\n✅ Final model saved to: {final_model_path}")
    
    # Plot training history
    plot_path = f"{MODEL_DIR}/training_history.png"
    plot_training_history(history, plot_path)
    
    # Save training info
    save_training_info(history, train_gen, val_gen)
    
    # Print final results
    print("\n" + "="*70)
    print("🎉 TRAINING COMPLETE!")
    print("="*70)
    print(f"Final Training Accuracy:   {history.history['accuracy'][-1]:.4f}")
    print(f"Final Validation Accuracy: {history.history['val_accuracy'][-1]:.4f}")
    print(f"Best Validation Accuracy:  {max(history.history['val_accuracy']):.4f}")
    print("="*70)
    
    print("\n📝 Next steps:")
    print("1. Review training history plot")
    print("2. Evaluate model: python scripts/evaluate_model.py")
    print("3. Integrate into backend: Update analysis_cv.py")
