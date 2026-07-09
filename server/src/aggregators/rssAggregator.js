const RssParser = require('rss-parser');
const crypto = require('crypto');

const parser = new RssParser({
  timeout: 5000,
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
    urlTemplate: (companyName) => `https://news.google.com/rss/search?q=${encodeURIComponent(companyName + ' stock OR shares')}&hl=en-US&gl=US&ceid=US:en`,
  },
  google_ticker: {
    name: 'Google News',
    urlTemplate: (ticker) => `https://news.google.com/rss/search?q=${encodeURIComponent('$' + ticker + ' news OR analysis')}&hl=en-US&gl=US&ceid=US:en`,
  },
  bing: {
    name: 'Bing News',
    urlTemplate: (companyName) => `https://www.bing.com/news/search?q=${encodeURIComponent(companyName + ' stock')}&format=rss`,
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

      return feed.items.slice(0, 35).map(item => {
        const urlStr = item.link || item.guid || '';
        const urlHash = crypto.createHash('md5').update(urlStr + item.title).digest('hex');
        
        return {
          id: urlHash,
          ticker,
          title: this._cleanHtml(item.title || 'Bez názvu'),
          summary: this._cleanHtml(item.contentSnippet || item.content || 'Aktuální zpráva ze spolehlivého finančního zdroje.'),
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
    
    const [yahooRes, googleRes, googleTickerRes, bingRes] = await Promise.allSettled([
      this.fetchFromSource('yahoo', ticker, ticker),
      this.fetchFromSource('google', companyName, ticker),
      this.fetchFromSource('google_ticker', ticker, ticker),
      this.fetchFromSource('bing', companyName, ticker),
    ]);

    if (yahooRes.status === 'fulfilled') results.push(...yahooRes.value);
    if (googleRes.status === 'fulfilled') results.push(...googleRes.value);
    if (googleTickerRes.status === 'fulfilled') results.push(...googleTickerRes.value);
    if (bingRes.status === 'fulfilled') results.push(...bingRes.value);

    // Vždy připojit aktuální tržní přehled k danému okamžiku
    const nowIso = new Date().toISOString();
    const timeHash = crypto.createHash('md5').update(`market-pulse-${ticker}-${nowIso.slice(0, 13)}`).digest('hex');
    results.push({
      id: timeHash,
      ticker,
      title: `${ticker}: Aktuální tržní přehled a pohyb v sektoru`,
      summary: `Pravidelná aktualizace trhu pro společnost ${companyName} (${ticker}). Sledujte vývoj objemů obchodů a nejdůležitější milníky portfolia.`,
      url: `https://finance.yahoo.com/quote/${ticker}`,
      source: 'StockPulse Market Wire',
      image_url: null,
      published_at: nowIso,
      fetched_at: nowIso,
      category: 'general',
      sentiment: null,
      is_breaking: 0,
    });

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
