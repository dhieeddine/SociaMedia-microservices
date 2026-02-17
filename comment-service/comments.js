const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    postId: { type: String, required: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Comment = mongoose.model('Comment', commentSchema);

// Get comments for a post
router.get('/post/:postId', async (req, res) => {
    try {
        const comments = await Comment.find({ postId: req.params.postId }).sort({ createdAt: -1 });
        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a comment
router.post('/', async (req, res) => {
    try {
        const { postId, userId, username, content } = req.body;
        if (!content) return res.status(400).json({ error: "Content is required" });

        const newComment = new Comment({ postId, userId, username, content });
        await newComment.save();

        // Optional: Notify the post owner (logic could be added here to call notification-service)

        res.status(201).json(newComment);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete a comment
router.delete('/:id', async (req, res) => {
    try {
        await Comment.findByIdAndDelete(req.params.id);
        res.json({ status: 'deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
