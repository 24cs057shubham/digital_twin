@echo off
cd /d "%~dp0"

echo Starting Digital Twin System...

REM Try Python: py launcher, then python3, then python
set PYTHON=
where py >nul 2>&1 && set PYTHON=py
if not defined PYTHON where python3 >nul 2>&1 && set PYTHON=python3
if not defined PYTHON where python >nul 2>&1 && set PYTHON=python
if not defined PYTHON (
    echo ERROR: Python not found. Install from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Try Node/npm
set NPM=npm
where npm >nul 2>&1 || set NPM=
if not defined NPM if exist "%ProgramFiles%\nodejs\npm.cmd" set NPM=%ProgramFiles%\nodejs\npm.cmd
if not defined NPM if exist "%ProgramFiles(x86)%\nodejs\npm.cmd" set NPM=%ProgramFiles(x86)%\nodejs\npm.cmd
if not defined NPM if exist "%LocalAppData%\Programs\node\npm.cmd" set NPM=%LocalAppData%\Programs\node\npm.cmd
if not defined NPM (
    echo ERROR: Node.js/npm not found. Install from https://nodejs.org/
    pause
    exit /b 1
)

start "Digital Twin Backend" cmd /k "cd /d ""%~dp0backend"" && %PYTHON% -m uvicorn app.main_v2:app --reload --host 0.0.0.0 --port 8000"
start "Digital Twin Frontend" cmd /k "cd /d ""%~dp0frontend"" && %NPM% run dev"

echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Opening dashboard in browser in 8 seconds...
timeout /t 8 /nobreak >nul
start http://localhost:5173
echo Done. Close this window or press any key.
pause
