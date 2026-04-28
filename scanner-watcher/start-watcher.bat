@echo off
chcp 65001 >nul
title روائس - مراقب السكانر
color 0E
cd /d "%~dp0"

echo.
echo ================================================
echo    روائس - Scanner Watcher
echo ================================================
echo.

python watcher.py

echo.
echo توقف السكريبت. اضغط أي مفتاح للإغلاق...
pause >nul
