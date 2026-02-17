require('dotenv').config();
const mongoose = require('mongoose');

// Reaction Schema (same as in reactions.js)
const reactionSchema = new mongoose.Schema({
    postId: { type: String, required: true },
    userId: { type: String, required: true },
    type: { type: String, default: 'like' },
}, { timestamps: true });

const Reaction = mongoose.model('Reaction', reactionSchema);

const seedReactions = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB reaction_db');

        // Clean existing reactions if any
        await Reaction.deleteMany({});
        console.log('🗑️  Existing reactions cleared');

        const sampleReactions = [
            {
                postId: 'post_65d1a1234567890123456781',
                userId: 'user_65d1a1234567890123456781',
                type: 'like'
            },
            {
                postId: 'post_65d1a1234567890123456781',
                userId: 'user_65d1a1234567890123456782',
                type: 'love'
            },
            {
                postId: 'post_65d1a1234567890123456782',
                userId: 'user_65d1a1234567890123456781',
                type: 'wow'
            }
        ];

        await Reaction.insertMany(sampleReactions);
        console.log('✨ Sample reactions added successfully!');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding reactions:', err);
        process.exit(1);
    }
};

seedReactions();
