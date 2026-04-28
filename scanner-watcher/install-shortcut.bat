@echo off
chcp 65001 >nul
echo.
echo ================================================
echo    إنشاء اختصار سطح المكتب
echo ================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\روائس - مراقب السكانر.lnk"

powershell -NoProfile -Command ^
    "$ws = New-Object -ComObject WScript.Shell;" ^
    "$s = $ws.CreateShortcut('%SHORTCUT_PATH%');" ^
    "$s.TargetPath = '%SCRIPT_DIR%start-watcher.bat';" ^
    "$s.WorkingDirectory = '%SCRIPT_DIR%';" ^
    "$s.IconLocation = 'imageres.dll,176';" ^
    "$s.Description = 'مراقب السكانر - يرفع المستندات تلقائياً للنظام';" ^
    "$s.Save();"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ تم إنشاء الاختصار على سطح المكتب
    echo    اسمه: روائس - مراقب السكانر
    echo.
) else (
    echo ❌ فشل إنشاء الاختصار
)

echo اضغط أي مفتاح للإغلاق...
pause >nul
