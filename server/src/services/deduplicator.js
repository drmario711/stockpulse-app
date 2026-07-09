const crypto = require('crypto');

/**
 * Deduplication engine for news items.
 * Uses URL hashing + title similarity to prevent duplicate stories from different sources.
 */
class Deduplicator {
  constructor(db) {
    this.db = db;
  }

  /**
   * Deduplicate an array of news items.
   * Returns only unique items not already in the database.
   */
  deduplicate(items) {
    if (!items || items.length === 0) return [];

    const seen = new Map();
    const unique = [];

    for (const item of items) {
      // Skip if URL already in database
      const urlHash = this._hashUrl(item.url);
      if (this.db.isUrlSeen(urlHash)) continue;

      // Skip if we've seen a very similar title in this batch
      const titleKey = this._normalizeTitle(item.title);
      if (seen.has(titleKey)) continue;

      // Skip items with no real content
      if (!item.title || item.title.length < 10) continue;

      seen.set(titleKey, true);
      this.db.markUrlSeen(urlHash, item.url, item.ticker);
      unique.push(item);
    }

    return unique;
  }

  /**
   * Create MD5 hash of URL for quick lookup
   */
  _hashUrl(url) {
    if (!url) return crypto.createHash('md5').update(Math.random().toString()).digest('hex');
    // Normalize URL: remove tracking params, trailing slashes
    const normalized = url
      .replace(/[?&](utm_\w+|ref|source|campaign)=[^&]*/gi, '')
      .replace(/\/+$/, '')
      .toLowerCase();
    return crypto.createHash('md5').update(normalized).digest('hex');
  }

  /**
   * Normalize title for similarity comparison.
   * Strips common prefixes/suffixes, lowercases, removes punctuation.
   */
  _normalizeTitle(title) {
    if (!title) return '';
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(w => w.length > 2) // Remove short words
      .sort()
      .join(' ')
      .substring(0, 100);
  }

  /**
   * Check similarity between two titles (Jaccard similarity on word sets)
   */
  static titleSimilarity(title1, title2) {
    const words1 = new Set(title1.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(title2.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2));
    
    if (words1.size === 0 || words2.size === 0) return 0;
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
}

module.exports = Deduplicator;
