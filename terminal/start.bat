@echo off
echo.
echo ========================================
echo   MT5 Trading Terminal Startup
echo ========================================
echo.

REM Create logs directory if it doesn't exist
if not exist logs mkdir logs

REM Check if Go is installed
where go >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Go is not installed
    pause
    exit /b 1
)
echo [OK] Go installed

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed
    pause
    exit /b 1
)
echo [OK] Python installed

REM Check if Node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed
    pause
    exit /b 1
)
echo [OK] Node.js installed

echo.
echo Starting services...
echo.

REM Start Go backend in new window
echo Starting Go backend...
start "MT5 Backend" cmd /k "cd backend && go run main.go"
timeout /t 2 /nobreak >nul

REM Start Python bridge in new window
echo Starting Python MT5 bridge...
start "MT5 Bridge" cmd /k "cd mt5-bridge && venv\Scripts\activate && python mt5_server.py"
timeout /t 2 /nobreak >nul

REM Start React frontend in new window
echo Starting React frontend...
start "MT5 Frontend" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo   All services started!
echo ========================================
echo.
echo Service URLs:
echo   - Frontend:   http://localhost:3000
echo   - Backend:    http://localhost:8080
echo   - MT5 Bridge: http://localhost:5000
echo.
echo Close the command windows to stop services
echo.
pause