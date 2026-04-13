@echo off
echo ---------------------------------------
echo   MirrorMe — Initial Setup (v1.1)
echo   Fixing Python 3.14 incompatibility...
echo ---------------------------------------

echo.
echo [1/4] Cleaning up old environment...
echo (If this fails, please close all other terminal windows first!)
if exist venv (
    rmdir /s /q venv || (echo ERROR: Could not remove venv. Close all Python windows and try again! && pause && exit /b)
    echo Removed old venv successfully.
)

echo.
echo [2/4] Creating Python 3.12 Virtual Environment...
py -3.12 -m venv venv
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Python 3.12 was not found. 
    echo Please make sure you have it installed or check 'py --list'.
    pause
    exit /b
)

echo.
echo [3/4] Installing Backend Dependencies...
call venv\Scripts\activate.bat
pip install --upgrade pip
pip install -r backend/requirements.txt

echo.
echo [4/4] Installing Frontend Dependencies (npm)...
cd frontend
npm install
cd ..

echo.
echo ---------------------------------------
echo   Setup Complete!
echo   You can now run start.bat
echo ---------------------------------------
pause
