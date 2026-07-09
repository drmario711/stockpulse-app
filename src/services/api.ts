import {
  API_BASE_URL,
  type NewsItem,
  type InsiderTransaction,
  type InstitutionalHolding,
  type Catalyst,
  type Insight,
  type RefreshStatus,
  type StockSummary,
  type Stock,
} from '../utils/constants';

// ─── Helpers ─────────────────────────────────────────────────────────

const TIMEOUT_MS = 10_000;

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${API_BASE_URL}${path}`;
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => 'Unknown error');
      throw new ApiError(
        `API ${response.status}: ${body}`,
        response.status,
      );
    }

    const data: T = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Požadavek vypršel (timeout)', 408);
    }

    throw new ApiError(
      error instanceof Error ? error.message : 'Neznámá chyba sítě',
      0,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string | number] => entry[1] !== undefined,
  );
  if (entries.length === 0) return '';
  const qs = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  return `?${qs}`;
}

// ─── Public API ──────────────────────────────────────────────────────

export const api = {
  // ── Stocks ──────────────────────────────────────────────────────
  /** Fetch the full list of tracked stocks. */
  getStocks(): Promise<{ stocks: Stock[]; count: number }> {
    return request<{ stocks: Stock[]; count: number }>('/stocks');
  },

  // ── News ────────────────────────────────────────────────────────
  /** Fetch news articles for a specific ticker. */
  getStockNews(
    ticker: string,
    limit?: number,
    since?: string,
  ): Promise<{ ticker: string; news: NewsItem[]; count: number }> {
    const query = buildQuery({ limit, since });
    return request<{ ticker: string; news: NewsItem[]; count: number }>(`/stocks/${encodeURIComponent(ticker)}/news${query}`);
  },

  /** Fetch recent news across all tracked stocks. */
  getRecentNews(limit?: number, since?: string): Promise<{ news: NewsItem[]; count: number }> {
    const query = buildQuery({ limit, since });
    return request<{ news: NewsItem[]; count: number }>(`/news/recent${query}`);
  },

  // ── Insiders ────────────────────────────────────────────────────
  /** Fetch insider transactions for a specific ticker. */
  getStockInsiders(
    ticker: string,
    limit?: number,
  ): Promise<{ ticker: string; insiders: InsiderTransaction[]; count: number }> {
    const query = buildQuery({ limit });
    return request<{ ticker: string; insiders: InsiderTransaction[]; count: number }>(`/stocks/${encodeURIComponent(ticker)}/insiders${query}`);
  },

  // ── Institutions ────────────────────────────────────────────────
  /** Fetch institutional holdings for a specific ticker. */
  getStockInstitutions(
    ticker: string,
    limit?: number,
  ): Promise<{ ticker: string; institutions: InstitutionalHolding[]; count: number }> {
    const query = buildQuery({ limit });
    return request<{ ticker: string; institutions: InstitutionalHolding[]; count: number }>(
      `/stocks/${encodeURIComponent(ticker)}/institutions${query}`,
    );
  },

  // ── Catalysts ───────────────────────────────────────────────────
  /** Fetch catalysts for a specific ticker. */
  getStockCatalysts(ticker: string): Promise<{ ticker: string; catalysts: Catalyst[]; count: number }> {
    return request<{ ticker: string; catalysts: Catalyst[]; count: number }>(`/stocks/${encodeURIComponent(ticker)}/catalysts`);
  },

  // ── Insights ────────────────────────────────────────────────────
  /** Fetch AI-generated insights for a specific ticker. */
  getStockInsights(ticker: string): Promise<{ ticker: string; insights: Insight[]; count: number }> {
    return request<{ ticker: string; insights: Insight[]; count: number }>(`/stocks/${encodeURIComponent(ticker)}/insights`);
  },

  // ── Summary ─────────────────────────────────────────────────────
  /** Fetch the complete summary (news + insiders + institutions + catalysts + insights) for a ticker. */
  getStockSummary(ticker: string): Promise<StockSummary> {
    return request<StockSummary>(`/stocks/${encodeURIComponent(ticker)}/summary`);
  },

  // ── Refresh ─────────────────────────────────────────────────────
  /** Get the current data-refresh status. */
  getRefreshStatus(): Promise<{ last_refresh: any; is_running: boolean }> {
    return request<{ last_refresh: any; is_running: boolean }>('/refresh-status');
  },

  /** Trigger a manual data refresh for all tracked stocks. */
  triggerRefresh(): Promise<{ message: string }> {
    return request<{ message: string }>('/refresh', { method: 'POST' });
  },

  // ── Push Notifications ──────────────────────────────────────────
  /** Register an Expo push token with the backend. */
  registerPushToken(
    token: string,
    deviceId?: string,
  ): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/push-token', {
      method: 'POST',
      body: JSON.stringify({ token, deviceId }),
    });
  },
};
