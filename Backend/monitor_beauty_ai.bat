@echo off
echo ==========================================
echo 💄 AI Beauty Consultant Training Monitor
echo ==========================================
echo.
echo [1] Monitor Skin Analysis (DenseNet)
echo [2] Monitor Face Shape (EfficientNet)
echo [3] Exit
echo.
set /p choice="Choose a log to follow (1-3): "

if "%choice%"=="1" (
    echo.
    echo 📊 Monitoring Skin Analysis... (Press Ctrl+C to stop)
    powershell -Command "Get-Content skin_training.log -Wait -Tail 20"
)

if "%choice%"=="2" (
    echo.
    echo 🧬 Monitoring Face Shape... (Press Ctrl+C to stop)
    powershell -Command "Get-Content face_training.log -Wait -Tail 20"
)

if "%choice%"=="3" exit
goto :eof
