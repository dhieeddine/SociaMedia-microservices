const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Get messages between two users (simplified)
router.get('/:userId1/:userId2', async (req, res) => {
    try {
        const { userId1, userId2 } = req.params;
        const messages = await Message.find({
            $or: [
                { senderId: userId1, receiverId: userId2 },
                { senderId: userId2, receiverId: userId1 }
            ]
        }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Send a message
router.post('/', async (req, res) => {
    try {
        const { senderId, receiverId, content } = req.body;
        const newMessage = new Message({ senderId, receiverId, content });
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get conversations list (last messages) per user
router.get('/conversations/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        // Find all messages where user is sender or receiver
        const messages = await Message.find({
            $or: [{ senderId: userId }, { receiverId: userId }]
        }).sort({ createdAt: -1 });

        // Extract unique contact IDs
        const contacts = new Set();
        messages.forEach(msg => {
            contacts.add(msg.senderId === userId ? msg.receiverId : msg.senderId);
        });

        res.json(Array.from(contacts));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
