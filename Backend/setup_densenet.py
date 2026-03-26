"""
DenseNet-201 Model Setup for Skin Analysis
Downloads pre-trained model and prepares for fine-tuning
"""
import tensorflow as tf
from tensorflow.keras.applications import DenseNet201
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
import os

def create_densenet_model(num_classes=3, input_shape=(224, 224, 3)):
    """
    Create DenseNet-201 model for skin analysis.
    
    Args:
        num_classes: Number of output classes (Acne, Normal, Oily)
        input_shape: Input image dimensions
    
    Returns:
        Compiled Keras model
    """
    print("🔧 Creating DenseNet-201 model...")
    
    # Load pre-trained DenseNet-201 (ImageNet weights)
    base_model = DenseNet201(
        weights='imagenet',
        include_top=False,
        input_shape=input_shape
    )
    
    # Freeze base layers initially (transfer learning)
    base_model.trainable = False
    
    # Add custom classification head
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(512, activation='relu')(x)
    x = Dropout(0.5)(x)
    x = Dense(256, activation='relu')(x)
    x = Dropout(0.3)(x)
    predictions = Dense(num_classes, activation='softmax')(x)
    
    # Create final model
    model = Model(inputs=base_model.input, outputs=predictions)
    
    # Compile
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy', 'AUC']
    )
    
    print(f"✅ Model created: {model.count_params():,} parameters")
    print(f"   Base model frozen: {not base_model.trainable}")
    
    return model

def unfreeze_and_finetune(model, learning_rate=0.0001):
    """
    Unfreeze base model for fine-tuning.
    Call this after initial training on your dataset.
    """
    print("🔓 Unfreezing base model for fine-tuning...")
    
    # Unfreeze the base model
    model.trainable = True
    
    # Freeze the first 100 layers (early feature extraction)
    # DenseNet has hundreds of layers, we want to fine-tune the later ones
    for layer in model.layers[:100]:
        layer.trainable = False
    
    # Recompile with lower learning rate
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss='categorical_crossentropy',
        metrics=['accuracy', 'AUC']
    )
    
    print(f"✅ Fine-tuning enabled (LR: {learning_rate})")
    return model

def save_model(model, path='app/models/densenet_skin.h5'):
    """Save trained model"""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    model.save(path)
    print(f"💾 Model saved to {path}")

if __name__ == "__main__":
    # Create model
    model = create_densenet_model()
    
    # Save initial model (pre-trained, not fine-tuned yet)
    save_model(model, 'app/models/densenet_skin_pretrained.h5')
    
    print("\n📋 Next Steps:")
    print("1. Prepare your dataset (10,000+ images recommended)")
    print("2. Run training script with your data")
    print("3. Fine-tune using unfreeze_and_finetune()")
    print("4. Save final model to app/models/densenet_skin.h5")
