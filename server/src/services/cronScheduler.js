const cron = require('node-cron');
const FinnhubAggregator = require('../aggregators/finnhubAggregator');
const RssAggregator = require('../aggregators/rssAggregator');
const SecEdgarAggregator = require('../aggregators/secEdgarAggregator');
const Deduplicator = require('./deduplicator');
const InsightGenerator = require('./insightGenerator');
const NotificationService = require('./notificationService');

class CronScheduler {
  constructor(db) {
    this.db = db;
    this.finnhub = new FinnhubAggregator(process.env.FINNHUB_API_KEY);
    this.rss = new RssAggregator();
    this.sec = new SecEdgarAggregator();
    this.deduplicator = new Deduplicator(db);
    this.insightGenerator = new InsightGenerator(db);
    this.notifications = new NotificationService(db);
    this.isRunning = false;
  }

  start() {
    console.log('[Cron] Starting scheduled jobs...');

    // Every 30 minutes: Finnhub news + insider transactions
    cron.schedule('*/30 * * * *', () => {
      this.runFullRefresh();
    });

    // Run immediately on startup
    setTimeout(() => this.runFullRefresh(), 5000);

    console.log('[Cron] Jobs scheduled: news every 30min');
  }

  async runFullRefresh() {
    if (this.isRunning) {
      console.log('[Cron] Refresh already in progress, skipping...');
      return { status: 'skipped', message: 'Refresh already running' };
    }

    this.isRunning = true;
    try {
      const refreshId = this.db.logRefreshStart();
      const stocks = this.db.getAllStocks();
      let totalNew = 0;
      let totalFetched = 0;
      const errors = [];
      const tickersWithNews = [];

      console.log(`[Cron] Starting parallel full refresh for ${stocks.length} stocks...`);

      const processStock = async (stock) => {
        try {
          const finnhubNews = await this.finnhub.fetchCompanyNews(
            stock.finnhub_symbol, stock.ticker, 3
          );
          
          this.rss.clearErrors();
          const rssNews = await this.rss.fetchAllForTicker(stock.ticker, stock.company_name);

          let secNews = [];
          try {
            secNews = await this.sec.fetchFilingAsNews(stock.ticker);
          } catch {}

          const allNews = [...finnhubNews, ...rssNews, ...secNews];
          const uniqueNews = this.deduplicator.deduplicate(allNews);
          
          if (uniqueNews.length > 0) {
            const inserted = this.db.insertNews(uniqueNews);
            totalNew += inserted;
            totalFetched += allNews.length;
            if (inserted > 0) {
              tickersWithNews.push(stock.ticker);
            }
          }

          try {
            const insights = this.insightGenerator.generateForTicker(stock.ticker, stock);
            if (insights.length > 0) {
              this.db.insertInsights(insights);
            }
          } catch {}
        } catch (err) {
          errors.push(`${stock.ticker}: ${err.message}`);
        }
      };

      // Spustit všech 15 firem paralelně, ale s maximálním timeoutem 3.5 sekundy
      await Promise.race([
        Promise.allSettled(stocks.map(s => processStock(s))),
        new Promise(resolve => setTimeout(resolve, 3500)),
      ]);

      if (totalNew > 0) {
        try {
          await this.notifications.sendRefreshSummary(totalNew, tickersWithNews);
        } catch {}
      }

      const status = errors.length === 0 ? 'success' : (totalNew > 0 ? 'partial' : 'error');
      this.db.logRefreshEnd(
        refreshId,
        status,
        totalFetched,
        totalNew,
        errors.length > 0 ? JSON.stringify(errors.slice(0, 20)) : null,
        JSON.stringify({ stocks_processed: stocks.length, tickers_with_news: tickersWithNews })
      );

      console.log(`[Cron] Refresh complete in parallel: ${totalNew} new items`);

      return {
        status,
        total_fetched: totalFetched,
        new_items: totalNew,
        errors: errors.length,
        tickers_with_news: tickersWithNews,
      };
    } finally {
      this.isRunning = false;
    }
  }
}

module.exports = CronScheduler;
