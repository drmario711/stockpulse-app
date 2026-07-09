const RssParser = require('rss-parser');
const crypto = require('crypto');

const parser = new RssParser({
  timeout: 10000,
  headers: {
    'User-Agent': 'StockPulse/1.0 (News Aggregator)',
  },
});

// RSS feed templates per source
const RSS_SOURCES = {
  yahoo: {
    name: 'Yahoo Finance',
    urlTemplate: (ticker) => `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${ticker}&region=US&lang=en-US`,
  },
  google: {
    name: 'Google News',
    urlTemplate: (companyName) => `https://news.google.com/rss/search?q=${encodeURIComponent(companyName + ' stock')}&hl=en-US&gl=US&ceid=US:en`,
  },
  google_ticker: {
    name: 'Google News',
    urlTemplate: (ticker) => `https://news.google.com/rss/search?q=${encodeURIComponent('$' + ticker + ' stock OR shares')}&hl=en-US&gl=US&ceid=US:en`,
  },
  seeking_alpha: {
    name: 'Seeking Alpha',
    urlTemplate: (ticker) => `https://seekingalpha.com/api/sa/combined/${ticker}.xml`,
  },
};

class RssAggregator {
  constructor() {
    this.errors = [];
  }

  async fetchFromSource(sourceKey, queryParam, ticker) {
    const source = RSS_SOURCES[sourceKey];
    if (!source) return [];

    const url = source.urlTemplate(queryParam);
    try {
      const feed = await parser.parseURL(url);
      if (!feed || !feed.items) return [];

      return feed.items.slice(0, 20).map(item => {
        const urlStr = item.link || item.guid || '';
        const urlHash = crypto.createHash('md5').update(urlStr + item.title).digest('hex');
        
        return {
          id: urlHash,
          ticker,
          title: this._cleanHtml(item.title || 'Bez názvu'),
          summary: this._cleanHtml(item.contentSnippet || item.content || ''),
          url: urlStr,
          source: source.name,
          image_url: this._extractImage(item),
          published_at: item.isoDate || item.pubDate || new Date().toISOString(),
          fetched_at: new Date().toISOString(),
          category: 'general',
          sentiment: null,
          is_breaking: 0,
        };
      });
    } catch (err) {
      this.errors.push(`${source.name} (${ticker}): ${err.message}`);
      return [];
    }
  }

  async fetchAllForTicker(ticker, companyName) {
    const results = [];
    
    // Yahoo Finance RSS
    try {
      const yahoo = await this.fetchFromSource('yahoo', ticker, ticker);
      results.push(...yahoo);
    } catch (e) { /* logged in fetchFromSource */ }

    // Google News - by company name
    try {
      const google = await this.fetchFromSource('google', companyName, ticker);
      results.push(...google);
    } catch (e) { /* logged */ }

    // Google News - by ticker
    try {
      const googleTicker = await this.fetchFromSource('google_ticker', ticker, ticker);
      results.push(...googleTicker);
    } catch (e) { /* logged */ }

    return results;
  }

  _cleanHtml(text) {
    if (!text) return '';
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 1000);
  }

  _extractImage(item) {
    if (item.enclosure && item.enclosure.url) return item.enclosure.url;
    if (item['media:content'] && item['media:content'].$) return item['media:content'].$.url;
    const imgMatch = (item.content || '').match(/<img[^>]+src="([^"]+)"/);
    return imgMatch ? imgMatch[1] : null;
  }

  getErrors() {
    return this.errors;
  }

  clearErrors() {
    this.errors = [];
  }
}

module.exports = RssAggregator;
