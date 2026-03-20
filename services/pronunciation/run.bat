@echo off
echo 🚀 Starting ELSA Pronunciation Microservice...
cd %~dp0
call .venv\Scripts\activate
if %errorlevel% neq 0 (
    echo ❌ Virtual environment not found. Please run set_up first.
    pause
    exit /b 1
)
python main.py
pause
