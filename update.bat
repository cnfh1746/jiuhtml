@echo off
title GitHub One-Click Updater

echo =================================================
echo.
echo   Starting GitHub repository update process...
echo.
echo =================================================

:: 1. Add all new and changed files to the staging area
echo [STEP 1/3] Staging all files...
git add .
echo Files staged successfully.
echo.

:: 2. Ask for a commit message and commit the changes
echo [STEP 2/3] Please describe the changes you made.
set /p commitMessage="Enter your update message: "
git commit -m "%commitMessage%"
echo.

:: 3. Push the changes to GitHub
echo [STEP 3/3] Pushing changes to GitHub...
git push origin main

echo.
echo =================================================
echo.
echo   Update complete! You can close this window now.
echo.
echo =================================================

pause