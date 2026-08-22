@echo off
title VPlan - Instalador de Dependencias

echo ===================================================
echo        VPLAN OS - INSTALADOR DE DEPENDENCIAS
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

echo [1/3] Verificando Node.js y NPM...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] No se encontro Node.js en el sistema.
    echo Descargalo desde https://nodejs.org/
) else (
    node -v
    npm -v
)
echo.

echo [2/3] Verificando Python...
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] No se encontro Python en el sistema.
    echo Descargalo desde https://www.python.org/
) else (
    python --version
)
echo.

echo [3/3] Instalando dependencias de Backend (Python)...
cd /d "%PROJECT_ROOT%backend"
if not exist "venv" (
    echo Creando entorno virtual Python (venv)...
    python -m venv venv
)

if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    python -m pip install --upgrade pip
    pip install -r requirements.txt
) else (
    pip install -r requirements.txt
)
echo Backend listo.
echo.

echo Instalando dependencias de Frontend (NPM)...
cd /d "%PROJECT_ROOT%frontend"
call npm install
echo Frontend listo.
echo.

cd /d "%PROJECT_ROOT%"
echo ===================================================
echo    DEPENDENCIAS INSTALADAS CON EXITO
echo ===================================================
echo.
pause
