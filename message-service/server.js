require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const messageRoutes = require('./messages');
app.use('/', messageRoutes);

mongoose.connect(process.env.MONGO_URI, { family: 4 })
    .then(() => console.log('✅ MongoDB Message Service connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`🚀 Message Service running on port ${PORT}`);
});
