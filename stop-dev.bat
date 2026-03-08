@echo off
REM Stop development environment

echo Stopping n8n + PostgreSQL + Bomb Ecom OS...
docker-compose stop n8n postgres bom-ecom

echo.
echo Services stopped!
echo.
echo Note: ComfyUI window must be closed manually (Ctrl+C in its terminal)
pause
