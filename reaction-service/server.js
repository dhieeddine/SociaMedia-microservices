require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const reactionRoutes = require('./reactions');
app.use('/', reactionRoutes);

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Reaction Service connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Start Server
const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
    console.log(`🚀 Reaction Service running on port ${PORT}`);
});
