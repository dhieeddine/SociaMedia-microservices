# Script d'installation des Microservices SocialMedia
# PowerShell Version

$ErrorActionPreference = "Continue"
$Host.UI.RawUI.WindowTitle = "Installation SocialMedia Microservices"

# Couleurs pour l'affichage
function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn { param($msg) Write-Host "[AVERTISSEMENT] $msg" -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host "[ERREUR] $msg" -ForegroundColor Red }

Write-Host "==========================================" -ForegroundColor Magenta
Write-Host "   Installation des Microservices SocialMedia" -ForegroundColor Magenta  
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host ""

# Chemin de base
$BaseDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Liste des services
$Services = @(
    "gateway",
    "user-service",
    "post-service",
    "notification-service",
    "message-service",
    "comment-service",
    "story-service",
    "reaction-service",
    "frontend"
)

# Ports associés
$Ports = @{
    "gateway" = 4000
    "user-service" = 5000
    "post-service" = 3001
    "notification-service" = 3002
    "message-service" = 3003
    "comment-service" = 3004
    "story-service" = 3005
    "reaction-service" = 3006
    "frontend" = 3000
}

# Vérification de Node.js
Write-Info "Vérification de Node.js..."
try {
    $nodeVersion = node -v
    $npmVersion = npm -v
    Write-Success "Node.js version: $nodeVersion"
    Write-Success "npm version: $npmVersion"
} catch {
    Write-Err "Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/"
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

Write-Host ""

# Demander le MONGO_URI
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "   Configuration MongoDB" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host ""
$MongoUri = Read-Host "Entrez votre MONGO_URI (ou appuyez sur Entrée pour utiliser le placeholder)"
if ([string]::IsNullOrWhiteSpace($MongoUri)) {
    $MongoUri = "mongodb+srv://username:password@cluster.mongodb.net/socialmedia?retryWrites=true&w=majority"
    Write-Warn "Utilisation du placeholder. N'oubliez pas de configurer votre MONGO_URI plus tard!"
}

Write-Host ""

# Installation des services
$successCount = 0
$failCount = 0

foreach ($service in $Services) {
    Write-Host "==========================================" -ForegroundColor Blue
    Write-Host "   Installation de $service" -ForegroundColor Blue
    Write-Host "==========================================" -ForegroundColor Blue
    
    $servicePath = Join-Path $BaseDir $service
    
    if (Test-Path $servicePath) {
        Set-Location $servicePath
        
        if (Test-Path "package.json") {
            Write-Info "Exécution de npm install dans $service..."
            
            # Exécuter npm install
            $process = Start-Process -FilePath "npm" -ArgumentList "install" -Wait -NoNewWindow -PassThru
            
            if ($process.ExitCode -eq 0) {
                Write-Success "$service installé avec succès!"
                $successCount++
            } else {
                Write-Err "Échec de l'installation de $service"
                $failCount++
            }
            
            # Créer le fichier .env s'il n'existe pas
            $envPath = Join-Path $servicePath ".env"
            if (-not (Test-Path $envPath)) {
                $port = $Ports[$service]
                $envContent = @"
# Configuration de $service
MONGO_URI=$MongoUri
PORT=$port
JWT_SECRET=votre_secret_jwt_super_securise
"@
                Set-Content -Path $envPath -Value $envContent
                Write-Info "Fichier .env créé pour $service (Port: $port)"
            } else {
                Write-Success "Fichier .env déjà présent pour $service"
            }
        } else {
            Write-Warn "Pas de package.json trouvé dans $service"
        }
    } else {
        Write-Warn "Dossier $service non trouvé, ignoré."
    }
    
    Write-Host ""
}

# Retour au répertoire de base
Set-Location $BaseDir

# Résumé
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host "   Installation terminée!" -ForegroundColor Magenta
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host ""
Write-Success "Services installés avec succès: $successCount"
if ($failCount -gt 0) {
    Write-Err "Services en échec: $failCount"
}

Write-Host ""
Write-Host "[IMPORTANT] Avant de démarrer l'application:" -ForegroundColor Yellow
Write-Host "  1. Vérifiez que le fichier .env de chaque service contient votre MONGO_URI" -ForegroundColor Yellow
Write-Host "  2. Lancez start-app.bat pour démarrer tous les services" -ForegroundColor Yellow
Write-Host ""
Write-Host "Ports utilisés:" -ForegroundColor Cyan
Write-Host "  - Gateway:       4000"
Write-Host "  - User Service:  5000"
Write-Host "  - Post Service:  3001"
Write-Host "  - Notification:  3002"
Write-Host "  - Message:       3003"
Write-Host "  - Comment:       3004"
Write-Host "  - Story:         3005"
Write-Host "  - Reaction:      3006"
Write-Host "  - Frontend:      3000"
Write-Host ""

Read-Host "Appuyez sur Entrée pour terminer"
