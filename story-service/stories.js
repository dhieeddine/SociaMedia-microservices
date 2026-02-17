const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Story Schema with TTL (Time To Live) of 24 hours
const storySchema = new mongoose.Schema({
    userId: { type: String, required: true },
    content: { type: String },
    image: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 86400 } // 24 hours in seconds
});

const Story = mongoose.model('Story', storySchema);

// Get all active stories grouped by user
router.get('/', async (req, res) => {
    try {
        // Aggregate to group stories by user
        const stories = await Story.aggregate([
            {
                $sort: { createdAt: 1 }
            },
            {
                $group: {
                    _id: "$userId",
                    stories: { $push: "$$ROOT" },
                    latestStoryDate: { $max: "$createdAt" }
                }
            },
            {
                $sort: { latestStoryDate: -1 }
            }
        ]);
        res.json(stories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get stories by user
router.get('/user/:userId', async (req, res) => {
    try {
        const stories = await Story.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(stories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a story
router.post('/', async (req, res) => {
    try {
        const { userId, content, image } = req.body;
        if (!image) return res.status(400).json({ error: "Image required" });

        const newStory = new Story({ userId, content, image });
        await newStory.save();
        res.status(201).json(newStory);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete a story
router.delete('/:id', async (req, res) => {
    try {
        const story = await Story.findByIdAndDelete(req.params.id);
        if (!story) return res.status(404).json({ error: "Story not found" });
        res.json({ message: "Story deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
