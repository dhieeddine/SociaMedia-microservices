require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const commentRoutes = require('./comments');
app.use('/', commentRoutes);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Comment connected'))
    .catch(err => console.log('❌ MongoDB Comment error:', err));

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
    console.log(`Comment Service running on port ${PORT}`);
});
