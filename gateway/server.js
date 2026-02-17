
// Charger les variables d'environnement
require('dotenv').config();

// Importer Express et CORS
const express = require('express');
const cors = require('cors');

// Importer le proxy HTTP middleware
const { createProxyMiddleware } = require('http-proxy-middleware');

// Création de l'application Express
const app = express();
app.use(cors());

// IMPORTANT : Pas de body-parser global (express.json()) ici !
// Si on parse le JSON dans le Gateway, le flux est consommé et le proxy peut rester "bloqué" (stuck).
// Les microservices destinataires ont déjà leurs propres body-parsers.

// =========================
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

// Proxy vers le service Story (Port 3005)
app.use('/api/stories', createProxyMiddleware({
  target: 'http://localhost:3005',
  changeOrigin: true,
  pathRewrite: { '^/api/stories': '' }
}));

// Proxy vers le service Notification (Port 3002)
app.use('/api/notifications', createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: { '^/api/notifications': '' }
}));

// Proxy vers le service Message (Port 3003)
app.use('/api/messages', createProxyMiddleware({
  target: 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: { '^/api/messages': '' }
}));

// Proxy vers le service Comment (Port 3004)
app.use('/api/comments', createProxyMiddleware({
  target: 'http://localhost:3004',
  changeOrigin: true,
  pathRewrite: { '^/api/comments': '' }
}));

// Proxy vers le service Reaction (Port 3006)
app.use('/api/reactions', createProxyMiddleware({
  target: 'http://localhost:3006',
  changeOrigin: true,
  pathRewrite: { '^/api/reactions': '' }
}));

// Lancer le Gateway
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Gateway running on port ${PORT}`)
);
