@echo off
setlocal
cd /d "%~dp0"
echo ========================================================
echo   SmartFlow — Push to GitHub (Baluu-1-2/SmartFlow)
echo ========================================================
echo.
echo Target Repository: https://github.com/Baluu-1-2/SmartFlow.git
echo Setting remote origin...
git remote set-url origin https://github.com/Baluu-1-2/SmartFlow.git
echo.
echo Pushing local branch 'main' to GitHub...
echo (If prompted by Git Credential Manager, sign in as Baluu-1-2 in your browser)
echo.
git push -u origin main
if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo  SUCCESS! SmartFlow successfully pushed to:
    echo  https://github.com/Baluu-1-2/SmartFlow
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo  Push notice: If the repository doesn't exist yet on GitHub,
    echo  create an empty repository named 'SmartFlow' on GitHub:
    echo  https://github.com/new
    echo  Then re-run this script to complete the push!
    echo ========================================================
)
echo.
pause
