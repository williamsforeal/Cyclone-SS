@echo off
REM Start development environment (n8n + ComfyUI + Bomb Ecom OS)

echo ========================================
echo   Bomb Ecom OS - Dev Environment
echo ========================================
echo.

REM Step 1: Start n8n, postgres, and bom-ecom
echo [1/4] Starting n8n + PostgreSQL + Bomb Ecom OS...
docker-compose up -d n8n postgres bom-ecom
timeout /t 3 /nobreak >nul
echo.

REM Step 2: Check if services are running
echo [2/4] Checking services...
docker ps --filter "name=n8n" --filter "name=postgres" --filter "name=bom-ecom" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

REM Step 3: Start ComfyUI in a new window
echo [3/4] Starting ComfyUI in new window...
start "ComfyUI" cmd /k "cd /d C:\Users\Jake\Downloads\ComfyUI_windows_portable && .\python_embeded\python.exe -s ComfyUI\main.py --windows-standalone-build --listen 127.0.0.1 --port 8188"
timeout /t 2 /nobreak >nul
echo.

REM Step 4: Open services in browser
echo [4/4] Opening services...
echo.

echo ========================================
echo   Services Started!
echo ========================================
echo.
echo   n8n:          http://localhost:5678
echo   Bomb Ecom OS: http://localhost:5000
echo   ComfyUI:      http://127.0.0.1:8188
echo.
echo   Login: admin / changeme
echo.
echo Press any key to open all services in browser...
pause >nul
start http://localhost:5678
start http://localhost:5000
