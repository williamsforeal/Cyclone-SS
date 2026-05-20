@echo off
REM Launch ComfyUI from Cursor terminal
REM Starts the AMD GPU portable version with API enabled

REM Set COMFYUI_PORTABLE_ROOT in your .env or as a user env var.
REM This is the portable AMD install dir (contains python_embeded\ and ComfyUI\).
REM Default: C:\Users\%USERNAME%\Downloads\ComfyUI_windows_portable_amd\ComfyUI_windows_portable
if not defined COMFYUI_PORTABLE_ROOT set COMFYUI_PORTABLE_ROOT=C:\Users\%USERNAME%\Downloads\ComfyUI_windows_portable_amd\ComfyUI_windows_portable

if not exist "%COMFYUI_PORTABLE_ROOT%\python_embeded\python.exe" (
  echo ERROR: ComfyUI portable not found at %COMFYUI_PORTABLE_ROOT%
  echo Set COMFYUI_PORTABLE_ROOT env var to the portable install directory.
  pause
  exit /b 1
)

echo Starting ComfyUI...
echo Install: %COMFYUI_PORTABLE_ROOT%
echo GUI will be at: http://127.0.0.1:8188
echo API will be at: http://127.0.0.1:8188/api
echo.

cd /d "%COMFYUI_PORTABLE_ROOT%"
.\python_embeded\python.exe -s ComfyUI\main.py --windows-standalone-build --listen 127.0.0.1 --port 8188
