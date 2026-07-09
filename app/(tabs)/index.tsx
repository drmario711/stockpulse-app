import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useStocks, useRefreshStatus, useManualRefresh } from '@/src/hooks/useStockData';
import { useThemeColors } from '@/src/context/SettingsContext';
import StockCard from '@/src/components/StockCard';
import RefreshStatus from '@/src/components/RefreshStatus';

const SECTOR_ORDER = ['energy', 'biotech', 'mining', 'tech'];
const SECTOR_NAMES: Record<string, string> = {
  energy: '⛽ Energie & Ropa',
  biotech: '🧬 Biotech & Zdraví',
  mining: '⛏️ Těžba & Kovy',
  tech: '💻 Technologie',
};

export default function DashboardScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: stocksData, isLoading, refetch: refetchStocks } = useStocks();
  const { data: refreshStatus } = useRefreshStatus();
  const manualRefresh = useManualRefresh();

  const stocks = stocksData?.stocks || [];

  const filteredStocks = stocks.filter((stock: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (stock.ticker || '').toLowerCase().includes(q) ||
      (stock.company_name || stock.name || '').toLowerCase().includes(q)
    );
  });

  const groupedStocks = SECTOR_ORDER.map((sector) => ({
    sector,
    name: SECTOR_NAMES[sector] || sector,
    stocks: filteredStocks.filter((s: any) => s.sector === sector),
  })).filter((g) => g.stocks.length > 0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await manualRefresh.mutateAsync();
      await refetchStocks();
    } catch (e) {
      console.log('Refresh error:', e);
    }
    setRefreshing(false);
  }, [manualRefresh, refetchStocks]);

  const handleStockPress = useCallback((ticker: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/stock/${ticker}` as any);
  }, [router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Načítám data...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <RefreshStatus
        lastRefresh={refreshStatus?.last_refresh}
        isRunning={refreshStatus?.is_running || manualRefresh.isPending}
        onRefresh={onRefresh}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={['#6366F1']}
            progressBackgroundColor="#1A1F2E"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Hledat akcie..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="characters"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#6B7280" />
            </Pressable>
          )}
        </View>

        {/* Stats summary */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stocks.length}</Text>
            <Text style={styles.statLabel}>Sledované</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>
              {stocks.reduce((sum: number, s: any) => sum + (s.recent_news_24h || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Novinky 24h</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#F59E0B' }]}>
              {stocks.reduce((sum: number, s: any) => sum + (s.total_insider_transactions || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Insider tx</Text>
          </View>
        </View>

        {/* Stock groups by sector */}
        {groupedStocks.map((group) => (
          <View key={group.sector} style={styles.sectorGroup}>
            <Text style={styles.sectorTitle}>{group.name}</Text>
            {group.stocks.map((stock: any) => (
              <StockCard
                key={stock.ticker}
                ticker={stock.ticker}
                name={stock.company_name || stock.name || stock.ticker}
                sector={stock.sector}
                exchange={stock.exchange}
                totalNews={stock.total_news || 0}
                recentNews24h={stock.recent_news_24h || 0}
                onPress={() => handleStockPress(stock.ticker)}
              />
            ))}
          </View>
        ))}

        {filteredStocks.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color="#6B7280" />
            <Text style={styles.emptyText}>Žádné výsledky</Text>
            <Text style={styles.emptySubtext}>
              Zkuste jiný vyhledávací dotaz
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0E17',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1F2E',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2D3348',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#F9FAFB',
    fontSize: 15,
    padding: 0,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1F2E',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D3348',
  },
  statNumber: {
    color: '#F9FAFB',
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectorGroup: {
    marginBottom: 20,
  },
  sectorTitle: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 8,
  },
});
