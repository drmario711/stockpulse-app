const crypto = require('crypto');

const SEC_BASE = 'https://efts.sec.gov/LATEST/search-index';
const SEC_DATA = 'https://data.sec.gov';
const SEC_FULL_TEXT = 'https://efts.sec.gov/LATEST';

const USER_AGENT = 'StockPulse radoslav@stockpulse.app';

// CIK mappings for our tracked US stocks
// These need to be looked up from SEC EDGAR
const KNOWN_CIKS = {
  'BMNR': null,  // May not have SEC filings yet
  'AMR': '0001881204',
  'ZBIO': null,
  'VRDN': '0001438423',
  'RIG': '0001451505',
  'VAL': '0001837014',
  'TDW': '0000098222',
  'HIMS': '0001773751',
  'HCC': '0001691303',
  'SOC': null,
};

class SecEdgarAggregator {
  constructor() {
    this.errors = [];
    this.lastRequest = 0;
  }

  async _throttle() {
    // SEC EDGAR: max 10 req/sec
    const now = Date.now();
    const diff = now - this.lastRequest;
    if (diff < 150) {
      await new Promise(r => setTimeout(r, 150 - diff));
    }
    this.lastRequest = Date.now();
  }

  async _fetch(url) {
    await this._throttle();
    try {
      const resp = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
      });
      if (!resp.ok) {
        console.error(`[SEC] ${url} HTTP ${resp.status}`);
        return null;
      }
      return await resp.json();
    } catch (err) {
      console.error(`[SEC] ${url} error:`, err.message);
      this.errors.push(`SEC EDGAR: ${err.message}`);
      return null;
    }
  }

  async fetchRecentFilings(ticker) {
    const cik = KNOWN_CIKS[ticker];
    if (!cik) {
      return [];
    }

    // Pad CIK to 10 digits
    const paddedCik = cik.replace(/^0+/, '').padStart(10, '0');
    const url = `${SEC_DATA}/submissions/CIK${paddedCik}.json`;
    
    const data = await this._fetch(url);
    if (!data || !data.filings || !data.filings.recent) return [];

    const recent = data.filings.recent;
    const filings = [];

    const len = Math.min(recent.form.length, 20);
    for (let i = 0; i < len; i++) {
      const form = recent.form[i];
      // Focus on insider-related forms (3, 4, 5) and institutional (13F)
      if (!['3', '4', '5', '13F-HR', 'SC 13G', 'SC 13D', '8-K', '10-K', '10-Q'].includes(form)) continue;

      const accession = recent.accessionNumber[i].replace(/-/g, '');
      const filingUrl = `${SEC_DATA}/Archives/edgar/data/${paddedCik}/${accession}/${recent.primaryDocument[i]}`;
      
      const id = crypto.createHash('md5').update(recent.accessionNumber[i]).digest('hex');

      if (form === '4' || form === '3' || form === '5') {
        filings.push({
          type: 'insider',
          id,
          ticker,
          form,
          filingDate: recent.filingDate[i],
          description: recent.primaryDocDescription[i] || `Form ${form} Filing`,
          url: filingUrl,
        });
      } else if (form === '13F-HR' || form === 'SC 13G' || form === 'SC 13D') {
        filings.push({
          type: 'institutional',
          id,
          ticker,
          form,
          filingDate: recent.filingDate[i],
          description: recent.primaryDocDescription[i] || `Form ${form} Filing`,
          url: filingUrl,
        });
      } else {
        // 8-K, 10-K, 10-Q → news/catalysts
        filings.push({
          type: 'filing_news',
          id,
          ticker,
          form,
          filingDate: recent.filingDate[i],
          description: recent.primaryDocDescription[i] || `Form ${form} Filing`,
          url: filingUrl,
        });
      }
    }

    return filings;
  }

  async fetchFilingAsNews(ticker) {
    const filings = await this.fetchRecentFilings(ticker);
    const newsItems = filings
      .filter(f => f.type === 'filing_news')
      .map(f => ({
        id: f.id,
        ticker,
        title: `SEC Filing: ${f.form} - ${f.description}`,
        summary: this._getFilingContext(f.form, ticker),
        url: f.url,
        source: 'SEC EDGAR',
        image_url: null,
        published_at: new Date(f.filingDate).toISOString(),
        fetched_at: new Date().toISOString(),
        category: 'sec_filing',
        sentiment: null,
        is_breaking: f.form === '8-K' ? 1 : 0,
      }));

    return newsItems;
  }

  _getFilingContext(form, ticker) {
    const contexts = {
      '8-K': `Formulář 8-K oznamuje významnou událost u ${ticker}. Může se jednat o změnu vedení, akvizici, finanční výsledky, nebo jinou materiální událost, kterou musí firma neprodleně oznámit.`,
      '10-K': `Roční zpráva (10-K) obsahuje kompletní finanční výsledky, rizikové faktory a strategický výhled firmy ${ticker}. Klíčový dokument pro fundamentální analýzu.`,
      '10-Q': `Čtvrtletní zpráva (10-Q) firmy ${ticker} s aktuálními finančními výsledky. Důležitá pro sledování trendu tržeb a zisku.`,
    };
    return contexts[form] || `SEC filing formulář ${form} pro ${ticker}.`;
  }

  getErrors() {
    return this.errors;
  }
}

module.exports = SecEdgarAggregator;
