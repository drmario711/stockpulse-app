import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  useStockNews,
  useStockInsiders,
  useStockInsights,
  useStockCatalysts,
  useRefreshStatus,
} from '@/src/hooks/useStockData';
import { STOCKS } from '@/src/utils/constants';
import { getSectorColor } from '@/src/utils/theme';
import NewsItem from '@/src/components/NewsItem';
import InsiderCard from '@/src/components/InsiderCard';
import InsightCard from '@/src/components/InsightCard';
import CatalystTimeline from '@/src/components/CatalystTimeline';

type TabKey = 'news' | 'insiders' | 'insights' | 'catalysts';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'news', label: 'Novinky', icon: 'newspaper' },
  { key: 'insiders', label: 'Insideři', icon: 'people' },
  { key: 'insights', label: 'Nedopalky', icon: 'diamond' },
  { key: 'catalysts', label: 'Katalyzátory', icon: 'calendar' },
];

export default function StockDetailScreen() {
  const { ticker } = useLocalSearchParams<{ ticker: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>('news');
  const [refreshing, setRefreshing] = useState(false);

  const stock = STOCKS.find((s) => s.ticker === ticker);
  const sectorColor = getSectorColor(stock?.sector || 'tech');

  const { data: newsData, isLoading: newsLoading, refetch: refetchNews } = useStockNews(ticker || '');
  const { data: insidersData, isLoading: insidersLoading, refetch: refetchInsiders } = useStockInsiders(ticker || '');
  const { data: insightsData, isLoading: insightsLoading, refetch: refetchInsights } = useStockInsights(ticker || '');
  const { data: catalystsData, isLoading: catalystsLoading, refetch: refetchCatalysts } = useStockCatalysts(ticker || '');

  const news = newsData?.news || [];
  const insiders = insidersData?.insiders || [];
  const insights = insightsData?.insights || [];
  const catalysts = catalystsData?.catalysts || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Promise.all([refetchNews(), refetchInsiders(), refetchInsights(), refetchCatalysts()]);
    setRefreshing(false);
  }, [refetchNews, refetchInsiders, refetchInsights, refetchCatalysts]);

  const isLoading = activeTab === 'news' ? newsLoading :
                    activeTab === 'insiders' ? insidersLoading :
                    activeTab === 'insights' ? insightsLoading :
                    catalystsLoading;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: `${ticker} – ${stock?.name || ''}`,
        }}
      />

      {/* Stock Header */}
      <View style={[styles.header, { borderLeftColor: sectorColor }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.ticker}>{ticker}</Text>
            <Text style={styles.companyName}>{stock?.name}</Text>
          </View>
          <View style={styles.headerBadges}>
            <View style={[styles.exchangeBadge, { backgroundColor: sectorColor + '30', borderColor: sectorColor }]}>
              <Text style={[styles.exchangeText, { color: sectorColor }]}>{stock?.exchange}</Text>
            </View>
            <View style={[styles.sectorBadge, { backgroundColor: sectorColor + '20' }]}>
              <Text style={[styles.sectorText, { color: sectorColor }]}>
                {stock?.sector === 'energy' ? '⛽' : stock?.sector === 'biotech' ? '🧬' : stock?.sector === 'mining' ? '⛏️' : '💻'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{news.length}</Text>
            <Text style={styles.statLabel}>Zpráv</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>
              {insiders.filter((i: any) => i.transaction_type === 'buy').length}
            </Text>
            <Text style={styles.statLabel}>Nákupů</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>
              {insiders.filter((i: any) => i.transaction_type === 'sell').length}
            </Text>
            <Text style={styles.statLabel}>Prodejů</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{insights.length}</Text>
            <Text style={styles.statLabel}>Nedopalky</Text>
          </View>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => {
              setActiveTab(tab.key);
              Haptics.selectionAsync();
            }}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? '#6366F1' : '#6B7280'}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tab Content */}
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
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Načítám data...</Text>
          </View>
        ) : (
          <>
            {/* NEWS TAB */}
            {activeTab === 'news' && (
              <>
                {news.length === 0 ? (
                  <EmptyState icon="newspaper-outline" text="Zatím žádné novinky" />
                ) : (
                  news.map((item: any, i: number) => {
                    const isRecent = new Date(item.published_at).getTime() > Date.now() - 3600000;
                    return (
                      <NewsItem
                        key={item.id || i}
                        title={item.title}
                        summary={item.summary}
                        source={item.source}
                        url={item.url}
                        publishedAt={item.published_at}
                        isBreaking={item.is_breaking === 1}
                        isNew={isRecent}
                      />
                    );
                  })
                )}
              </>
            )}

            {/* INSIDERS TAB */}
            {activeTab === 'insiders' && (
              <>
                {insiders.length === 0 ? (
                  <EmptyState icon="people-outline" text="Žádné insider transakce" />
                ) : (
                  <>
                    {/* Summary */}
                    <View style={styles.insiderSummary}>
                      <View style={[styles.insiderSummaryItem, { backgroundColor: '#10B98115' }]}>
                        <Ionicons name="trending-up" size={20} color="#10B981" />
                        <Text style={[styles.insiderSummaryText, { color: '#10B981' }]}>
                          {insiders.filter((i: any) => i.transaction_type === 'buy').length} nákupů
                        </Text>
                      </View>
                      <View style={[styles.insiderSummaryItem, { backgroundColor: '#EF444415' }]}>
                        <Ionicons name="trending-down" size={20} color="#EF4444" />
                        <Text style={[styles.insiderSummaryText, { color: '#EF4444' }]}>
                          {insiders.filter((i: any) => i.transaction_type === 'sell').length} prodejů
                        </Text>
                      </View>
                    </View>
                    {insiders.map((item: any, i: number) => (
                      <InsiderCard
                        key={item.id || i}
                        personName={item.person_name}
                        personTitle={item.person_title}
                        transactionType={item.transaction_type}
                        shares={item.shares}
                        price={item.price}
                        totalValue={item.total_value}
                        filingDate={item.filing_date}
                        context={item.context}
                      />
                    ))}
                  </>
                )}
              </>
            )}

            {/* INSIGHTS TAB */}
            {activeTab === 'insights' && (
              <>
                <View style={styles.insightsHeader}>
                  <Text style={styles.insightsTitle}>💎 Top nedopalky</Text>
                  <Text style={styles.insightsSubtitle}>
                    Skryté příležitosti a přehlížené informace
                  </Text>
                </View>
                {insights.length === 0 ? (
                  <EmptyState icon="diamond-outline" text="Žádné nedopalky k zobrazení" />
                ) : (
                  insights.map((item: any, i: number) => (
                    <InsightCard
                      key={item.id || i}
                      title={item.title}
                      description={item.description}
                      context={item.context}
                      retailMeaning={item.retail_meaning}
                      category={item.category}
                      sources={item.sources}
                      importance={item.importance}
                      updatedAt={item.updated_at}
                    />
                  ))
                )}
              </>
            )}

            {/* CATALYSTS TAB */}
            {activeTab === 'catalysts' && (
              <CatalystTimeline catalysts={catalysts} />
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon as any} size={48} color="#6B7280" />
      <Text style={styles.emptyText}>{text}</Text>
      <Text style={styles.emptySubtext}>Stáhněte dolů pro aktualizaci</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
  header: {
    backgroundColor: '#1A1F2E',
    padding: 16,
    borderLeftWidth: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3348',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ticker: {
    color: '#F9FAFB',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
  },
  companyName: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 2,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  exchangeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  exchangeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectorBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectorText: {
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#0A0E17',
    borderRadius: 10,
    padding: 10,
  },
  statValue: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#2D3348',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#6366F1',
  },
  tabText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#6366F1',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 16,
    fontSize: 16,
  },
  insiderSummary: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  insiderSummaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  insiderSummaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  insightsHeader: {
    marginBottom: 16,
  },
  insightsTitle: {
    color: '#F9FAFB',
    fontSize: 20,
    fontWeight: '800',
  },
  insightsSubtitle: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 4,
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
