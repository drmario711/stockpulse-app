// ─── TypeScript Interfaces ───────────────────────────────────────────

export interface Stock {
  /** App-internal ticker (used in UI & as route param) */
  ticker: string;
  /** Symbol used for Finnhub API queries (may include exchange suffix) */
  finnhubSymbol: string;
  /** Full company name */
  name: string;
  /** Sector classification */
  sector: 'mining' | 'energy' | 'biotech' | 'tech';
  /** Exchange the stock trades on */
  exchange: string;
}

export interface NewsItem {
  id?: number;
  ticker: string;
  headline?: string;
  title?: string;
  summary: string;
  source: string;
  url: string;
  publishedAt?: string;
  published_at?: string;
  category?: string;
  relatedTickers?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral' | null;
  sentimentScore?: number | null;
  imageUrl?: string | null;
  isBreaking?: boolean;
  is_breaking?: number | boolean;
  createdAt?: string;
}

export interface InsiderTransaction {
  id?: number;
  ticker: string;
  filingDate?: string;
  filing_date?: string;
  transactionDate?: string;
  ownerName?: string;
  person_name?: string;
  ownerTitle?: string;
  person_title?: string;
  transactionType: 'buy' | 'sell' | 'exercise' | 'other' | string;
  transaction_type?: string;
  sharesTraded?: number;
  shares?: number;
  pricePerShare?: number | null;
  price?: number | null;
  totalValue?: number | null;
  total_value?: number | null;
  sharesOwned?: number | null;
  source?: string;
  url?: string | null;
  context?: string;
  createdAt?: string;
}

export interface InstitutionalHolding {
  id?: number;
  ticker: string;
  institutionName?: string;
  sharesHeld?: number;
  changeInShares?: number;
  changePercent?: number | null;
  portfolioPercent?: number | null;
  marketValue?: number | null;
  filingDate?: string;
  reportDate?: string;
  source?: string;
  createdAt?: string;
}

export interface Catalyst {
  id?: number | string;
  ticker?: string;
  title: string;
  description?: string;
  date?: string;
  category: 'earnings' | 'fda' | 'merger' | 'regulation' | 'product' | 'drilling' | 'other' | string;
  catalystType?: string;
  expectedDate?: string | null;
  impact?: 'high' | 'medium' | 'low' | string;
  importance?: string;
  status?: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  source?: string | null;
  url?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Insight {
  id?: number;
  ticker?: string;
  insightType?: string;
  title: string;
  description: string;
  context?: string;
  retailMeaning?: string;
  retail_meaning?: string;
  category?: string;
  sources?: string[];
  importance?: number | string;
  severity?: 'high' | 'medium' | 'low';
  isRead?: boolean;
  expiresAt?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface RefreshStatus {
  isRefreshing: boolean;
  lastRefreshAt: string | null;
  lastRefreshDuration: number | null;
  nextScheduledRefresh: string | null;
  errors: string[];
  tickersRefreshed: string[];
  tickersPending: string[];
}

export interface StockSummary {
  stock: Stock;
  latestNews: NewsItem[];
  recentInsiders: InsiderTransaction[];
  topInstitutions: InstitutionalHolding[];
  upcomingCatalysts: Catalyst[];
  activeInsights: Insight[];
  stats: {
    totalNews: number;
    totalInsiders: number;
    totalInstitutions: number;
    totalCatalysts: number;
    unreadInsights: number;
    netInsiderShares: number;
    insiderBuyRatio: number;
    sentimentScore: number | null;
  };
}

// ─── API Configuration ──────────────────────────────────────────────

/** Base URL for the backend REST API. */
export const API_BASE_URL = 'https://stockpulse-app-l14o.onrender.com/api';

/** Auto-refresh interval: 30 minutes (in milliseconds) */
export const REFRESH_INTERVAL = 30 * 60 * 1000;

// ─── Stock Definitions ──────────────────────────────────────────────

export const STOCKS: Stock[] = [
  {
    ticker: 'BMNR',
    finnhubSymbol: 'BMNR',
    name: 'Bitmine Immersion Technologies',
    sector: 'mining',
    exchange: 'NYSE',
  },
  {
    ticker: 'AMR',
    finnhubSymbol: 'AMR',
    name: 'Alpha Metallurgical Resources',
    sector: 'mining',
    exchange: 'NYSE',
  },
  {
    ticker: 'IPCO',
    finnhubSymbol: 'IPCO.TO',
    name: 'International Petroleum Corp',
    sector: 'energy',
    exchange: 'TSX',
  },
  {
    ticker: 'LMN',
    finnhubSymbol: 'LMN.V',
    name: 'Lumine Group',
    sector: 'tech',
    exchange: 'TSX-V',
  },
  {
    ticker: 'CSU',
    finnhubSymbol: 'CSU.TO',
    name: 'Constellation Software',
    sector: 'tech',
    exchange: 'TSX',
  },
  {
    ticker: 'ZBIO',
    finnhubSymbol: 'ZBIO',
    name: 'Zenas BioPharma',
    sector: 'biotech',
    exchange: 'NASDAQ',
  },
  {
    ticker: 'VRDN',
    finnhubSymbol: 'VRDN',
    name: 'Viridian Therapeutics',
    sector: 'biotech',
    exchange: 'NASDAQ',
  },
  {
    ticker: 'RIG',
    finnhubSymbol: 'RIG',
    name: 'Transocean Ltd',
    sector: 'energy',
    exchange: 'NYSE',
  },
  {
    ticker: 'VAL',
    finnhubSymbol: 'VAL',
    name: 'Valaris Ltd',
    sector: 'energy',
    exchange: 'NYSE',
  },
  {
    ticker: 'TDW',
    finnhubSymbol: 'TDW',
    name: 'Tidewater Inc',
    sector: 'energy',
    exchange: 'NYSE',
  },
  {
    ticker: 'HIMS',
    finnhubSymbol: 'HIMS',
    name: 'Hims & Hers Health',
    sector: 'biotech',
    exchange: 'NYSE',
  },
  {
    ticker: 'KDK',
    finnhubSymbol: 'KDK.V',
    name: 'Kodiak Copper Corp',
    sector: 'mining',
    exchange: 'TSX-V',
  },
  {
    ticker: 'GOT',
    finnhubSymbol: 'GOT.V',
    name: 'Goliath Resources Ltd',
    sector: 'mining',
    exchange: 'TSX-V',
  },
  {
    ticker: 'HCC',
    finnhubSymbol: 'HCC',
    name: 'Warrior Met Coal',
    sector: 'mining',
    exchange: 'NYSE',
  },
  {
    ticker: 'SOC',
    finnhubSymbol: 'SOC',
    name: 'Sable Offshore Corp',
    sector: 'energy',
    exchange: 'NYSE',
  },
];
