@echo off
echo Starting Project...
cd /d %~dp0
call venv\Scripts\activate
python app.py
pause