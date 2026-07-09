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
    const refreshId = this.db.logRefreshStart();
    const stocks = this.db.getAllStocks();
    let totalNew = 0;
    let totalFetched = 0;
    const errors = [];
    const tickersWithNews = [];

    console.log(`[Cron] Starting full refresh for ${stocks.length} stocks...`);

    for (const stock of stocks) {
      try {
        // 1. Finnhub news
        const finnhubNews = await this.finnhub.fetchCompanyNews(
          stock.finnhub_symbol, stock.ticker, 3
        );
        
        // 2. RSS news
        this.rss.clearErrors();
        const rssNews = await this.rss.fetchAllForTicker(stock.ticker, stock.company_name);
        if (this.rss.getErrors().length > 0) {
          errors.push(...this.rss.getErrors());
        }

        // 3. SEC EDGAR filings as news
        let secNews = [];
        try {
          secNews = await this.sec.fetchFilingAsNews(stock.ticker);
        } catch (e) {
          errors.push(`SEC (${stock.ticker}): ${e.message}`);
        }

        // Combine and deduplicate
        const allNews = [...finnhubNews, ...rssNews, ...secNews];
        totalFetched += allNews.length;
        
        const uniqueNews = this.deduplicator.deduplicate(allNews);
        
        if (uniqueNews.length > 0) {
          const inserted = this.db.insertNews(uniqueNews);
          totalNew += inserted;
          
          if (inserted > 0) {
            tickersWithNews.push(stock.ticker);
            
            // Send notifications for significant news
            for (const newsItem of uniqueNews.slice(0, 3)) {
              if (newsItem.is_breaking) {
                await this.notifications.sendBreakingNotification(
                  stock.ticker, newsItem.title, newsItem.summary
                );
              }
            }
          }
        }

        // 4. Finnhub insider transactions
        try {
          const insiders = await this.finnhub.fetchInsiderTransactions(
            stock.finnhub_symbol, stock.ticker
          );
          if (insiders.length > 0) {
            const insertedInsiders = this.db.insertInsiderTransactions(insiders);
            if (insertedInsiders > 0) {
              // Notify about significant insider trades
              for (const tx of insiders.slice(0, 2)) {
                if (tx.transaction_type === 'buy' && tx.total_value > 100000) {
                  await this.notifications.sendInsiderNotification(stock.ticker, tx);
                }
                if (tx.transaction_type === 'sell' && tx.total_value > 500000) {
                  await this.notifications.sendInsiderNotification(stock.ticker, tx);
                }
              }
            }
          }
        } catch (e) {
          errors.push(`Insider (${stock.ticker}): ${e.message}`);
        }

        // 5. Generate/update insights
        try {
          const insights = this.insightGenerator.generateForTicker(stock.ticker, stock);
          if (insights.length > 0) {
            this.db.insertInsights(insights);
          }
        } catch (e) {
          errors.push(`Insights (${stock.ticker}): ${e.message}`);
        }

        // Small delay between stocks to be nice to APIs
        await new Promise(r => setTimeout(r, 500));

      } catch (err) {
        errors.push(`${stock.ticker}: ${err.message}`);
        console.error(`[Cron] Error processing ${stock.ticker}:`, err.message);
      }
    }

    // Send summary notification
    if (totalNew > 0) {
      await this.notifications.sendRefreshSummary(totalNew, tickersWithNews);
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

    this.isRunning = false;
    console.log(`[Cron] Refresh complete: ${totalNew} new items, ${errors.length} errors`);

    return {
      status,
      total_fetched: totalFetched,
      new_items: totalNew,
      errors: errors.length,
      tickers_with_news: tickersWithNews,
    };
  }
}

module.exports = CronScheduler;
