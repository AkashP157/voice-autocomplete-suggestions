@echo off
REM Voice Autocomplete Suggestions - Quick Status Script (Windows)
REM Run this script to get instant project health overview

echo 🚀 Voice Autocomplete Suggestions - Project Status
echo ==================================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the project root directory
    exit /b 1
)

echo 📊 QUICK HEALTH CHECK
echo ---------------------

REM Git status
echo 🔄 Git Status:
git status --porcelain >nul 2>&1
if %errorlevel% equ 0 (
    for /f %%i in ('git status --porcelain') do set git_changes=%%i
    if defined git_changes (
        echo    ⚠️  Uncommitted changes found
    ) else (
        echo    ✅ Working tree clean
    )
) else (
    echo    ❌ Git repository issue
)

REM Last commit
echo 📝 Last Commit:
git log --oneline -1
echo.

REM Core file syntax check
echo 🔍 Core Files Syntax:
node -c script.js >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ script.js - OK
) else (
    echo    ❌ script.js - Syntax errors
)

node -c mobile.js >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ mobile.js - OK
) else (
    echo    ❌ mobile.js - Syntax errors
)

echo.

REM Performance check
echo 📈 Performance Metrics:
if exist "performance-report.json" (
    echo    📄 Latest report available ^(performance-report.json^)
    echo    💡 Run 'npm run performance' for fresh metrics
) else (
    echo    ❌ No performance report found
)

echo.

REM Security check
echo 🔒 Security Status:
if exist "security-report.json" (
    echo    📄 Latest security report available
    echo    💡 Run 'npm run security' for fresh audit
) else (
    echo    ❌ No security report found
)

echo.

REM Test status
echo 🧪 Test Status:
if exist "tests\run-tests.js" (
    echo    ✅ Test framework available
    echo    💡 Run 'npm test' for full test suite
) else (
    echo    ❌ Test framework not found
)

echo.

REM Quick commands
echo ⚡ QUICK COMMANDS
echo -----------------
echo 🌐 Start development:     npm start
echo 🧪 Run tests:            npm test
echo 📊 Performance check:    npm run performance
echo 🔒 Security audit:       npm run security
echo 📖 View dashboard:       type PROJECT-DASHBOARD.md
echo 📝 View dev log:         type DEVELOPMENT-LOG.md
echo.

echo 🎯 RECOMMENDED NEXT STEPS
echo -------------------------
echo 1. 🧪 Run test suite: npm test
echo 2. 🔒 Check security: npm run security
echo 3. 🌐 Start development server: npm start
echo 4. 📱 Test mobile interface: http://localhost:8000/mobile.html

echo.
echo 📄 For detailed status, check PROJECT-DASHBOARD.md
echo 📝 For development history, check DEVELOPMENT-LOG.md
echo.
echo ✨ Happy coding! 🚀
pause