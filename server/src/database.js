const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'stockpulse.db');

let db;

function getDb() {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stocks (
      ticker TEXT PRIMARY KEY,
      finnhub_symbol TEXT NOT NULL,
      company_name TEXT NOT NULL,
      sector TEXT NOT NULL,
      exchange TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS news (
      id TEXT PRIMARY KEY,
      ticker TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT,
      url TEXT,
      source TEXT NOT NULL,
      image_url TEXT,
      published_at TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      sentiment TEXT,
      is_breaking INTEGER DEFAULT 0,
      FOREIGN KEY (ticker) REFERENCES stocks(ticker)
    );

    CREATE INDEX IF NOT EXISTS idx_news_ticker ON news(ticker);
    CREATE INDEX IF NOT EXISTS idx_news_published ON news(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_news_url ON news(url);

    CREATE TABLE IF NOT EXISTS insider_transactions (
      id TEXT PRIMARY KEY,
      ticker TEXT NOT NULL,
      person_name TEXT NOT NULL,
      person_title TEXT,
      transaction_type TEXT NOT NULL,
      shares INTEGER,
      price REAL,
      total_value REAL,
      shares_after INTEGER,
      filing_date TEXT NOT NULL,
      transaction_date TEXT,
      source TEXT DEFAULT 'finnhub',
      context TEXT,
      FOREIGN KEY (ticker) REFERENCES stocks(ticker)
    );

    CREATE INDEX IF NOT EXISTS idx_insider_ticker ON insider_transactions(ticker);
    CREATE INDEX IF NOT EXISTS idx_insider_date ON insider_transactions(filing_date DESC);

    CREATE TABLE IF NOT EXISTS institutional_holdings (
      id TEXT PRIMARY KEY,
      ticker TEXT NOT NULL,
      institution_name TEXT NOT NULL,
      shares INTEGER,
      value REAL,
      change_shares INTEGER,
      change_percent REAL,
      filing_date TEXT NOT NULL,
      report_date TEXT,
      source TEXT DEFAULT 'sec_edgar',
      analysis TEXT,
      FOREIGN KEY (ticker) REFERENCES stocks(ticker)
    );

    CREATE INDEX IF NOT EXISTS idx_inst_ticker ON institutional_holdings(ticker);

    CREATE TABLE IF NOT EXISTS catalysts (
      id TEXT PRIMARY KEY,
      ticker TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT,
      category TEXT NOT NULL,
      importance TEXT DEFAULT 'medium',
      source TEXT,
      fetched_at TEXT NOT NULL,
      FOREIGN KEY (ticker) REFERENCES stocks(ticker)
    );

    CREATE INDEX IF NOT EXISTS idx_catalysts_ticker ON catalysts(ticker);

    CREATE TABLE IF NOT EXISTS insights (
      id TEXT PRIMARY KEY,
      ticker TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      context TEXT NOT NULL,
      retail_meaning TEXT NOT NULL,
      category TEXT NOT NULL,
      sources TEXT,
      importance INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (ticker) REFERENCES stocks(ticker)
    );

    CREATE INDEX IF NOT EXISTS idx_insights_ticker ON insights(ticker);

    CREATE TABLE IF NOT EXISTS push_tokens (
      token TEXT PRIMARY KEY,
      device_id TEXT,
      registered_at TEXT NOT NULL,
      last_used TEXT
    );

    CREATE TABLE IF NOT EXISTS refresh_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      status TEXT NOT NULL DEFAULT 'running',
      total_news INTEGER DEFAULT 0,
      new_news INTEGER DEFAULT 0,
      errors TEXT,
      details TEXT
    );

    CREATE TABLE IF NOT EXISTS seen_urls (
      url_hash TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      ticker TEXT NOT NULL,
      first_seen TEXT NOT NULL
    );
  `);

  // Seed stock data
  const insertStock = db.prepare(`
    INSERT OR IGNORE INTO stocks (ticker, finnhub_symbol, company_name, sector, exchange) 
    VALUES (?, ?, ?, ?, ?)
  `);

  const stocks = [
    ['BMNR', 'BMNR', 'Bitmine Immersion Technologies', 'mining', 'NYSE'],
    ['AMR', 'AMR', 'Alpha Metallurgical Resources', 'mining', 'NYSE'],
    ['IPCO', 'IPCO.TO', 'International Petroleum Corporation', 'energy', 'TSX'],
    ['LMN', 'LMN.V', 'Lumine Group', 'tech', 'TSX-V'],
    ['CSU', 'CSU.TO', 'Constellation Software', 'tech', 'TSX'],
    ['ZBIO', 'ZBIO', 'Zenas BioPharma', 'biotech', 'NASDAQ'],
    ['VRDN', 'VRDN', 'Viridian Therapeutics', 'biotech', 'NASDAQ'],
    ['RIG', 'RIG', 'Transocean Ltd', 'energy', 'NYSE'],
    ['VAL', 'VAL', 'Valaris Ltd', 'energy', 'NYSE'],
    ['TDW', 'TDW', 'Tidewater Inc', 'energy', 'NYSE'],
    ['HIMS', 'HIMS', 'Hims & Hers Health', 'biotech', 'NYSE'],
    ['KDK', 'KDK.V', 'Kodiak Copper Corp', 'mining', 'TSX-V'],
    ['GOT', 'GOT.V', 'Goliath Resources Ltd', 'mining', 'TSX-V'],
    ['HCC', 'HCC', 'Warrior Met Coal', 'mining', 'NYSE'],
    ['SOC', 'SOC', 'Sable Offshore Corp', 'energy', 'NYSE'],
  ];

  const seedTx = db.transaction(() => {
    for (const s of stocks) {
      insertStock.run(...s);
    }
  });
  seedTx();
}

// --- CRUD helpers ---

function getAllStocks() {
  return getDb().prepare('SELECT * FROM stocks ORDER BY ticker').all();
}

function insertNews(items) {
  const stmt = getDb().prepare(`
    INSERT OR IGNORE INTO news (id, ticker, title, summary, url, source, image_url, published_at, fetched_at, category, sentiment, is_breaking)
    VALUES (@id, @ticker, @title, @summary, @url, @source, @image_url, @published_at, @fetched_at, @category, @sentiment, @is_breaking)
  `);
  const insertMany = getDb().transaction((rows) => {
    let inserted = 0;
    for (const row of rows) {
      const result = stmt.run(row);
      if (result.changes > 0) inserted++;
    }
    return inserted;
  });
  return insertMany(items);
}

function getNewsByTicker(ticker, limit = 50, sinceDate = null) {
  if (sinceDate) {
    return getDb().prepare(
      'SELECT * FROM news WHERE ticker = ? AND published_at > ? ORDER BY published_at DESC LIMIT ?'
    ).all(ticker, sinceDate, limit);
  }
  return getDb().prepare(
    'SELECT * FROM news WHERE ticker = ? ORDER BY published_at DESC LIMIT ?'
  ).all(ticker, limit);
}

function getAllRecentNews(limit = 100, sinceDate = null) {
  if (sinceDate) {
    return getDb().prepare(
      'SELECT * FROM news WHERE published_at > ? ORDER BY published_at DESC LIMIT ?'
    ).all(sinceDate, limit);
  }
  return getDb().prepare(
    'SELECT * FROM news ORDER BY published_at DESC LIMIT ?'
  ).all(limit);
}

function insertInsiderTransactions(items) {
  const stmt = getDb().prepare(`
    INSERT OR IGNORE INTO insider_transactions (id, ticker, person_name, person_title, transaction_type, shares, price, total_value, shares_after, filing_date, transaction_date, source, context)
    VALUES (@id, @ticker, @person_name, @person_title, @transaction_type, @shares, @price, @total_value, @shares_after, @filing_date, @transaction_date, @source, @context)
  `);
  const insertMany = getDb().transaction((rows) => {
    let inserted = 0;
    for (const row of rows) {
      const result = stmt.run(row);
      if (result.changes > 0) inserted++;
    }
    return inserted;
  });
  return insertMany(items);
}

function getInsidersByTicker(ticker, limit = 30) {
  return getDb().prepare(
    'SELECT * FROM insider_transactions WHERE ticker = ? ORDER BY filing_date DESC LIMIT ?'
  ).all(ticker, limit);
}

function insertInstitutionalHoldings(items) {
  const stmt = getDb().prepare(`
    INSERT OR IGNORE INTO institutional_holdings (id, ticker, institution_name, shares, value, change_shares, change_percent, filing_date, report_date, source, analysis)
    VALUES (@id, @ticker, @institution_name, @shares, @value, @change_shares, @change_percent, @filing_date, @report_date, @source, @analysis)
  `);
  const insertMany = getDb().transaction((rows) => {
    let inserted = 0;
    for (const row of rows) {
      const result = stmt.run(row);
      if (result.changes > 0) inserted++;
    }
    return inserted;
  });
  return insertMany(items);
}

function getInstitutionsByTicker(ticker, limit = 30) {
  return getDb().prepare(
    'SELECT * FROM institutional_holdings WHERE ticker = ? ORDER BY filing_date DESC LIMIT ?'
  ).all(ticker, limit);
}

function insertCatalysts(items) {
  const stmt = getDb().prepare(`
    INSERT OR REPLACE INTO catalysts (id, ticker, title, description, date, category, importance, source, fetched_at)
    VALUES (@id, @ticker, @title, @description, @date, @category, @importance, @source, @fetched_at)
  `);
  const insertMany = getDb().transaction((rows) => {
    for (const row of rows) {
      stmt.run(row);
    }
  });
  insertMany(items);
}

function getCatalystsByTicker(ticker) {
  return getDb().prepare(
    'SELECT * FROM catalysts WHERE ticker = ? ORDER BY date ASC'
  ).all(ticker);
}

function insertInsights(items) {
  const stmt = getDb().prepare(`
    INSERT OR REPLACE INTO insights (id, ticker, title, description, context, retail_meaning, category, sources, importance, created_at, updated_at)
    VALUES (@id, @ticker, @title, @description, @context, @retail_meaning, @category, @sources, @importance, @created_at, @updated_at)
  `);
  const insertMany = getDb().transaction((rows) => {
    for (const row of rows) {
      stmt.run(row);
    }
  });
  insertMany(items);
}

function getInsightsByTicker(ticker) {
  return getDb().prepare(
    'SELECT * FROM insights WHERE ticker = ? ORDER BY importance DESC, updated_at DESC LIMIT 5'
  ).all(ticker);
}

function addPushToken(token, deviceId) {
  return getDb().prepare(`
    INSERT OR REPLACE INTO push_tokens (token, device_id, registered_at, last_used) 
    VALUES (?, ?, datetime('now'), datetime('now'))
  `).run(token, deviceId);
}

function getAllPushTokens() {
  return getDb().prepare('SELECT token FROM push_tokens').all().map(r => r.token);
}

function removePushToken(token) {
  return getDb().prepare('DELETE FROM push_tokens WHERE token = ?').run(token);
}

function logRefreshStart() {
  const result = getDb().prepare(`
    INSERT INTO refresh_log (started_at, status) VALUES (datetime('now'), 'running')
  `).run();
  return result.lastInsertRowid;
}

function logRefreshEnd(id, status, totalNews, newNews, errors, details) {
  return getDb().prepare(`
    UPDATE refresh_log SET finished_at = datetime('now'), status = ?, total_news = ?, new_news = ?, errors = ?, details = ?
    WHERE id = ?
  `).run(status, totalNews, newNews, errors, details, id);
}

function getLastRefresh() {
  return getDb().prepare(
    'SELECT * FROM refresh_log ORDER BY id DESC LIMIT 1'
  ).get();
}

function isUrlSeen(urlHash) {
  return !!getDb().prepare('SELECT 1 FROM seen_urls WHERE url_hash = ?').get(urlHash);
}

function markUrlSeen(urlHash, url, ticker) {
  return getDb().prepare(`
    INSERT OR IGNORE INTO seen_urls (url_hash, url, ticker, first_seen) VALUES (?, ?, ?, datetime('now'))
  `).run(urlHash, url, ticker);
}

function getNewsCountByTicker(ticker, sinceDate) {
  if (sinceDate) {
    return getDb().prepare(
      'SELECT COUNT(*) as count FROM news WHERE ticker = ? AND published_at > ?'
    ).get(ticker, sinceDate)?.count || 0;
  }
  return getDb().prepare(
    'SELECT COUNT(*) as count FROM news WHERE ticker = ?'
  ).get(ticker)?.count || 0;
}

function getStockSummary(ticker) {
  const newsCount = getDb().prepare('SELECT COUNT(*) as c FROM news WHERE ticker = ?').get(ticker)?.c || 0;
  const recentNewsCount = getDb().prepare(
    "SELECT COUNT(*) as c FROM news WHERE ticker = ? AND published_at > datetime('now', '-24 hours')"
  ).get(ticker)?.c || 0;
  const insiderCount = getDb().prepare('SELECT COUNT(*) as c FROM insider_transactions WHERE ticker = ?').get(ticker)?.c || 0;
  const latestNews = getDb().prepare('SELECT published_at FROM news WHERE ticker = ? ORDER BY published_at DESC LIMIT 1').get(ticker);
  
  return {
    total_news: newsCount,
    recent_news_24h: recentNewsCount,
    total_insider_transactions: insiderCount,
    latest_news_date: latestNews?.published_at || null,
  };
}

module.exports = {
  getDb,
  getAllStocks,
  insertNews,
  getNewsByTicker,
  getAllRecentNews,
  insertInsiderTransactions,
  getInsidersByTicker,
  insertInstitutionalHoldings,
  getInstitutionsByTicker,
  insertCatalysts,
  getCatalystsByTicker,
  insertInsights,
  getInsightsByTicker,
  addPushToken,
  getAllPushTokens,
  removePushToken,
  logRefreshStart,
  logRefreshEnd,
  getLastRefresh,
  isUrlSeen,
  markUrlSeen,
  getNewsCountByTicker,
  getStockSummary,
};
