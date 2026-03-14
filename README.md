# Architecture et Patterns Microservices - SocialMedia-app

## Table des Matières

1. [Architecture & Services](#1-architecture--services)
2. [Structure Initiale et Patterns Microservices](#2-structure-initiale-et-patterns-microservices)
3. [Schéma Global et Résumé de l'Architecture](#3-schéma-global-et-résumé-de-larchitecture)
4. [Architecture des Bases de Données](#4-architecture-des-bases-de-données-modèles--relations-logiques)
5. [Architecture Cloud & Déploiement](#5-architecture-cloud--déploiement-mongodb-atlas)
6. [Guide d'Installation et de Démarrage](#6-guide-dinstallation-et-de-démarrage)

---

## 1. Architecture & Services

L'application **SocialMedia** repose sur une architecture orientée microservices (Microservices Architecture). Le monolythe a été décomposé en 7 services autonomes (`gateway`, `user-service`, `post-service`, `notification-service`, `message-service`, `comment-service`, `story-service` et `reaction-service`). 
Cette décomposition permet un déploiement indépendant, une scalabilité ciblée par domaine (ex: scalabilité spécifique du `post-service`), et une séparation claire des responsabilités métier liées à la manipulation des données.

Chaque microservice gère un domaine spécifique et est connecté à MongoDB Atlas :

1.  **Gateway (API Gateway)**
    *   **Port** : Défini dans `.env` (ex: 4000)
    *   **Rôle** : Point d'entrée unique pour le frontend. Redirige les requêtes vers les services appropriés.
    *   **Routes** : `/api/users`, `/api/posts`, `/api/notifications`, `/api/messages`, etc.

2.  **User Service** (`user-service`)
    *   **Port** : 5000
    *   **Fonctions** : Inscription, Connexion, Profils, Follows.

3.  **Post Service** (`post-service`)
    *   **Port** : 3001
    *   **Fonctions** : Création de posts, Fil d'actualité.

4.  **Notification Service** (`notification-service`)
    *   **Port** : 3002
    *   **Fonctions** : Alertes en temps réel.

5.  **Message Service** (`message-service`)
    *   **Port** : 3003
    *   **Fonctions** : Messagerie instantanée.

6.  **Comment Service** (`comment-service`)
    *   **Port** : 3004
    *   **Fonctions** : Commentaires sur les posts.

7.  **Story Service** (`story-service`)
    *   **Port** : 3005
    *   **Fonctions** : Stories temporaires.

8.  **Reaction Service** (`reaction-service`)
    *   **Port** : 3006
    *   **Fonctions** : Likes et réactions sur les posts.

### Structure du Projet
```text
SociaMedia-microservices/
├── comment-service/        # Service de gestion des commentaires
├── frontend/               # Application cliente (Interface Utilisateur NodeJS/EJS)
├── gateway/                # API Gateway et routage centralisé
├── message-service/        # Service de messagerie instantanée
├── notification-service/   # Service de notifications
├── post-service/           # Service de gestion des publications
├── reaction-service/       # Service de gestion des réactions (likes)
├── story-service/          # Service de gestion des stories
├── user-service/           # Service de gestion des utilisateurs
├── install-app.bat         # Script d'installation des dépendances
├── start-app.bat           # Script de démarrage de tous les services
├── stop-app.bat            # Script d'arrêt des services
└── README.md               # Documentation
```

## 2. Structure Initiale et Patterns Microservices

### A. API Gateway Pattern
**Rôle :**
Le composant `gateway` sert de point d'entrée unique (Single Point of Entry) pour tous les clients front-end. Il reçoit les requêtes, gère les politiques de sécurité (comme CORS) et route intelligemment les appels réseau (Reverse Proxy) vers l'instance du microservice appropriée en fonction du chemin d'API (`/api/...`).

**Avantages :** 
Ce pattern empêche l'application cliente d'avoir à connaître les adresses IP et ports spécifiques de chaque microservice. Il centralise le routage et simplifie considérablement la configuration côté Frontend.

**Capture du code (`gateway/server.js`) :**
```javascript
// Création de l'application Express
const app = express();
app.use(cors());

// Proxy vers le service User (Port 5000)
app.use('/api/users', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  pathRewrite: { '^/api/users': '' }
}));

// Proxy vers le service Post (Port 3001)
app.use('/api/posts', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: { '^/api/posts': '' }
}));

// ... Autres routes proxy ...
```

### B. Database per Service Pattern (Base de données par Microservice)
**Rôle :**
Afin de préserver l'intégrité de l'architecture microservice et assurer un couplage lâche (loose coupling), chaque microservice dispose de sa propre base de données isolée et de ses propres modèles de données. 

**Avantages :** 
Si la base de données des posts (post_db) rencontre une défaillance ou demande une opération de maintenance, le service utilisateur (user-service) qui manipule user_db n'est pas affecté. Cela favorise l'isolation totale des services.

**Captures du code (Configuration `user-service/.env` vs `post-service/.env`) :**

`user-service/.env` :
```env
MONGO_URI=mongodb+srv://dhia_db:root@cluster0.xtxby2e.mongodb.net/user_db?appName=Cluster0&retryWrites=true&w=majority
PORT=5000
```

`post-service/.env` :
```env
MONGO_URI=mongodb+srv://dhia_db:root@cluster0.xtxby2e.mongodb.net/post_db?appName=Cluster0&retryWrites=true&w=majority
PORT=3001
```

### C. Pattern de Timeout / Résilience (Inter-Service Communication)
**Rôle :**
Lorsqu'un service doit effectuer un appel HTTP vers un autre service (par exemple, le `user-service` qui notifie le `notification-service` lors d'un 'Follow'), l'appel asynchrone est sécurisé en utilisant un délai d'expiration défini (Timeout Pattern) à l'aide d'un `AbortController`.

**Avantages :** 
Ce mécanisme protecteur empêche une panne en cascade. Si le service de notification est défaillant ou lent, le processus dans le `user-service` n'attendra pas indéfiniment. Au bout de 2 secondes, la requête est annulée, garantissant que le `user-service` continue de répondre rapidement aux utilisateurs pour d'autres fonctionnalités.

**Capture du code (`user-service/users.js`) :**
```javascript
// Envoyer une notification (Non-bloquant avec limitation de temps)
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 secondes max

const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3002/';

fetch(notificationUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: req.params.id,
    fromUserId: currentUser._id,
    type: 'follow',
    message: `${currentUser.name} a commencé à vous suivre.`
  }),
  signal: controller.signal // Injection du Timeout via signal
}).then(() => clearTimeout(timeoutId))
  .catch(err => console.error("Erreur notification follow:", err.message));
```

## 3. Schéma Global et Résumé de l'Architecture
Le flux réseau complet de l'application cliente jusqu'aux bases de données se présente comme suit :

```mermaid
flowchart TD
    %% Couche Client
    Client[📱 Frontend Client]

    %% Couche Gateway
    Gateway{🌐 API Gateway Routage Centralisé}

    %% Couche Services
    subgraph Services ["Microservices (Backend)"]
        UserS[👤 User Service]
        PostS[📝 Post Service]
        NotifS[🔔 Notification Service]
        MsgS[💬 Message Service]
        CommentS[🗣️ Comment Service]
        StoryS[📸 Story Service]
        ReactS[❤️ Reaction Service]
    end

    %% Couche Bases de données
    subgraph Databases ["Bases de Données (MongoDB)"]
        UserDB[(user_db)]
        PostDB[(post_db)]
        NotifDB[(notif_db)]
        MsgDB[(message_db)]
        CommentDB[(comment_db)]
        StoryDB[(story_db)]
        ReactDB[(reaction_db)]
    end

    %% Connexions Client -> Gateway
    Client -- "HTTP Requests" --> Gateway

    %% Connexions Gateway -> Services
    Gateway -- "/api/users" --> UserS
    Gateway -- "/api/posts" --> PostS
    Gateway -- "/api/notifications" --> NotifS
    Gateway -- "/api/messages" --> MsgS
    Gateway -- "/api/comments" --> CommentS
    Gateway -- "/api/stories" --> StoryS
    Gateway -- "/api/reactions" --> ReactS

    %% Communications Inter-Services (Exemples)
    UserS -. "Evénement (ex: Follow)" .-> NotifS
    PostS -. "Evénement (ex: New Post)" .-> NotifS

    %% Connexions Services -> Bases de données
    UserS --> UserDB
    PostS --> PostDB
    NotifS --> NotifDB
    MsgS --> MsgDB
    CommentS --> CommentDB
    StoryS --> StoryDB
    ReactS --> ReactDB

    %% Styles
    classDef client fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef gateway fill:#ff9900,stroke:#333,stroke-width:2px,color:#000;
    classDef service fill:#4285f4,stroke:#333,stroke-width:2px,color:#fff;
    classDef database fill:#0f9d58,stroke:#333,stroke-width:2px,color:#fff;

    class Client client;
    class Gateway gateway;
    class UserS,PostS,NotifS,MsgS,CommentS,StoryS,ReactS service;
    class UserDB,PostDB,NotifDB,MsgDB,CommentDB,StoryDB,ReactDB database;
```

## 4. Architecture des Bases de Données (Modèles & Relations Logiques)
Bien que chaque microservice possède sa propre base de données isolée et indépendante, il y a des relations indirectes (referential keys) entre les entités (ex: un Post stocke l'ID de son auteur User).

Voici un diagramme Entité-Relation (ER Diagram) représentant la structure conceptuelle des données réparties sur les différents services :

```mermaid
erDiagram
    %% Service: user-service (user_db)
    USER {
        ObjectId _id PK
        String name
        String email
        String password
        String profilePic
        Array followers "Ref: USER"
        Array following "Ref: USER"
        Date createdAt
    }

    %% Service: post-service (post_db)
    POST {
        ObjectId _id PK
        ObjectId userId FK "Ref: USER"
        String text
        String mediaUrl
        Array likes "Ref: USER"
        Date createdAt
    }

    %% Service: comment-service (comment_db)
    COMMENT {
        ObjectId _id PK
        ObjectId postId FK "Ref: POST"
        ObjectId userId FK "Ref: USER"
        String text
        Date createdAt
    }

    %% Service: message-service (message_db)
    MESSAGE {
        ObjectId _id PK
        ObjectId senderId FK "Ref: USER"
        ObjectId receiverId FK "Ref: USER"
        String content
        Boolean isRead
        Date timestamp
    }

    %% Service: notification-service (notif_db)
    NOTIFICATION {
        ObjectId _id PK
        ObjectId userId FK "Ref: USER"
        ObjectId fromUserId "Ref: USER"
        String type "follow, like, comment"
        String message
        Boolean isRead
        Date createdAt
    }

    %% Service: story-service (story_db)
    STORY {
        ObjectId _id PK
        ObjectId userId FK "Ref: USER"
        String mediaUrl
        Date expiresAt
        Date createdAt
    }

    %% Service: reaction-service (reaction_db)
    REACTION {
        ObjectId _id PK
        ObjectId targetId "Ref: POST / COMMENT"
        ObjectId userId FK "Ref: USER"
        String type "like, love, haha, etc."
        Date createdAt
    }

    %% Relations "Logiques" (Cross-Database)
    USER ||--o{ POST : "publie"
    USER ||--o{ COMMENT : "écrit"
    USER ||--o{ MESSAGE : "envoie/reçoit"
    USER ||--o{ NOTIFICATION : "reçoit"
    USER ||--o{ STORY : "poste"
    USER ||--o{ REACTION : "ajoute"
    POST ||--o{ COMMENT : "possède"
    POST ||--o{ REACTION : "reçoit"
```

## 5. Architecture Cloud & Déploiement (MongoDB Atlas)
Ce diagramme illustre de façon plus large comment l'application est structurée dans un environnement Cloud. Il met en évidence la séparation nette entre le calcul (les microservices hébergés sur un fournisseur Cloud) et le stockage (les bases de données gérées par MongoDB Atlas).

```mermaid
flowchart TB
    %% Utilisateurs
    Client["📱 Clients Internet (Navigateur / Mobile)"]

    %% Fournisseur Cloud (Hébergement backend)
    subgraph CloudVPC ["☁️ Cloud Provider (ex: AWS, Heroku, Render)"]
        direction TB
        Gateway{"🌐 API Gateway \n Load Balancer"}
        
        subgraph Cluster ["⚙️ Cluster de Microservices (Docker / Conteneurs)"]
            UserS[User Service]
            PostS[Post Service]
            NotifS[Notification Service]
            MsgS[Message Service]
            CommentS[Comment Service]
            StoryS[Story Service]
            ReactS[Reaction Service]
        end
    end

    %% MongoDB Atlas (DBaaS)
    subgraph MongoAtlas ["🍃 MongoDB Atlas (Cloud Database as a Service)"]
        direction TB
        DBCluster[(Cluster MongoDB \n Cloud Réparti)]
        
        subgraph Databases ["Bases de données isolées (Logiquement)"]
            UserDB[(user_db)]
            PostDB[(post_db)]
            NotifDB[(notif_db)]
            MsgDB[(message_db)]
            CommentDB[(comment_db)]
            StoryDB[(story_db)]
            ReactDB[(reaction_db)]
        end
        DBCluster -.- Databases
    end

    %% Connexions Externes vers Internes
    Client -- "HTTPS / Securisé" --> Gateway
    Gateway ==> Cluster
    
    %% Lien explicite entre les sous-graphes principaux pour forcer la superposition verticale
    CloudVPC ===> MongoAtlas
    
    %% Connexions internes pour MongoDB Atlas (invisibles pour le positionnement)
    DBCluster ~~~ Databases
    
    %% Connexions Cluster (Backend) vers MongoDB Atlas
    UserS -.-> UserDB
    PostS -.-> PostDB
    NotifS -.-> NotifDB
    MsgS -.-> MsgDB
    CommentS -.-> CommentDB
    StoryS -.-> StoryDB
    ReactS -.-> ReactDB

    %% Styling des boîtes pour un aspect plus professionnel
    classDef client fill:#f9f9f9,stroke:#333,stroke-width:2px,color:#000;
    classDef cloud fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,stroke-dasharray: 5 5,color:#000;
    classDef cluster fill:#bbdefb,stroke:#0288d1,stroke-width:2px,color:#000;
    classDef atlas fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,stroke-dasharray: 5 5,color:#000;
    classDef mongo fill:#4caf50,stroke:#fff,stroke-width:2px,color:#fff;
    classDef gateway fill:#ff9900,stroke:#fff,stroke-width:2px,color:#000;
    classDef service fill:#4285f4,stroke:#fff,stroke-width:2px,color:#fff;

    class Client client;
    class CloudVPC cloud;
    class Cluster cluster;
    class MongoAtlas atlas;
    class UserDB,PostDB,NotifDB,MsgDB,CommentDB,StoryDB,ReactDB,DBCluster mongo;
    class Gateway gateway;
    class UserS,PostS,NotifS,MsgS,CommentS,StoryS,ReactS service;
```
## 6. Guide d'Installation et de Démarrage

### Installation automatique (Recommandé)

Utilisez l'un des scripts d'installation fournis à la racine du projet :

**Option 1 - Script Batch (Simple)**
```bash
install-app.bat
```

**Option 2 - Script PowerShell (Avancé - avec configuration interactive)**
```powershell
.\install-app.ps1
```

Ces scripts vont :
- Vérifier que Node.js est installé
- Exécuter `npm install` dans tous les services
- Créer les fichiers `.env` avec les ports appropriés

### Installation manuelle

Pour chaque dossier de service (`post-service`, `notification-service`, `message-service`, `user-service`, `gateway`), vous devez :

1.  Ouvrir un terminal dans le dossier.
2.  Lancer `npm install`.
3.  Créer un fichier `.env` et y mettre votre `MONGO_URI`.
4.  Lancer le service avec `npm start`.

### Démarrage de l'application

Après l'installation, utilisez l'un des scripts pour tout lancer ou tout arrêter en une seule commande :
```bash
start-app.bat    # Démarre tous les services (Frontend + Microservices)
stop-app.bat     # Arrête tous les services d'un coup
```

L'application Frontend sera disponible sur **http://localhost:3000** et routera toutes ses requêtes backend intelligemment vers la Gateway !
