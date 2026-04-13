# Start MirrorMe — Full Stack AI Mirror

echo "Starting MirrorMe Backend (FastAPI)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; uvicorn api:app --reload --port 8000"

echo "Starting MirrorMe Frontend (Next.js)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev -- --port 3000"

echo "Launch complete!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
