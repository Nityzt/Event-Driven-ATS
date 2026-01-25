require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const { correlationId, morganLogger } = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const workflowRoutes = require('./routes/workflows');
const emailService = require('./services/emailService');
const mongoose = require('mongoose');
const { initializeWorkflows } = require('./services/workflowJobs');

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5001;

// Security + Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

// Rate Limiting
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, try again later.'
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logging
app.use(correlationId);
app.use(morganLogger);

// Health check
app.get('/healthz', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Backend is running',
        timestamp: new Date().toISOString(),
        database: 'connected',
        correlationId: req.correlationId
    });
});

// Initialize services
emailService.initialize().catch(console.error);
require('./services/matchListener'); // Only once

// API Routes
const matchRoutes = require('./routes/matches');
app.use('/api/matches', matchRoutes);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/candidates', require('./routes/candidates'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/workflows', workflowRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not Found'
    });
});

// MongoDB connection + workflow initialization
mongoose.connection.once('open', async () => {
    console.log('MongoDB Connected');
    await initializeWorkflows();
});

// Global Error Handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/healthz`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
['SIGTERM', 'SIGINT'].forEach(signal => {
    process.on(signal, () => {
        console.log(`${signal} received: closing HTTP server`);
        server.close(() => {
            console.log('HTTP server closed');
            process.exit(0);
        });
    });
});

module.exports = app;
