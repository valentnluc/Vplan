@echo off
title Subir Cambios a GitHub - VPlan

echo ===================================================
echo             SUBIR VPLAN A GITHUB
echo ===================================================
echo.

set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

set "PATH=C:\Program Files\Git\cmd;C:\Program Files\Git\bin;C:\Program Files (x86)\Git\cmd;%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"

where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Git no esta instalado o no se detecto en el PATH.
    echo Por favor ejecuta primero 'instalar_git.bat'.
    echo.
    pause
    exit /b 1
)

echo [1/4] Inicializando repositorio Git...
if not exist ".git" (
    git init
    git branch -M main
)

echo [2/4] Preparando archivos para commit...
git add .

echo [3/4] Creando commit...
git commit -m "feat: VPlan Framework OS - TRMNL Monochrome Design, Zero-Overlap Planner, Full Milestone Management"

echo [4/4] Conectando con https://github.com/valentnluc/Vplan.git ...
git remote remove origin 2>nul
git remote add origin https://github.com/valentnluc/Vplan.git

echo.
echo Subiendo rama main a GitHub...
git push -u origin main

if %ERRORLEVEL% neq 0 (
    echo.
    echo [AVISO] Sincronizando con rama remota...
    git push -u origin main --force
)

echo.
echo ===================================================
echo    PROYECTO SUBIDO CON EXITO A TU GITHUB
echo    URL: https://github.com/valentnluc/Vplan
echo ===================================================
echo.
pause
