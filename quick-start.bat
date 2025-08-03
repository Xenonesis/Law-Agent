@echo off
REM Quick Start Script for Private Lawyer Bot
REM Automatically navigates to project root and starts enhanced terminal

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                🏛️  PRIVATE LAWYER BOT                        ║
echo ║                   Quick Start Launcher                       ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found in current directory
    echo 💡 Please run this script from the project root directory
    echo.
    pause
    exit /b 1
)

echo ✅ Project detected: Private Lawyer Bot
echo 🚀 Starting enhanced terminal with command helper...
echo.
echo 💡 Once started, type "/" to see all available commands
echo.

REM Start the enhanced terminal
node terminal-launcher.js

echo.
echo 👋 Terminal closed. Thanks for using Private Lawyer Bot!
pause