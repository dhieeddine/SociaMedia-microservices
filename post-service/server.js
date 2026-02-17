require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const postRoutes = require('./posts');
app.use('/', postRoutes);

const storyRoutes = require('./stories');
app.use('/stories', storyRoutes);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Post Service connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Post Service running on port ${PORT}`);
});
