@echo off
echo ==========================================
echo Starting DiTenun Project (Django + Editor)
echo ==========================================

:: Start Django Server in a new window
echo Launching Backend (Django)...
start "Django Backend" cmd /k "python manage.py runserver"

:: Start Editor-UI in current window
echo Launching Frontend (Editor-UI)...
cd editor-ui
npm run dev

pause
