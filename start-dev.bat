@echo off
setlocal

REM Run from the script's directory
cd /d "%~dp0"

REM --- Ensure Docker Desktop is running ---
docker info >nul 2>&1
if errorlevel 1 (
  echo Starting Docker Desktop...
  if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
    start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
  ) else if exist "%ProgramFiles(x86)%\Docker\Docker\Docker Desktop.exe" (
    start "" "%ProgramFiles(x86)%\Docker\Docker\Docker Desktop.exe"
  ) else (
    echo Could not find Docker Desktop. Adjust the path in this script if installed elsewhere.
  )

  echo Waiting for Docker engine to be ready...
  :wait_docker
  docker info >nul 2>&1
  if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto wait_docker
  )
)
echo Docker is ready.

REM --- Bring up containers ---
docker compose up -d

REM --- Dev servers in separate consoles ---
start "demo_node_2" cmd /k "cd /d ""%~dp0demo_node_2"" && npm run dev -- --host"
start "ev_router"  cmd /k "cd /d ""%~dp0ev_router"" && npm run dev"