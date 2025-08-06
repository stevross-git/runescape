@echo off
echo 🔄 Restarting RuneScape server with automatic Claude processing...
echo.

REM Kill any existing Node processes
tasklist | find "node.exe" > nul
if %errorlevel% == 0 (
    echo 🛑 Stopping existing Node processes...
    taskkill /f /im node.exe > nul 2>&1
    timeout /t 2 > nul
)

echo 🚀 Starting server with automatic Claude processing...
cd server
start "RuneScape Server" cmd /k "npm start"

echo.
echo ✅ Server started! 
echo 🌐 Open: http://localhost:3000/runescape_world_builder.html
echo 💻 Click "Claude Terminal" button and type commands!
echo.
pause