process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100
});
app.use(limiter);

// ✅ Database Connection (after dotenv)
console.log('Connecting to MongoDB...');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

mongoose
    .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        ssl: true,
        sslValidate: false,
    })
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// ✅ Load Routes safely
try {
    const authRoutes = require('./routes/auth');
    const womanRoutes = require('./routes/woman');
    const doctorRoutes = require('./routes/doctors');
    const nutritionRoutes = require('./routes/nutritionists');
    const pharmacyRoutes = require('./routes/pharmacy');
    const adminRoutes = require('./routes/admin');
    const appointmentRoutes = require('./routes/appointments');

    app.use('/api/auth', authRoutes);
    app.use('/api/woman', womanRoutes);
    app.use('/api/doctors', doctorRoutes);
    app.use('/api/nutritionists', nutritionRoutes);
    app.use('/api/pharmacy', pharmacyRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/appointments', appointmentRoutes);

    console.log('✅ All routes loaded successfully');
} catch (error) {
    console.error('❌ Error loading routes:', error);
}

// Health Check Route
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Women Healthcare Portal API is running',
        timestamp: new Date().toISOString()
    });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});
