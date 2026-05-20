@echo off
REM =============================================================================
REM Launch ComfyUI locally with DirectML (AMD GPU)
REM Opens browser at http://localhost:8188
REM =============================================================================
title ComfyUI - DirectML (AMD GPU)

REM Set COMFYUI_ROOT in your .env or as a user env var. Default: C:\ComfyUI
if not defined COMFYUI_ROOT set COMFYUI_ROOT=C:\ComfyUI
set COMFY_DIR=%COMFYUI_ROOT%
set VENV=%COMFY_DIR%\venv\Scripts

if not exist "%COMFY_DIR%\main.py" (
  echo ERROR: ComfyUI not found at %COMFY_DIR%
  echo Set COMFYUI_ROOT to the directory containing main.py
  pause
  exit /b 1
)

echo ============================================
echo  ComfyUI Local Launcher (DirectML / AMD GPU)
echo ============================================
echo.
echo Starting ComfyUI...
echo UI will be at: http://localhost:8188
echo.

cd /d "%COMFY_DIR%"
"%VENV%\python.exe" main.py --directml --listen 0.0.0.0 --port 8188

pause
