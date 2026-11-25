@echo off
chcp 65001 >nul
title ZAWAJ AI - Apply deep-link patch
set "MAIN=C:\Users\lumina\Desktop\ALL PROJECTS\ZAWAJ AI"
cd /d "%MAIN%"
if errorlevel 1 ( echo FAILED: main app folder not found: %MAIN% & pause & exit /b 1 )
node "%~dp0patch-main-app.js"
echo.
echo Next: run build-release.bat in the main app folder.
pause
