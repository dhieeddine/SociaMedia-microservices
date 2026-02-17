
// Chargement des variables d’environnement (.env)
require('dotenv').config();

// Import des dépendances
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Initialisation de l’application Express
const app = express();

// Middlewares globaux
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Import des routes utilisateurs
const userRoutes = require('./users');
app.use('/', userRoutes);

// Connexion à MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() =>
    console.log('✅ MongoDB User connected')
  )
  .catch(err =>
    console.log('❌ MongoDB User error:', err)
  );

// Lancement du serveur
app.listen(process.env.PORT, () => {
  console.log(
    `User Service running on port ${process.env.PORT}`
  );
});
