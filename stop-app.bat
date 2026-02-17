@echo off
echo ==========================================
echo    Arret de tous les services SocialVibe
echo ==========================================

REM Arrete tous les processus Node.js en cours
taskkill /F /IM node.exe /T

echo.
echo ==========================================
echo    Tous les services ont ete stoppes.
echo ==========================================
pause