"""
EfficientNetVS Training Script (PyTorch Version)
Trains an EfficientNetV2-S model for face shape classification.

Usage:
    python train_efficientnet_pytorch.py

Pre-requisites:
    - Dataset must be preprocessed/augmented in 'datasets/face_shape_augmented' (or 'cropped')
    - Structure: root/class_name/image.jpg
"""

import os
import time
import copy
import sys
import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim import lr_scheduler
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, models, transforms
from tqdm import tqdm
import matplotlib.pyplot as plt
import numpy as np

# Force UTF-8 encoding for Windows terminal
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Configuration
DATA_DIR = "datasets/face_shape_augmented" 
# Fallback to cropped if augmented doesn't exist
if not os.path.exists(DATA_DIR):
    DATA_DIR = "datasets/face_shape_cropped"
    print(f"⚠️ Augmented dataset not found. Using {DATA_DIR} instead.")

MODEL_SAVE_PATH = "models/face_shape_efficientnetv2s.pth"
BATCH_SIZE = 16 
NUM_EPOCHS = 30 # Adjust as needed
LEARNING_RATE = 0.001
NUM_CLASSES = 5
CLASSES = ["Heart", "Oblong", "Oval", "Round", "Square"]
IMG_SIZE = 224 # EfficientNet standard input

def train_model(model, dataloaders, dataset_sizes, criterion, optimizer, scheduler, num_epochs=25):
    """
    Main training loop
    """
    since = time.time()

    best_model_wts = copy.deepcopy(model.state_dict())
    best_acc = 0.0
    
    # Force CPU for now as RTX 5060 Ti (sm_120) kernels are not yet in stable PyTorch
    device = torch.device("cpu")
    print(f"🚀 Training on device: {device}")
    model = model.to(device)

    history = {'train_loss': [], 'train_acc': [], 'val_loss': [], 'val_acc': []}

    for epoch in range(num_epochs):
        print(f'Epoch {epoch}/{num_epochs - 1}')
        print('-' * 10)

        # Each epoch has a training and validation phase
        for phase in ['train', 'val']:
            if phase == 'train':
                model.train()  # Set model to training mode
            else:
                model.eval()   # Set model to evaluate mode

            running_loss = 0.0
            running_corrects = 0

            # Iterate over data.
            for inputs, labels in tqdm(dataloaders[phase], desc=f"{phase} loop"):
                inputs = inputs.to(device)
                labels = labels.to(device)

                # Zero the parameter gradients
                optimizer.zero_grad()

                # Forward
                # Track history if only in train
                with torch.set_grad_enabled(phase == 'train'):
                    outputs = model(inputs)
                    _, preds = torch.max(outputs, 1)
                    loss = criterion(outputs, labels)

                    # Backward + optimize only if in training phase
                    if phase == 'train':
                        loss.backward()
                        optimizer.step()

                # Statistics
                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)

            if phase == 'train':
                scheduler.step()

            epoch_loss = running_loss / dataset_sizes[phase]
            epoch_acc = running_corrects.double() / dataset_sizes[phase]

            print(f'{phase} Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}')
            
            history[f'{phase}_loss'].append(epoch_loss)
            history[f'{phase}_acc'].append(epoch_acc.item())

            # Deep copy the model
            if phase == 'val' and epoch_acc > best_acc:
                best_acc = epoch_acc
                best_model_wts = copy.deepcopy(model.state_dict())
                torch.save(model.state_dict(), MODEL_SAVE_PATH)
                print(f"🔥 New best model saved with Acc: {best_acc:.4f}")

        print()

    time_elapsed = time.time() - since
    print(f'Training complete in {time_elapsed // 60:.0f}m {time_elapsed % 60:.0f}s')
    print(f'Best val Acc: {best_acc:4f}')

    # Load best model weights
    model.load_state_dict(best_model_wts)
    return model, history

def plot_history(history):
    """Plot training history"""
    acc = history['train_acc']
    val_acc = history['val_acc']
    loss = history['train_loss']
    val_loss = history['val_loss']

    epochs_range = range(len(acc))

    plt.figure(figsize=(12, 4))
    
    plt.subplot(1, 2, 1)
    plt.plot(epochs_range, acc, label='Training Accuracy')
    plt.plot(epochs_range, val_acc, label='Validation Accuracy')
    plt.legend(loc='lower right')
    plt.title('Training and Validation Accuracy')

    plt.subplot(1, 2, 2)
    plt.plot(epochs_range, loss, label='Training Loss')
    plt.plot(epochs_range, val_loss, label='Validation Loss')
    plt.legend(loc='upper right')
    plt.title('Training and Validation Loss')
    
    os.makedirs("models", exist_ok=True)
    plt.savefig("models/training_history.png")
    print("Graph saved to models/training_history.png")

def main():
    if not os.path.exists(DATA_DIR):
        print(f"❌ Dataset directory not found at {DATA_DIR}")
        print("Please run scripts/preprocess_dataset.py and scripts/augment_dataset.py first.")
        return

    # Data Augmentation and Normalization for training
    # Just normalization for validation
    data_transforms = {
        'train': transforms.Compose([
            transforms.Resize((IMG_SIZE, IMG_SIZE)),
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(15),
            # transforms.ColorJitter(brightness=0.1, contrast=0.1, saturation=0.1, hue=0.1),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
        'val': transforms.Compose([
            transforms.Resize((IMG_SIZE, IMG_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
    }

    print("Loading dataset...")
    full_dataset = datasets.ImageFolder(DATA_DIR, data_transforms['train'])
    
    # Check classes
    class_names = full_dataset.classes
    print(f"Classes found: {class_names}")
    
    # Split into train/val (80/20)
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])
    
    # We need to override the transform for validation dataset to not use augmentation
    # But random_split doesn't allow easy transform override per subset because it wraps the original dataset.
    # A cleaner way is to create two ImageFolders, but that's memory inefficient if cached, 
    # but okay for file-based. 
    # STRICT implementation for transform correctness:
    # Let's create two separate datasets pointing to same dir
    train_dataset_full = datasets.ImageFolder(DATA_DIR, data_transforms['train'])
    val_dataset_full = datasets.ImageFolder(DATA_DIR, data_transforms['val'])
    
    # We need same indices for split.
    torch.manual_seed(42)
    indices = torch.randperm(len(train_dataset_full)).tolist()
    train_indices = indices[:train_size]
    val_indices = indices[train_size:]
    
    train_subset = torch.utils.data.Subset(train_dataset_full, train_indices)
    val_subset = torch.utils.data.Subset(val_dataset_full, val_indices)

    image_datasets = {'train': train_subset, 'val': val_subset}
    dataset_sizes = {x: len(image_datasets[x]) for x in ['train', 'val']}
    
    dataloaders = {x: DataLoader(image_datasets[x], batch_size=BATCH_SIZE,
                                 shuffle=True, num_workers=0) 
                   for x in ['train', 'val']} # num_workers=0 for Windows compatibility often

    print(f"Dataset sizes: {dataset_sizes}")

    # Load Pretrained EfficientNetV2S
    print("Downloading/Loading EfficientNetV2-S...")
    # efficientnet_v2_s weights=DEFAULT means ImageNet weights
    model_ft = models.efficientnet_v2_s(weights='DEFAULT')

    # Modify the classifier head
    # EfficientNet V2 S classifier structure might need inspection, usually it's model.classifier
    # Let's check the architecture or assume standard torchvision
    # model_ft.classifier is mostly a Sequential(Dropout, Linear)
    
    num_ftrs = model_ft.classifier[1].in_features
    model_ft.classifier[1] = nn.Linear(num_ftrs, len(class_names))

    criterion = nn.CrossEntropyLoss()

    # Observe that all parameters are being optimized
    optimizer_ft = optim.Adam(model_ft.parameters(), lr=LEARNING_RATE)

    # Decay LR by a factor of 0.1 every 7 epochs
    exp_lr_scheduler = optim.lr_scheduler.StepLR(optimizer_ft, step_size=7, gamma=0.1)

    os.makedirs("models", exist_ok=True)
    
    # Train
    model_ft, history = train_model(model_ft, dataloaders, dataset_sizes, criterion, optimizer_ft, exp_lr_scheduler, num_epochs=NUM_EPOCHS)
    
    plot_history(history)
    print("Done!")

if __name__ == '__main__':
    main()
