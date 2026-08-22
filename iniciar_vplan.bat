@echo off
title VPlan OS - Centro de Mando

echo ===================================================
echo             INICIANDO VPLAN FRAMEWORK OS
echo ===================================================
echo.

set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

if exist "%LOCALAPPDATA%\Programs\node-v20.18.0-win-x64" (
    set "PATH=%LOCALAPPDATA%\Programs\node-v20.18.0-win-x64;%PATH%"
)
if exist "%LOCALAPPDATA%\Programs\python311" (
    set "PATH=%LOCALAPPDATA%\Programs\python311;%LOCALAPPDATA%\Programs\python311\Scripts;%PATH%"
)

echo [1/2] Iniciando Servidor Backend (FastAPI :8000)...
cd /d "%PROJECT_ROOT%backend"
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)
start "VPlan Backend (FastAPI)" cmd /k "python main.py"

echo [2/2] Iniciando Frontend (Vite :5173)...
cd /d "%PROJECT_ROOT%frontend"
start "VPlan Frontend (Vite)" cmd /k "npm run dev"

echo.
echo ===================================================
echo     VPlan esta ejecutandose en:
echo     Frontend: http://localhost:5173
echo     Backend:  http://localhost:8000/docs
echo ===================================================
echo.
timeout /t 3 >nul
start http://localhost:5173
