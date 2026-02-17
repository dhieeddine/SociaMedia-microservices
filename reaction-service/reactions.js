const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Reaction Schema
const reactionSchema = new mongoose.Schema({
    postId: { type: String, required: true },
    userId: { type: String, required: true },
    type: { type: String, default: 'like' }, // e.g., 'like', 'love', 'haha', 'wow', 'sad', 'angry'
}, { timestamps: true });

// Ensure a user can only have one reaction per post
reactionSchema.index({ postId: 1, userId: 1 }, { unique: true });

const Reaction = mongoose.model('Reaction', reactionSchema);

// GET /api/reactions/post/:postId → Get all reactions for a post
router.get('/post/:postId', async (req, res) => {
    try {
        const reactions = await Reaction.find({ postId: req.params.postId });
        res.json(reactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/reactions/post/:postId/count → Get reaction counts by type
router.get('/post/:postId/count', async (req, res) => {
    try {
        const counts = await Reaction.aggregate([
            { $match: { postId: req.params.postId } },
            { $group: { _id: "$type", count: { $sum: 1 } } }
        ]);
        res.json(counts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/reactions → Add or Toggle a reaction
router.post('/', async (req, res) => {
    const { postId, userId, type } = req.body;

    if (!postId || !userId) {
        return res.status(400).json({ error: 'postId and userId are required' });
    }

    try {
        // Check if reaction already exists
        const existing = await Reaction.findOne({ postId, userId });

        if (existing) {
            if (existing.type === type) {
                // If same type, remove it (toggle off)
                await Reaction.findByIdAndDelete(existing._id);
                return res.json({ message: 'Reaction removed', action: 'removed' });
            } else {
                // If different type, update it
                existing.type = type || 'like';
                await existing.save();
                return res.json({ message: 'Reaction updated', action: 'updated', reaction: existing });
            }
        }

        // Create new reaction
        const newReaction = new Reaction({ postId, userId, type: type || 'like' });
        await newReaction.save();

        // Optional: Trigger notification via Notification Service (fetch call)
        // fetch('http://localhost:3002/', { ... })

        res.status(201).json({ message: 'Reaction added', action: 'added', reaction: newReaction });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
