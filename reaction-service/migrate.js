require('dotenv').config();
const mongoose = require('mongoose');

// Post Schema (Minimal for migration)
const postSchema = new mongoose.Schema({
    reactions: [
        {
            userId: String,
            type: String
        }
    ]
});

// Reaction Schema
const reactionSchema = new mongoose.Schema({
    postId: { type: String, required: true },
    userId: { type: String, required: true },
    type: { type: String, default: 'like' },
}, { timestamps: true });

const migrate = async () => {
    try {
        // Use environment variables - NEVER hardcode credentials!
        const postUri = process.env.POST_DB_URI || process.env.MONGO_URI;
        const reactionUri = process.env.MONGO_URI;

        if (!postUri || !reactionUri) {
            console.error('❌ Missing MONGO_URI or POST_DB_URI in .env file');
            process.exit(1);
        }

        console.log('Connecting to Post DB...');
        const postConn = await mongoose.createConnection(postUri).asPromise();
        const Post = postConn.model('Post', postSchema);

        console.log('Connecting to Reaction DB...');
        const reactionConn = await mongoose.createConnection(reactionUri).asPromise();
        const Reaction = reactionConn.model('Reaction', reactionSchema);

        const posts = await Post.find({});
        console.log(`Found ${posts.length} posts to process.`);

        let migratedCount = 0;
        for (const post of posts) {
            console.log(`Processing post ${post._id}: likes=${post.likes?.length || 0}, reactions=${post.reactions?.length || 0}`);
            // Migrate "likes" array
            if (post.likes && post.likes.length > 0) {
                for (const userId of post.likes) {
                    await Reaction.findOneAndUpdate(
                        { postId: post._id.toString(), userId: userId },
                        { type: 'like' },
                        { upsert: true, new: true }
                    );
                    migratedCount++;
                }
            }

            // Migrate "reactions" array
            if (post.reactions && post.reactions.length > 0) {
                for (const r of post.reactions) {
                    if (r.userId) {
                        await Reaction.findOneAndUpdate(
                            { postId: post._id.toString(), userId: r.userId },
                            { type: r.type || 'like' },
                            { upsert: true, new: true }
                        );
                        migratedCount++;
                    }
                }
            }
        }

        console.log(`✅ Migration complete! ${migratedCount} reactions processed.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
};

migrate();
