# Enhanced Terminal Launcher for Private Lawyer Bot (PowerShell)
# Shows all commands when user presses "/"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║            🏛️  PRIVATE LAWYER BOT TERMINAL                    ║" -ForegroundColor Cyan  
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found in current directory" -ForegroundColor Red
    Write-Host "💡 Please run this script from the project root directory" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Project detected: Private Lawyer Bot" -ForegroundColor Green
Write-Host "🚀 Starting enhanced terminal with command helper..." -ForegroundColor Blue
Write-Host ""
Write-Host "💡 Once started, type '/' to see all available commands" -ForegroundColor Yellow
Write-Host ""

# Start the enhanced terminal
try {
    node terminal-launcher.js
} catch {
    Write-Host "❌ Error starting terminal. Make sure Node.js is installed." -ForegroundColor Red
    Write-Host "💡 Install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "👋 Terminal closed. Thanks for using Private Lawyer Bot!" -ForegroundColor Green
Read-Host "Press Enter to exit"