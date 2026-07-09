const express = require('express');
const router = express.Router();

module.exports = function createApiRouter(db, cronScheduler) {
  // GET /api/stocks - all tracked stocks with summary
  router.get('/stocks', (req, res) => {
    try {
      const stocks = db.getAllStocks();
      const result = stocks.map(stock => {
        const summary = db.getStockSummary(stock.ticker);
        return { ...stock, ...summary };
      });
      res.json({ stocks: result, count: result.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/stocks/:ticker/news - news for a ticker
  router.get('/stocks/:ticker/news', (req, res) => {
    try {
      const { ticker } = req.params;
      const { limit = 50, since } = req.query;
      const news = db.getNewsByTicker(ticker.toUpperCase(), parseInt(limit), since || null);
      res.json({ ticker, news, count: news.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/stocks/:ticker/insiders - insider transactions
  router.get('/stocks/:ticker/insiders', (req, res) => {
    try {
      const { ticker } = req.params;
      const { limit = 30 } = req.query;
      const insiders = db.getInsidersByTicker(ticker.toUpperCase(), parseInt(limit));
      res.json({ ticker, insiders, count: insiders.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/stocks/:ticker/institutions - institutional holdings
  router.get('/stocks/:ticker/institutions', (req, res) => {
    try {
      const { ticker } = req.params;
      const { limit = 30 } = req.query;
      const institutions = db.getInstitutionsByTicker(ticker.toUpperCase(), parseInt(limit));
      res.json({ ticker, institutions, count: institutions.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/stocks/:ticker/catalysts - future catalysts
  router.get('/stocks/:ticker/catalysts', (req, res) => {
    try {
      const { ticker } = req.params;
      const catalysts = db.getCatalystsByTicker(ticker.toUpperCase());
      res.json({ ticker, catalysts, count: catalysts.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/stocks/:ticker/insights - nedopalky
  router.get('/stocks/:ticker/insights', (req, res) => {
    try {
      const { ticker } = req.params;
      const insights = db.getInsightsByTicker(ticker.toUpperCase());
      res.json({ ticker, insights, count: insights.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/stocks/:ticker/summary - complete stock summary
  router.get('/stocks/:ticker/summary', (req, res) => {
    try {
      const { ticker } = req.params;
      const upperTicker = ticker.toUpperCase();
      const stocks = db.getAllStocks();
      const stock = stocks.find(s => s.ticker === upperTicker);
      if (!stock) {
        return res.status(404).json({ error: `Ticker ${upperTicker} not found` });
      }

      const summary = db.getStockSummary(upperTicker);
      const news = db.getNewsByTicker(upperTicker, 20);
      const insiders = db.getInsidersByTicker(upperTicker, 10);
      const institutions = db.getInstitutionsByTicker(upperTicker, 10);
      const catalysts = db.getCatalystsByTicker(upperTicker);
      const insights = db.getInsightsByTicker(upperTicker);

      res.json({
        stock,
        summary,
        news,
        insiders,
        institutions,
        catalysts,
        insights,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/news/recent - all recent news across all tickers
  router.get('/news/recent', (req, res) => {
    try {
      const { limit = 100, since } = req.query;
      const news = db.getAllRecentNews(parseInt(limit), since || null);
      res.json({ news, count: news.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/refresh-status - last refresh info
  router.get('/refresh-status', (req, res) => {
    try {
      const lastRefresh = db.getLastRefresh();
      res.json({
        last_refresh: lastRefresh || null,
        is_running: cronScheduler.isRunning,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/refresh - manual trigger
  router.post('/refresh', async (req, res) => {
    try {
      if (cronScheduler.isRunning) {
        return res.status(409).json({ error: 'Refresh already in progress' });
      }
      // Start refresh in background
      const resultPromise = cronScheduler.runFullRefresh();
      res.json({ message: 'Refresh started', status: 'running' });
      await resultPromise;
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/push-token - register push token
  router.post('/push-token', (req, res) => {
    try {
      const { token, deviceId } = req.body;
      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }
      db.addPushToken(token, deviceId || null);
      res.json({ success: true, message: 'Token registered' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/push-token - unregister push token
  router.delete('/push-token', (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }
      db.removePushToken(token);
      res.json({ success: true, message: 'Token removed' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
