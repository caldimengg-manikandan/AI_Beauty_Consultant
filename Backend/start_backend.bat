@echo off
echo.
echo ============================================================
echo   GlowAI Beauty Platform — Backend Startup
echo ============================================================
echo   Using: Python 3.11 (venv_311) — All packages installed
echo ============================================================
echo.

cd /d "%~dp0"

:: Fix Windows emoji/Unicode encoding
set PYTHONIOENCODING=utf-8
:: Kill any process on port 8000
echo Checking port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    echo Stopping existing process on port 8000 ^(PID: %%a^)...
    taskkill /f /pid %%a >nul 2>&1
)

echo Starting FastAPI backend on http://localhost:8000 ...
echo.

venv\Scripts\python.exe run.py

pause
