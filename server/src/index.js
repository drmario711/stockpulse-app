require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');
const createApiRouter = require('./routes/api');
const CronScheduler = require('./services/cronScheduler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
db.getDb();
console.log('✅ Database initialized');

// Initialize cron scheduler
const cronScheduler = new CronScheduler(db);

// API routes
app.use('/api', createApiRouter(db, cronScheduler));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    stocks_tracked: db.getAllStocks().length,
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'StockPulse API',
    version: '1.0.0',
    endpoints: [
      'GET /api/stocks',
      'GET /api/stocks/:ticker/news',
      'GET /api/stocks/:ticker/insiders',
      'GET /api/stocks/:ticker/institutions',
      'GET /api/stocks/:ticker/catalysts',
      'GET /api/stocks/:ticker/insights',
      'GET /api/stocks/:ticker/summary',
      'GET /api/news/recent',
      'GET /api/refresh-status',
      'POST /api/refresh',
      'POST /api/push-token',
      'DELETE /api/push-token',
      'GET /health',
    ],
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 StockPulse API running on port ${PORT}`);
  
  // Start cron jobs
  cronScheduler.start();
});

module.exports = app;
