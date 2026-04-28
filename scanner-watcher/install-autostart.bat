@echo off
chcp 65001 >nul
echo.
echo ================================================
echo    تشغيل تلقائي عند بداية الـ Windows
echo ================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "STARTUP_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\RawaesScanWatcher.lnk"

powershell -NoProfile -Command ^
    "$ws = New-Object -ComObject WScript.Shell;" ^
    "$s = $ws.CreateShortcut('%STARTUP_PATH%');" ^
    "$s.TargetPath = '%SCRIPT_DIR%start-watcher-hidden.vbs';" ^
    "$s.WorkingDirectory = '%SCRIPT_DIR%';" ^
    "$s.Description = 'مراقب السكانر — يبدأ تلقائياً مع Windows';" ^
    "$s.Save();"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ سيبدأ السكريبت تلقائياً عند تشغيل Windows
    echo    (يعمل في الخلفية بدون نافذة)
    echo.
) else (
    echo ❌ فشل
)

echo اضغط أي مفتاح للإغلاق...
pause >nul
