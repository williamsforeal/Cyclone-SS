@echo off
REM Launch ComfyUI from Cursor terminal
REM Starts the AMD GPU portable version with API enabled

set COMFYUI_ROOT=C:\Users\Jake\Downloads\ComfyUI_windows_portable_amd\ComfyUI_windows_portable

echo Starting ComfyUI...
echo GUI will be at: http://127.0.0.1:8188
echo API will be at: http://127.0.0.1:8188/api
echo.

cd /d "%COMFYUI_ROOT%"
.\python_embeded\python.exe -s ComfyUI\main.py --windows-standalone-build --listen 127.0.0.1 --port 8188
