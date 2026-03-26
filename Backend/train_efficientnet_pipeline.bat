@echo off
setlocal
cd /d "%~dp0"

echo ========================================================
echo AI Beauty Consultant - EfficientNetV2S Training Pipeline (PyTorch)
echo ========================================================
echo [INFO] Using existing 'tf_gpu' environment...

:: 1. Activate Virtual Environment (tf_gpu)
if exist "tf_gpu\Scripts\activate.bat" (
    echo [INFO] Activating 'tf_gpu' virtual environment...
    call tf_gpu\Scripts\activate.bat
) else (
    echo [ERROR] 'tf_gpu' environment not found!
    echo Please ensure the setup was completed correctly.
    pause
    exit /b 1
)

:: 2. Verify Python Version in Venv
python -c "import sys; print(f'[INFO] Active Python Version: {sys.version}')"

:: 3. Install Dependencies
echo [INFO] Installing/Updating dependencies...
python -m pip install --upgrade pip
@REM Install torch specifically if not present (should be already there)
python -c "import torch" 2>nul
if errorlevel 1 (
    echo [INFO] Installing PyTorch with CUDA 11.8...
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
)
pip install -r requirements_training.txt
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)

:: 4. Verify GPU
echo [INFO] Verifying GPU detection...
python -c "import torch; print('GPU Available:', torch.cuda.is_available()); print('Device Count:', torch.cuda.device_count()); print('Device Name:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')"
echo.
timeout /t 3

:: 5. Data Preprocessing
echo [INFO] Starting Data Preprocessing (Download & Face Detection)...
python scripts\preprocess_dataset.py
if errorlevel 1 (
    echo [ERROR] Data preprocessing failed.
    pause
    exit /b 1
)

:: 6. Data Augmentation
echo [INFO] Starting Data Augmentation...
python scripts\augment_dataset.py
if errorlevel 1 (
    echo [ERROR] Data augmentation failed.
    pause
    exit /b 1
)

:: 7. Model Training
echo [INFO] Starting Model Training (PyTorch)...
python scripts\train_efficientnet_pytorch.py
if errorlevel 1 (
    echo [ERROR] Model training failed.
    pause
    exit /b 1
)

echo [SUCCESS] Training pipeline completed successfully!
pause
