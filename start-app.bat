@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
echo ==========================================
echo    Nettoyage des anciens services en cours...
echo ==========================================

REM Liste des ports a liberer
set PORTS=4000 5000 3001 3002 3003 3004 3005 3006 3000

for %%P in (%PORTS%) do (
    echo Liberation du port %%P...
    for /f "tokens=5" %%A in ('netstat -aon ^| findstr :%%P ^| findstr LISTENING') do (
        taskkill /F /PID %%A >nul 2>&1
    )
)

echo.
echo ==========================================
echo    Verification et installation des dependances...
echo ==========================================

REM Liste des services
set SERVICES=gateway user-service post-service notification-service message-service comment-service story-service reaction-service frontend

for %%S in (%SERVICES%) do (
    if exist "%%S\package.json" (
        set "NEED_INSTALL=0"
        
        REM Verifier si node_modules existe
        if not exist "%%S\node_modules" set "NEED_INSTALL=1"
        
        REM Verifier si express est installe (dependance commune)
        if not exist "%%S\node_modules\express\package.json" set "NEED_INSTALL=1"
        
        REM Verifier si dotenv est installe
        if not exist "%%S\node_modules\dotenv\package.json" set "NEED_INSTALL=1"
        
        REM Verifier modules souvent corrompus
        if not exist "%%S\node_modules\side-channel\index.js" set "NEED_INSTALL=1"
        if not exist "%%S\node_modules\qs\lib\stringify.js" set "NEED_INSTALL=1"
        
        if "!NEED_INSTALL!"=="1" (
            echo [CLEAN] %%S - Nettoyage et reinstallation...
            if exist "%%S\node_modules" rd /s /q "%%S\node_modules" 2>nul
            if exist "%%S\package-lock.json" del /f /q "%%S\package-lock.json" 2>nul
            echo [INSTALL] %%S - Installation des dependances...
            pushd %%S
            call npm install
            popd
        ) else (
            echo [OK] %%S - Dependances OK
        )
    )
)

echo.
echo ==========================================
echo    Lancement de l'architecture Microservices
echo ==========================================

echo Démarrage du Gateway (Port 4000)...
start "Gateway API (4000)" cmd /k "cd gateway && npm start"

echo Démarrage du Service User (Port 5000)...
start "User Service (5000)" cmd /k "cd user-service && npm start"

echo Démarrage du Service Post (Port 3001)...
start "Post Service (3001)" cmd /k "cd post-service && npm start"

echo Démarrage du Service Notification (Port 3002)...
start "Notification Service (3002)" cmd /k "cd notification-service && npm start"

echo Démarrage du Service Message (Port 3003)...
start "Message Service (3003)" cmd /k "cd message-service && npm start"

echo Démarrage du Service Comment (Port 3004)...
start "Comment Service (3004)" cmd /k "cd comment-service && npm start"

echo Démarrage du Service Story (Port 3005)...
start "Story Service (3005)" cmd /k "cd story-service && npm start"

echo Démarrage du Service Reaction (Port 3006)...
start "Reaction Service (3006)" cmd /k "cd reaction-service && npm start"

echo Démarrage du Frontend (Port 3000)...
start "Frontend (3000)" cmd /k "cd frontend && npm start"

echo.
echo ==========================================
echo    Tous les services sont en cours de démarrage
echo    Accédez à l'application via http://localhost:3000
echo ==========================================
pause
