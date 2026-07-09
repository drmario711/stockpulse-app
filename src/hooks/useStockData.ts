import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { REFRESH_INTERVAL } from '../utils/constants';
import type {
  Stock,
  NewsItem,
  InsiderTransaction,
  InstitutionalHolding,
  Catalyst,
  Insight,
  RefreshStatus,
  StockSummary,
} from '../utils/constants';

// ─── Query Keys ──────────────────────────────────────────────────────

export const queryKeys = {
  stocks: ['stocks'] as const,
  stockNews: (ticker: string) => ['stockNews', ticker] as const,
  stockInsiders: (ticker: string) => ['stockInsiders', ticker] as const,
  stockInstitutions: (ticker: string) => ['stockInstitutions', ticker] as const,
  stockCatalysts: (ticker: string) => ['stockCatalysts', ticker] as const,
  stockInsights: (ticker: string) => ['stockInsights', ticker] as const,
  stockSummary: (ticker: string) => ['stockSummary', ticker] as const,
  recentNews: ['recentNews'] as const,
  refreshStatus: ['refreshStatus'] as const,
};

// ─── Hooks ───────────────────────────────────────────────────────────

/**
 * Fetch the full list of tracked stocks.
 * Auto-refreshes every 30 minutes.
 */
export function useStocks() {
  return useQuery<{ stocks: Stock[]; count: number }, Error>({
    queryKey: queryKeys.stocks,
    queryFn: () => api.getStocks(),
    staleTime: REFRESH_INTERVAL,
    refetchInterval: REFRESH_INTERVAL,
    retry: 2,
  });
}

/**
 * Fetch news articles for a specific ticker.
 * Auto-refreshes every 30 minutes.
 */
export function useStockNews(ticker: string) {
  return useQuery<{ ticker: string; news: NewsItem[]; count: number }, Error>({
    queryKey: queryKeys.stockNews(ticker),
    queryFn: () => api.getStockNews(ticker),
    enabled: !!ticker,
    staleTime: REFRESH_INTERVAL / 2,
    refetchInterval: REFRESH_INTERVAL,
    retry: 2,
  });
}

/**
 * Fetch insider transactions for a specific ticker.
 */
export function useStockInsiders(ticker: string) {
  return useQuery<{ ticker: string; insiders: InsiderTransaction[]; count: number }, Error>({
    queryKey: queryKeys.stockInsiders(ticker),
    queryFn: () => api.getStockInsiders(ticker),
    enabled: !!ticker,
    staleTime: REFRESH_INTERVAL,
    retry: 2,
  });
}

/**
 * Fetch institutional holdings for a specific ticker.
 */
export function useStockInstitutions(ticker: string) {
  return useQuery<{ ticker: string; institutions: InstitutionalHolding[]; count: number }, Error>({
    queryKey: queryKeys.stockInstitutions(ticker),
    queryFn: () => api.getStockInstitutions(ticker),
    enabled: !!ticker,
    staleTime: REFRESH_INTERVAL,
    retry: 2,
  });
}

/**
 * Fetch future catalysts for a specific ticker.
 */
export function useStockCatalysts(ticker: string) {
  return useQuery<{ ticker: string; catalysts: Catalyst[]; count: number }, Error>({
    queryKey: queryKeys.stockCatalysts(ticker),
    queryFn: () => api.getStockCatalysts(ticker),
    enabled: !!ticker,
    staleTime: REFRESH_INTERVAL,
    retry: 2,
  });
}

/**
 * Fetch AI-generated insights ("nedopalky") for a specific ticker.
 */
export function useStockInsights(ticker: string) {
  return useQuery<{ ticker: string; insights: Insight[]; count: number }, Error>({
    queryKey: queryKeys.stockInsights(ticker),
    queryFn: () => api.getStockInsights(ticker),
    enabled: !!ticker,
    staleTime: REFRESH_INTERVAL,
    retry: 2,
  });
}

/**
 * Fetch the complete summary for a specific ticker
 * (news + insiders + institutions + catalysts + insights).
 */
export function useStockSummary(ticker: string) {
  return useQuery<StockSummary, Error>({
    queryKey: queryKeys.stockSummary(ticker),
    queryFn: () => api.getStockSummary(ticker),
    enabled: !!ticker,
    staleTime: REFRESH_INTERVAL / 2,
    refetchInterval: REFRESH_INTERVAL,
    retry: 2,
  });
}

/**
 * Fetch recent news across all tracked stocks.
 * Auto-refreshes every 30 minutes.
 */
export function useRecentNews() {
  return useQuery<{ news: NewsItem[]; count: number }, Error>({
    queryKey: queryKeys.recentNews,
    queryFn: () => api.getRecentNews(),
    staleTime: REFRESH_INTERVAL / 2,
    refetchInterval: REFRESH_INTERVAL,
    retry: 2,
  });
}

/**
 * Fetch the current data-refresh status.
 * Polls every 30 seconds so the UI stays up-to-date.
 */
export function useRefreshStatus() {
  return useQuery<{ last_refresh: any; is_running: boolean }, Error>({
    queryKey: queryKeys.refreshStatus,
    queryFn: () => api.getRefreshStatus(),
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: 1,
  });
}

/**
 * Mutation that triggers a manual data refresh.
 * Invalidates all queries on success so the UI picks up fresh data.
 */
export function useManualRefresh() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.triggerRefresh(),
    onSuccess: () => {
      // Invalidate everything so all screens refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.stocks });
      queryClient.invalidateQueries({ queryKey: queryKeys.recentNews });
      queryClient.invalidateQueries({ queryKey: queryKeys.refreshStatus });
    },
  });
}
