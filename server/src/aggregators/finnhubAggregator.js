const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

class FinnhubAggregator {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.requestCount = 0;
    this.lastReset = Date.now();
  }

  async _throttle() {
    // Finnhub free: 60 req/min
    if (Date.now() - this.lastReset > 60000) {
      this.requestCount = 0;
      this.lastReset = Date.now();
    }
    if (this.requestCount >= 55) {
      const wait = 60000 - (Date.now() - this.lastReset) + 1000;
      console.log(`[Finnhub] Rate limit approaching, waiting ${Math.round(wait/1000)}s...`);
      await new Promise(r => setTimeout(r, wait));
      this.requestCount = 0;
      this.lastReset = Date.now();
    }
    this.requestCount++;
  }

  async _fetch(endpoint, params = {}) {
    await this._throttle();
    const url = new URL(`${FINNHUB_BASE}${endpoint}`);
    url.searchParams.set('token', this.apiKey);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
    try {
      const resp = await fetch(url.toString());
      if (!resp.ok) {
        console.error(`[Finnhub] ${endpoint} HTTP ${resp.status}`);
        return null;
      }
      return await resp.json();
    } catch (err) {
      console.error(`[Finnhub] ${endpoint} error:`, err.message);
      return null;
    }
  }

  async fetchCompanyNews(symbol, ticker, daysBack = 7) {
    const to = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - daysBack * 86400000).toISOString().split('T')[0];
    
    const data = await this._fetch('/company-news', { symbol, from, to });
    if (!data || !Array.isArray(data)) return [];

    return data.map(item => {
      const urlHash = crypto.createHash('md5').update(item.url || item.headline).digest('hex');
      return {
        id: urlHash,
        ticker,
        title: item.headline || 'Bez názvu',
        summary: item.summary || '',
        url: item.url || '',
        source: item.source || 'Finnhub',
        image_url: item.image || null,
        published_at: new Date(item.datetime * 1000).toISOString(),
        fetched_at: new Date().toISOString(),
        category: item.category || 'general',
        sentiment: null,
        is_breaking: 0,
      };
    });
  }

  async fetchInsiderTransactions(symbol, ticker) {
    const data = await this._fetch('/stock/insider-transactions', { symbol });
    if (!data || !data.data || !Array.isArray(data.data)) return [];

    return data.data.map(item => {
      const id = crypto.createHash('md5').update(
        `${item.name}-${item.filingDate}-${item.transactionCode}-${item.share}`
      ).digest('hex');

      const txType = this._parseTransactionType(item.transactionCode);
      const totalValue = (item.share || 0) * (item.transactionPrice || 0);

      return {
        id,
        ticker,
        person_name: item.name || 'Neznámý',
        person_title: item.position || null,
        transaction_type: txType,
        shares: item.share || 0,
        price: item.transactionPrice || 0,
        total_value: totalValue,
        shares_after: item.shareAfter || 0,
        filing_date: item.filingDate || new Date().toISOString().split('T')[0],
        transaction_date: item.transactionDate || null,
        source: 'finnhub',
        context: this._generateInsiderContext(item, txType, totalValue),
      };
    });
  }

  async fetchQuote(symbol) {
    const data = await this._fetch('/quote', { symbol });
    if (!data) return null;
    return {
      current: data.c,
      change: data.d,
      changePercent: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
      timestamp: data.t,
    };
  }

  _parseTransactionType(code) {
    const types = {
      'P': 'buy',
      'S': 'sell',
      'A': 'grant',
      'M': 'exercise',
      'F': 'tax_payment',
      'G': 'gift',
    };
    return types[code] || code || 'unknown';
  }

  _generateInsiderContext(item, txType, totalValue) {
    const name = item.name || 'Insider';
    const position = item.position || 'vedení';
    
    if (txType === 'buy') {
      if (totalValue > 1000000) {
        return `${name} (${position}) provedl výrazný nákup v hodnotě $${(totalValue/1000000).toFixed(2)}M. Velké insider nákupy často signalizují silnou důvěru vedení v budoucnost firmy.`;
      }
      return `${name} (${position}) nakoupil akcie za vlastní peníze. Insider nákupy jsou obecně považovány za pozitivní signál.`;
    }
    if (txType === 'sell') {
      if (totalValue > 5000000) {
        return `${name} (${position}) prodal akcie v hodnotě $${(totalValue/1000000).toFixed(2)}M. Velké insider prodeje mohou mít různé důvody - diverzifikace, daňové plánování, nebo obavy o budoucnost.`;
      }
      return `${name} (${position}) prodal část svých akcií. Insider prodeje nemusí nutně znamenat negativní signál - mohou souviset s plánovaným prodejem nebo osobními potřebami.`;
    }
    if (txType === 'grant') {
      return `${name} (${position}) obdržel akcie jako součást kompenzačního plánu. Standardní forma odměňování vedení.`;
    }
    if (txType === 'exercise') {
      return `${name} (${position}) uplatnil opce. Často následováno prodejem pro realizaci zisku nebo držení pro dlouhodobou pozici.`;
    }
    return `${name} (${position}) provedl transakci typu "${txType}".`;
  }
}

module.exports = FinnhubAggregator;
