require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const {correlationId, morganLogger} = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

// Connect to Database

const app = express();
const PORT = process.env.PORT || 5001;

connectDB();

app.use(helmet());

app.use(cors({
    origin: process.env.FRONTEND_UR || 'http://localhost:5173',
    credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true, limit: '10mb'}));

// Request Logging
app.use(correlationId);
app.use(morganLogger);

//health check endpoint
app.get('/healthz', (req, res) => {
    res.json({
        status:'ok',
        message: 'Backend is running',
        timestamp: new Date().toISOString(),
        database: 'connected',
        correlationId: req.correlationId
    })
});

// API Routes
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/candidates', require('./routes/candidates'));
// app.use('/api/jobs', require('./routes/jobs'));
// app.use('/api/applications', require('./routes/applications'));
// app.use('/api/workflows', require('./routes/workflows'));
// app.use('/api/runs', require('./routes/runs'));

app.use((req,res) => {
    res.status(404).json({
        success: false,
        error: 'Not Found'
    });
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/healthz`);
    console.log(`Environment: ${process.env.NODE_ENV}`)
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        // Close DB connection if needed
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        // Close DB connection if needed
        process.exit(0);
    });
});

module.exports = app;