@echo off
echo ========================================
echo AI Beauty Consultant - Backend Setup
echo ========================================
echo.

cd Backend

echo [1/4] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed!
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)
echo Python found!
echo.

echo [2/4] Creating virtual environment...
if exist venv (
    echo Virtual environment already exists, skipping...
) else (
    python -m venv venv
    if %errorlevel% neq 0 (
        echo ERROR: Failed to create virtual environment!
        pause
        exit /b 1
    )
    echo Virtual environment created!
)
echo.

echo [3/4] Activating virtual environment...
call venv\Scripts\activate.bat
echo.

echo [4/4] Installing Python dependencies...
echo This may take a few minutes...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)
echo.

echo ========================================
echo Backend setup complete!
echo ========================================
echo.
echo IMPORTANT: You still need to:
echo   1. Add dataset files to Backend/datasets/ (if needed)
echo   2. Add trained models to Backend/models/ (if needed)
echo   3. See Backend/COLLECTION_GUIDE.md for dataset instructions
echo.
echo To start the Flask server:
echo   1. Activate virtual environment: venv\Scripts\activate
echo   2. Run server: python app.py
echo.
echo The API will run at http://localhost:5000
echo.
pause
