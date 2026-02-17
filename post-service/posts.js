const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    content: { type: String },
    image: { type: String },
    video: { type: String },
    sharedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }, // Référence au post original
    shares: [{ type: String }], // IDs des utilisateurs ayant partagé
    likes: [{ type: String }],
    reactions: [
        {
            userId: String,
            username: String,
            type: { type: String, enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'], default: 'like' }
        }
    ],
    createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

// Get all posts (with population for shared posts)
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('sharedFrom')
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get posts by user
router.get('/user/:userId', async (req, res) => {
    try {
        const posts = await Post.find({ userId: req.params.userId })
            .populate('sharedFrom')
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a post
router.post('/', async (req, res) => {
    try {
        const { userId, content, image, video } = req.body;
        const newPost = new Post({ userId, content, image, video });
        await newPost.save();
        res.status(201).json(newPost);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Like/Unlike a post
router.put('/:id/like', async (req, res) => {
    try {
        const { userId } = req.body;
        const post = await Post.findById(req.params.id);

        if (!post) return res.status(404).json({ error: "Post non trouvé" });

        // Conversion de sécurité pour les anciens posts
        if (!Array.isArray(post.likes)) {
            await Post.findByIdAndUpdate(req.params.id, { $set: { likes: [] } });
            post.likes = [];
        }

        const isLiked = post.likes.includes(userId);
        const update = isLiked
            ? { $pull: { likes: userId } }
            : { $addToSet: { likes: userId } };

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true }
        );

        res.status(200).json(updatedPost);
    } catch (err) {
        console.error("Erreur Like/Unlike:", err);
        res.status(500).json({ error: err.message });
    }
});

// React to a post
router.put('/:id/react', async (req, res) => {
    try {
        const { userId, username, type } = req.body;

        await Post.findByIdAndUpdate(
            req.params.id,
            { $pull: { reactions: { userId: userId } } }
        );

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            { $push: { reactions: { userId, username, type } } },
            { new: true }
        );

        res.status(200).json(updatedPost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Share a post
router.post('/:id/share', async (req, res) => {
    try {
        const { userId } = req.body;
        const originalPost = await Post.findById(req.params.id);

        if (!originalPost) return res.status(404).json({ error: "Post original non trouvé" });

        // Créer un nouveau post qui pointe vers l'original
        const sharedPost = new Post({
            userId,
            sharedFrom: originalPost._id,
            content: req.body.content || "" // Optionnel : commentaire de l'utilisateur qui partage
        });

        await sharedPost.save();

        // Mettre à jour le compteur de partages sur le post original
        await Post.findByIdAndUpdate(req.params.id, { $addToSet: { shares: userId } });

        res.status(201).json(sharedPost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
