require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const notificationRoutes = require('./notifications');
app.use('/', notificationRoutes);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Notification Service connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`🚀 Notification Service running on port ${PORT}`);
});
