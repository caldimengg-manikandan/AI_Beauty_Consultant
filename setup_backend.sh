#!/bin/bash

echo "========================================"
echo "AI Beauty Consultant - Backend Setup"
echo "========================================"
echo ""

cd Backend

echo "[1/4] Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python is not installed!"
    echo "Please install Python from https://www.python.org/"
    exit 1
fi
echo "Python found: $(python3 --version)"
echo ""

echo "[2/4] Creating virtual environment..."
if [ -d "venv" ]; then
    echo "Virtual environment already exists, skipping..."
else
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to create virtual environment!"
        exit 1
    fi
    echo "Virtual environment created!"
fi
echo ""

echo "[3/4] Activating virtual environment..."
source venv/bin/activate
echo ""

echo "[4/4] Installing Python dependencies..."
echo "This may take a few minutes..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies!"
    exit 1
fi
echo ""

echo "========================================"
echo "Backend setup complete!"
echo "========================================"
echo ""
echo "IMPORTANT: You still need to:"
echo "  1. Add dataset files to Backend/datasets/ (if needed)"
echo "  2. Add trained models to Backend/models/ (if needed)"
echo "  3. See Backend/COLLECTION_GUIDE.md for dataset instructions"
echo ""
echo "To start the Flask server:"
echo "  1. Activate virtual environment: source venv/bin/activate"
echo "  2. Run server: python app.py"
echo ""
echo "The API will run at http://localhost:5000"
echo ""
