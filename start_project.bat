@echo off
title HOA Management System Starter
echo ===================================================
echo Starting HOA Management System...
echo ===================================================
echo.

echo [1/2] Starting Backend Server (Port 5000)...
start "HOA Backend Server" cmd /k "cd backend && npm run dev"

echo [2/2] Starting Frontend Server (Port 5173)...
start "HOA Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo Services are starting in separate windows!
echo Please wait a few seconds. The website should open
echo automatically in your default browser.
echo.
echo (If it doesn't open, go to: http://localhost:5173)
echo ===================================================
echo You can close this small window now. 
echo To stop the servers later, simply close the two black 
echo command windows that just popped up.
echo ===================================================
pause
