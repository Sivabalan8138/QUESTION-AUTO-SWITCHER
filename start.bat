@echo off
echo Starting Technical Question Display Backend...
start cmd /k "cd backend && npm start"

echo Starting Technical Question Display Frontend...
start cmd /k "cd frontend && npm run dev"

echo Both backend and frontend have been started in separate windows.
pause
