@echo off
title MirrorMe Launcher
echo ---------------------------------------
echo   MirrorMe — Digital Twin Launcher
echo ---------------------------------------

echo Starting Backend (FastAPI)...
start "MirrorMe Backend" cmd /k "venv\Scripts\activate.bat && cd backend && python -m uvicorn api:app --reload --host 127.0.0.1 --port 8000"

echo Starting Frontend (Next.js)...
start "MirrorMe Frontend" cmd /k "cd frontend && npm run dev -- --port 3000"

echo.
echo ---------------------------------------
echo   Launch Complete!
echo   Backend: http://localhost:8000
echo   Frontend: http://localhost:3000
echo ---------------------------------------
echo Keep this window open or close it when done.
pause
