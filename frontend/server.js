require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();

// Configuration EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Middleware pour parser JSON et formulaires
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================
// ROUTES
// ==================

// Page d'accueil - Feed
app.get('/', (req, res) => {
  res.render('feed', { title: 'Accueil' });
});

// Page de connexion
app.get('/login', (req, res) => {
  res.render('login', { title: 'Connexion' });
});

// Page d'inscription
app.get('/register', (req, res) => {
  res.render('register', { title: 'Inscription' });
});

// Page de profil
app.get('/profile/:username?', (req, res) => {
  const username = req.params.username || 'utilisateur';
  res.render('profile', { title: 'Profil', username });
});


// Nouvelles routes pour la Sidebar
app.get('/messages', (req, res) => {
  res.render('messages', { title: 'Messages' });
});

app.get('/notifications', (req, res) => {
  res.render('notifications', { title: 'Notifications' });
});

app.get('/explorer', (req, res) => {
  res.render('explorer', { title: 'Explorer', query: req.query.q || '' });
});

app.get('/saved', (req, res) => {
  res.render('saved', { title: 'Enregistrés' });
});

app.get('/groups', (req, res) => {
  res.render('groups', { title: 'Groupes' });
});

app.get('/settings', (req, res) => {
  res.render('settings', { title: 'Paramètres' });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Frontend running on http://localhost:${PORT}`);
});
