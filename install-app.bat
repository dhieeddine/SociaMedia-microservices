@echo off
chcp 65001 >nul
echo ==========================================
echo    Installation des Microservices SocialMedia
echo ==========================================
echo.

REM Définir le chemin de base
set BASE_DIR=%~dp0

REM Liste des services à installer
set SERVICES=gateway user-service post-service notification-service message-service comment-service story-service reaction-service frontend

echo [INFO] Vérification de Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do echo [OK] Node.js version: %%v
for /f "tokens=*" %%v in ('npm -v') do echo [OK] npm version: %%v
echo.

REM Installation des dépendances pour chaque service
for %%S in (%SERVICES%) do (
    echo ==========================================
    echo    Installation de %%S
    echo ==========================================
    
    if exist "%BASE_DIR%%%S" (
        cd /d "%BASE_DIR%%%S"
        
        if exist "package.json" (
            REM Nettoyer node_modules corrompu si necessaire
            if exist "node_modules" (
                if not exist "node_modules\.package-lock.json" (
                    echo [CLEAN] Suppression de node_modules corrompu...
                    rd /s /q "node_modules" 2>nul
                )
            )
            
            echo [INFO] Exécution de npm install dans %%S...
            call npm install express mongoose dotenv cors
            
            if %errorlevel% equ 0 (
                echo [OK] %%S installé avec succès!
            ) else (
                echo [WARN] Tentative de reinstallation propre...
                rd /s /q "node_modules" 2>nul
                del /f /q "package-lock.json" 2>nul
                call npm install
                if %errorlevel% equ 0 (
                    echo [OK] %%S installé avec succès apres nettoyage!
                ) else (
                    echo [ERREUR] Échec de l'installation de %%S
                )
            )
        ) else (
            echo [AVERTISSEMENT] Pas de package.json trouvé dans %%S
        )
        
        REM Créer le fichier .env s'il n'existe pas
        if not exist ".env" (
            echo [INFO] Création du fichier .env pour %%S...
            (
                echo # Configuration de %%S
                echo MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/socialmedia?retryWrites=true^&w=majority
                echo PORT=
            ) > .env
            echo [INFO] Fichier .env créé. Veuillez le configurer avec votre MONGO_URI.
        ) else (
            echo [OK] Fichier .env déjà présent pour %%S
        )
    ) else (
        echo [AVERTISSEMENT] Dossier %%S non trouvé, ignoré.
    )
    echo.
)

cd /d "%BASE_DIR%"

echo ==========================================
echo    Installation terminée!
echo ==========================================
echo.
echo [IMPORTANT] Avant de démarrer l'application:
echo   1. Configurez le fichier .env de chaque service avec votre MONGO_URI
echo   2. Lancez start-app.bat pour démarrer tous les services
echo.
echo Ports utilisés:
echo   - Gateway:       4000
echo   - User Service:  5000
echo   - Post Service:  3001
echo   - Notification:  3002
echo   - Message:       3003
echo   - Comment:       3004
echo   - Story:         3005
echo   - Reaction:      3006
echo   - Frontend:      3000
echo.
pause
