
// Import d'Express et création du routeur
const express = require('express');
const router = express.Router();

// Import de Mongoose et bcrypt
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const notifBreaker = require('./utils/breaker');

// Définition du schéma User
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  avatar: { type: String },
  coverImage: { type: String },
  bio: { type: String, default: "" },
  password: { type: String, required: true },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
  timestamps: true // Ajoute createdAt et updatedAt automatiquement
});

// Création du modèle User
const User = mongoose.model('User', userSchema);

// =========================
// POST /api/register → inscription d'un utilisateur
// =========================
router.post('/register', async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    // Validation des champs requis
    if (!name || !username || !email || !password) {
      return res.status(400).json({
        error: 'Tous les champs sont requis'
      });
    }

    // Vérifier si l'email existe déjà
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        error: 'Cet email est déjà utilisé'
      });
    }

    // Vérifier si le username existe déjà
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        error: 'Ce nom d\'utilisateur est déjà pris'
      });
    }

    // Hacher le mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Créer le nouvel utilisateur
    const user = new User({
      name,
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    // Retourner l'utilisateur sans le mot de passe
    const userResponse = {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      coverImage: user.coverImage,
      bio: user.bio,
      createdAt: user.createdAt
    };

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: userResponse
    });

  } catch (err) {
    console.error('❌ Erreur lors de l\'inscription:', err);
    res.status(500).json({
      error: 'Erreur serveur lors de l\'inscription'
    });
  }
});

// =========================
// POST /api/login → connexion d'un utilisateur
// =========================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des champs requis
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email et mot de passe requis'
      });
    }

    // Trouver l'utilisateur par email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Email ou mot de passe incorrect'
      });
    }

    // Retourner l'utilisateur sans le mot de passe
    const userResponse = {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      coverImage: user.coverImage,
      bio: user.bio,
      createdAt: user.createdAt
    };

    res.json({
      message: 'Connexion réussie',
      user: userResponse
    });

  } catch (err) {
    console.error('❌ Erreur lors de la connexion:', err);
    res.status(500).json({
      error: 'Erreur serveur lors de la connexion'
    });
  }
});

// =========================
// GET /api/users/search?q=... → rechercher des utilisateurs
// =========================
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.json([]);

    // Rechercher par nom ou username (insensible à la casse)
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } }
      ]
    }).select('name username avatar bio').limit(10);

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// GET /api/users → récupérer tous les utilisateurs
// =========================
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclure les mots de passe
    res.json(users);
  } catch (err) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', err);
    res.status(500).json({
      error: 'Erreur serveur'
    });
  }
});

// =========================
// GET /api/users/username/:username → récupérer un utilisateur par son username
// =========================
router.get('/username/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('-password');
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// GET /api/users/:id → récupérer un utilisateur par ID
// =========================
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// GET /api/users/:id/followers → récupérer les abonnés d'un utilisateur
// =========================
router.get('/:id/followers', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('followers', 'name username avatar bio');
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    res.json(user.followers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// GET /api/users/:id/following → récupérer les abonnements d'un utilisateur
// =========================
router.get('/:id/following', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('following', 'name username avatar bio');
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    res.json(user.following);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// DELETE /api/users/:id → supprimer un utilisateur
// =========================
// =========================
// POST /:id/follow → suivre un utilisateur
// =========================
router.post('/:id/follow', async (req, res) => {
  if (req.body.userId === req.params.id) {
    return res.status(403).json({ error: "Vous ne pouvez pas vous suivre vous-même" });
  }
  try {
    const user = await User.findById(req.params.id);
    const currentUser = await User.findById(req.body.userId);

    if (!user || !currentUser) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    if (!user.followers.includes(req.body.userId)) {
      await user.updateOne({ $push: { followers: req.body.userId } });
      await currentUser.updateOne({ $push: { following: req.params.id } });

      // Envoyer une notification via Circuit Breaker
      notifBreaker.fire({
        userId: req.params.id,
        fromUserId: currentUser._id,
        type: 'follow',
        message: `${currentUser.name} a commencé à vous suivre.`
      }).catch(err => console.error("Circuit Breaker error details:", err.message));

      res.status(200).json({ message: "Utilisateur suivi" });
    } else {
      res.status(403).json({ error: "Vous suivez déjà cet utilisateur" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// =========================
// POST /:id/unfollow → ne plus suivre un utilisateur
// =========================
router.post('/:id/unfollow', async (req, res) => {
  if (req.body.userId === req.params.id) {
    return res.status(403).json({ error: "Vous ne pouvez pas vous ne plus suivre vous-même" });
  }
  try {
    const user = await User.findById(req.params.id);
    const currentUser = await User.findById(req.body.userId);

    if (!user || !currentUser) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    if (user.followers.includes(req.body.userId)) {
      await user.updateOne({ $pull: { followers: req.body.userId } });
      await currentUser.updateOne({ $pull: { following: req.params.id } });
      res.status(200).json({ message: "Utilisateur non suivi" });
    } else {
      res.status(403).json({ error: "Vous ne suivez pas cet utilisateur" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// =========================
// PUT /api/users/:id → mettre à jour le profil
// =========================
router.put('/:id', async (req, res) => {
  try {
    const { name, avatar, coverImage, bio } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (avatar) updateData.avatar = avatar;
    if (coverImage) updateData.coverImage = coverImage;
    if (bio !== undefined) updateData.bio = bio;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ status: 'deleted' });
  } catch (err) {
    console.error('❌ Erreur lors de la suppression:', err);
    res.status(500).json({
      error: 'Erreur serveur'
    });
  }
});

// Export du routeur
module.exports = router;
