@echo off
REM =============================================================================
REM Launch ComfyUI locally with DirectML (AMD GPU)
REM Opens browser at http://localhost:8188
REM =============================================================================
title ComfyUI - DirectML (AMD GPU)

set COMFY_DIR=C:\1. Business\williamsforeal LLC\repositories\Cyclone-SS\comfyui\ComfyUI
set VENV=%COMFY_DIR%\venv\Scripts

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
