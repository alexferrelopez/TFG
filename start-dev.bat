@echo off
setlocal

REM Ensure we run from the script's folder
cd /d "%~dp0"

REM 1) Start containers
docker compose up -d

REM 2) Start demo_node_2 dev server in a new window
start "demo_node_2" cmd /k "cd /d ""%~dp0demo_node_2"" && npm run dev"

REM 3) Start ev_router dev server in a new window
start "ev_router"  cmd /k "cd /d ""%~dp0ev_router"" && npm run dev"
