@echo off
echo ========================================
echo AI Beauty Consultant - Frontend Setup
echo ========================================
echo.

cd Frontend\frontend

echo [1/3] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js found!
echo.

echo [2/3] Installing dependencies...
echo This may take a few minutes...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)
echo.

echo [3/3] Setup complete!
echo.
echo ========================================
echo Frontend is ready!
echo ========================================
echo.
echo To start the development server, run:
echo   cd Frontend\frontend
echo   npm start
echo.
echo The app will open at http://localhost:3000
echo.
pause
