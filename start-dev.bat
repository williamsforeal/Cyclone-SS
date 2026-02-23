@echo off
REM Start development environment (n8n + ComfyUI)

echo ========================================
echo   Bomb Ecom OS - Dev Environment
echo ========================================
echo.

REM Step 1: Start n8n and postgres (exclude bomb-ecom)
echo [1/3] Starting n8n + PostgreSQL...
docker-compose up -d n8n postgres
timeout /t 3 /nobreak >nul
echo.

REM Step 2: Check if services are running
echo [2/3] Checking services...
docker ps --filter "name=n8n" --filter "name=postgres" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

REM Step 3: Start ComfyUI in a new window
echo [3/3] Starting ComfyUI in new window...
start "ComfyUI" cmd /k "cd /d C:\Users\Jake\Downloads\ComfyUI_windows_portable_amd\ComfyUI_windows_portable && .\python_embeded\python.exe -s ComfyUI\main.py --windows-standalone-build --listen 127.0.0.1 --port 8188"
timeout /t 2 /nobreak >nul
echo.

echo ========================================
echo   Services Started!
echo ========================================
echo.
echo   n8n:      http://localhost:5678
echo   ComfyUI:  http://127.0.0.1:8188
echo.
echo   Login: admin / changeme
echo.
echo Press any key to open n8n in browser...
pause >nul
start http://localhost:5678
