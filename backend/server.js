require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const { correlationId, morganLogger } = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const emailService = require('./services/emailService');
const metrics = require('./services/metrics');
const mongoose = require('mongoose');
const { initializeWorkflows } = require('./services/workflowJobs');

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5001;

// Security + OWASP headers
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' }
});

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many auth attempts, please try again later.' }
});

app.use(generalLimiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging + correlation IDs
app.use(correlationId);
app.use(morganLogger);

// Health check
app.get('/healthz', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    correlationId: req.correlationId
  });
});

// Metrics (basic counters)
app.get('/metrics', (req, res) => {
  res.json({ success: true, data: metrics });
});

// Initialize services
emailService.initialize().catch(console.error);
require('./services/matchListener'); // register event listeners once

// API Routes
app.use('/api/auth',         authLimiter, require('./routes/auth'));
app.use('/api/candidates',   require('./routes/candidates'));
app.use('/api/jobs',         require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/matches',      require('./routes/matches'));
app.use('/api/workflows',    require('./routes/workflows'));
app.use('/api/runs',         require('./routes/runs'));
app.use('/api/audit-logs',   require('./routes/auditLogs'));

// Webhook echo endpoint — demonstrates external calls & retry behaviour
app.post('/webhook/echo', (req, res) => {
  console.log('[Webhook Echo]', JSON.stringify(req.body, null, 2));
  res.json({ received: true, payload: req.body, timestamp: new Date().toISOString() });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not Found' });
});

// MongoDB connected → start Agenda
mongoose.connection.once('open', async () => {
  console.log('MongoDB Connected');
  await initializeWorkflows();
});

// Global Error Handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/healthz`);
  console.log(`Metrics: http://localhost:${PORT}/metrics`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
['SIGTERM', 'SIGINT'].forEach(signal => {
  process.on(signal, () => {
    console.log(`${signal} received: closing server`);
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});

module.exports = app;
