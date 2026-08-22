@echo off
title Instalador Oficial de Git para Windows

echo ===================================================
echo        DESCARGA E INSTALACION DE GIT FOR WINDOWS
echo ===================================================
echo.

where git >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Git ya se encuentra instalado en este equipo:
    git --version
    echo.
    echo No es necesario volver a instalarlo.
    echo.
    pause
    exit /b 0
)

echo [1/3] Preparando descarga del instalador oficial de Git...
set "GIT_INSTALLER=%TEMP%\Git-Installer.exe"
set "GIT_URL=https://github.com/git-for-windows/git/releases/download/v2.44.0.windows.1/Git-2.44.0-64-bit.exe"

echo [2/3] Descargando Git de 64 bits... Espere unos segundos...
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('%GIT_URL%', '%GIT_INSTALLER%')"

if not exist "%GIT_INSTALLER%" (
    echo [ERROR] No se pudo descargar el instalador automaticamente.
    echo Abriendo la pagina oficial de descarga en tu navegador...
    start https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [3/3] Iniciando el instalador de Git...
echo Por favor acepta los permisos y presiona Next hasta finalizar.
echo.
start /wait "" "%GIT_INSTALLER%"

echo.
echo ===================================================
echo       INSTALACION DE GIT COMPLETADA
echo ===================================================
echo.
echo Ya puedes subir tus cambios a GitHub ejecutando 'subir_a_github.bat'.
echo.
pause
