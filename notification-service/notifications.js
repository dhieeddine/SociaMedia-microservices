const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Destinataire
    fromUserId: { type: String },           // Expéditeur
    type: { type: String, enum: ['follow', 'like', 'message', 'other'], default: 'other' },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

// Get notifications for a user
router.get('/:userId', async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a notification
router.post('/', async (req, res) => {
    try {
        const { userId, fromUserId, type, message } = req.body;
        const newNotification = new Notification({ userId, fromUserId, type, message });
        await newNotification.save();
        res.status(201).json(newNotification);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Mark as read
router.put('/:id/read', async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { read: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
