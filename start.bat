@echo off
REM ==========================================================================
REM ESCENA SEGURA — servidor local de desarrollo
REM
REM La aplicacion usa modulos ES nativos (type="module"), que el navegador no
REM permite cargar desde file:// por motivos de seguridad. Este script levanta
REM un servidor estatico minimo usando Node.js, sin instalar dependencias.
REM
REM Uso:  doble clic en start.bat   (o)   npm start
REM ==========================================================================

setlocal
set PUERTO=8080

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo.
  echo [ERROR] No se ha encontrado Node.js en este equipo.
  echo.
  echo Opciones:
  echo   1. Instalar Node.js LTS desde https://nodejs.org ^(recomendado^)
  echo   2. Abrir el proyecto en Visual Studio Code y usar la extension
  echo      "Live Server" ^(boton derecho sobre index.html ^> Open with Live Server^)
  echo.
  pause
  exit /b 1
)

echo.
echo  ESCENA SEGURA — servidor de desarrollo
echo  -------------------------------------
echo  Abre en el navegador:  http://localhost:%PUERTO%
echo  Para detener el servidor:  Ctrl + C
echo.

start "" http://localhost:%PUERTO%
node scripts\servir.mjs %PUERTO%

endlocal
