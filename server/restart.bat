@echo off
chcp 65001 >nul
echo.
echo ════════════════════════════════════════
echo   🔄 LoanDD Server Restart
echo ════════════════════════════════════════
echo.

echo [1] ปิด Node.js ทั้งหมด...
taskkill /F /IM node.exe 2>nul
if %errorlevel%==0 (
    echo     ✅ ปิด Node.js สำเร็จ
) else (
    echo     ℹ️ ไม่มี Node.js ที่รันอยู่
)

echo.
echo [2] รอ 2 วินาที...
timeout /t 2 /nobreak >nul

echo.
echo [3] เริ่ม server ใหม่...
echo.
cd /d "%~dp0"
node app.js
pause
