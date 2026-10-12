@echo off
setlocal
cd /d "%~dp0"
echo ========================================================
echo   SmartFlow — Starting Full-Stack Application
echo ========================================================
echo.
echo Launching development server (Server: 5000, Client: 5173)...
npm run dev
pause
