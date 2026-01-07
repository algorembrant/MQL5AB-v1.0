@echo off
REM MQL5 Algo Bot Builder - Quick Start Script for Windows

echo ========================================
echo MQL5 Algo Bot Builder - Quick Start
echo ========================================
echo.

REM Check prerequisites
echo Checking prerequisites...

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Python is required but not installed.
    exit /b 1
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is required but not installed.
    exit /b 1
)

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Docker is required but not installed.
    exit /b 1
)

echo All prerequisites found
echo.

REM Backend setup
echo Setting up backend...
cd backend

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate

echo Installing Python dependencies...
pip install -q -r requirements.txt

if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env
)

echo Backend setup complete
echo.

cd ..

REM Database setup
echo Setting up database...
docker-compose up -d postgres

echo Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak >nul

echo Database setup complete
echo.

REM Frontend setup
echo Setting up frontend...
cd frontend

if not exist "node_modules" (
    echo Installing Node dependencies...
    call npm install
)

REM Create index.css
if not exist "src\index.css" (
    echo Creating Tailwind CSS file...
    (
        echo @tailwind base;
        echo @tailwind components;
        echo @tailwind utilities;
    ) > src\index.css
)

REM Create index.html
if not exist "index.html" (
    echo Creating index.html...
    (
        echo ^<!DOCTYPE html^>
        echo ^<html lang="en"^>
        echo   ^<head^>
        echo     ^<meta charset="UTF-8" /^>
        echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0" /^>
        echo     ^<title^>MQL5 Algo Bot Builder^</title^>
        echo   ^</head^>
        echo   ^<body^>
        echo     ^<div id="root"^>^</div^>
        echo     ^<script type="module" src="/src/index.js"^>^</script^>
        echo   ^</body^>
        echo ^</html^>
    ) > index.html
)

REM Create index.js
if not exist "src\index.js" (
    echo Creating index.js...
    (
        echo import React from 'react';
        echo import ReactDOM from 'react-dom/client';
        echo import App from './App';
        echo import './index.css';
        echo.
        echo ReactDOM.createRoot^(document.getElementById^('root'^)^).render^(
        echo   ^<React.StrictMode^>
        echo     ^<App /^>
        echo   ^</React.StrictMode^>
        echo ^);
    ) > src\index.js
)

echo Frontend setup complete
echo.

cd ..

REM Create run scripts
echo Creating run scripts...

REM Backend run script
(
    echo @echo off
    echo cd backend
    echo call venv\Scripts\activate
    echo python -m app.main
) > run-backend.bat

REM Frontend run script
(
    echo @echo off
    echo cd frontend
    echo npm run dev
) > run-frontend.bat

REM Combined run script
(
    echo @echo off
    echo echo ========================================
    echo echo Starting MQL5 Algo Bot Builder...
    echo echo ========================================
    echo echo.
    echo echo Backend: http://localhost:8000
    echo echo Frontend: http://localhost:3000
    echo echo.
    echo echo Press Ctrl+C to stop
    echo echo.
    echo start "Backend" cmd /k run-backend.bat
    echo start "Frontend" cmd /k run-frontend.bat
) > run-all.bat

echo.
echo ========================================
echo Installation Successful!
echo ========================================
echo.
echo IMPORTANT: Make sure MetaTrader 5 is running!
echo.
echo To start the application:
echo.
echo   Option 1: run-all.bat
echo   Option 2: Open two terminals
echo     Terminal 1: run-backend.bat
echo     Terminal 2: run-frontend.bat
echo.
echo Access: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo ========================================
echo.

set /p START="Start the application now? (Y/N): "
if /i "%START%"=="Y" (
    call run-all.bat
)

pause