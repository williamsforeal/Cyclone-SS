@echo off
REM Import n8n workflow - Windows batch wrapper
REM Usage: scripts\import-workflow.bat workflows\your-workflow.json

REM Load .env file and extract N8N_LOCAL_API_KEY
for /f "tokens=2 delims==" %%a in ('findstr "^N8N_LOCAL_API_KEY=" .env') do set N8N_LOCAL_API_KEY=%%a

REM Run the import script
node scripts\import-workflow.js %*
