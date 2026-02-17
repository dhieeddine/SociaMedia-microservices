# Nouvelle Architecture Microservices

Ce projet a été divisé en plusieurs microservices autonomes, chacun gérant un domaine spécifique et connecté à MongoDB Atlas.

## Structure des Services

1.  **Gateway (API Gateway)**
    *   **Port** : Défini dans `.env` (ex: 4000)
    *   **Rôle** : Point d'entrée unique pour le frontend. Redirige les requêtes vers les services appropriés.
    *   **Routes** :
        *   `/api/users` -> `user-service` (Port 5000)
        *   `/api/posts` -> `post-service` (Port 3001)
        *   `/api/notifications` -> `notification-service` (Port 3002)
        *   `/api/messages` -> `message-service` (Port 3003)
        *   `/api/comments` -> `comment-service` (Port 3004)
        *   `/api/stories` -> `story-service` (Port 3005)
        *   `/api/reactions` -> `reaction-service` (Port 3006)

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

## Instructions d'installation

Pour chaque dossier de service (`post-service`, `notification-service`, `message-service`, `user-service`, `gateway`), vous devez :

1.  Ouvrir un terminal dans le dossier.
2.  Lancer `npm install`.
3.  Créer un fichier `.env` à partir du `.env.example` et y mettre votre `MONGO_URI`.
4.  Lancer le service avec `npm start`.

## Utilisation avec le Frontend

Le frontend doit maintenant pointer vers la **Gateway** au lieu de pointer directement vers le `user-service`.
Modifiez `frontend/public/js/auth.js` (et autres fichiers JS) pour utiliser l'URL de la Gateway (ex: `http://localhost:4000/api`) au lieu de `http://localhost:5000/api`.
