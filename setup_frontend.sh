#!/bin/bash

echo "========================================"
echo "AI Beauty Consultant - Frontend Setup"
echo "========================================"
echo ""

cd Frontend/frontend

echo "[1/3] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
echo "Node.js found: $(node --version)"
echo ""

echo "[2/3] Installing dependencies..."
echo "This may take a few minutes..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies!"
    exit 1
fi
echo ""

echo "[3/3] Setup complete!"
echo ""
echo "========================================"
echo "Frontend is ready!"
echo "========================================"
echo ""
echo "To start the development server, run:"
echo "  cd Frontend/frontend"
echo "  npm start"
echo ""
echo "The app will open at http://localhost:3000"
echo ""
