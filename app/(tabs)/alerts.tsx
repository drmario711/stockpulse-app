import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRecentNews } from '@/src/hooks/useStockData';
import { useThemeColors } from '@/src/context/SettingsContext';
import NewsItem from '@/src/components/NewsItem';
import { STOCKS } from '@/src/utils/constants';

type FilterType = 'all' | string;

export default function AlertsScreen() {
  const colors = useThemeColors();
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useRecentNews();
  const news = data?.news || [];

  const filteredNews = filter === 'all'
    ? news
    : news.filter((n: any) => n.ticker === filter);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const tickersWithNews = [...new Set(news.map((n: any) => n.ticker))];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <Pressable
          style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}
          onPress={() => { setFilter('all'); Haptics.selectionAsync(); }}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Vše ({news.length})
          </Text>
        </Pressable>
        {tickersWithNews.map((ticker: string) => (
          <Pressable
            key={ticker}
            style={[styles.filterPill, filter === ticker && styles.filterPillActive]}
            onPress={() => { setFilter(ticker); Haptics.selectionAsync(); }}
          >
            <Text style={[styles.filterText, filter === ticker && styles.filterTextActive]}>
              {ticker} ({news.filter((n: any) => n.ticker === ticker).length})
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Načítám novinky...</Text>
        </View>
      ) : (
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
          {filteredNews.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="newspaper-outline" size={48} color="#6B7280" />
              <Text style={styles.emptyText}>Žádné novinky</Text>
              <Text style={styles.emptySubtext}>
                Stáhněte dolů pro aktualizaci
              </Text>
            </View>
          ) : (
            filteredNews.map((item: any, index: number) => {
              const isRecent = new Date(item.published_at).getTime() > Date.now() - 3600000;
              return (
                <View key={item.id || index}>
                  {/* Date separator */}
                  {index === 0 || _differentDay(item.published_at, filteredNews[index - 1]?.published_at) ? (
                    <Text style={styles.dateSeparator}>
                      {_formatDateHeader(item.published_at)}
                    </Text>
                  ) : null}
                  <View style={styles.newsWithTicker}>
                    <View style={styles.tickerBadge}>
                      <Text style={styles.tickerBadgeText}>{item.ticker}</Text>
                    </View>
                    <View style={styles.newsItemWrapper}>
                      <NewsItem
                        title={item.title}
                        summary={item.summary}
                        source={item.source}
                        url={item.url}
                        publishedAt={item.published_at || item.publishedAt || ''}
                        isBreaking={item.is_breaking === 1}
                        isNew={isRecent}
                      />
                    </View>
                  </View>
                </View>
              );
            })
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

function _differentDay(d1?: string, d2?: string) {
  if (!d1 || !d2) return true;
  return new Date(d1).toDateString() !== new Date(d2).toDateString();
}

function _formatDateHeader(dateStr?: string) {
  if (!dateStr) return '📅 Ostatní';
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return '📅 Dnes';
  if (d.toDateString() === yesterday.toDateString()) return '📅 Včera';

  return `📅 ${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
  filterContainer: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1A1F2E',
    borderWidth: 1,
    borderColor: '#2D3348',
  },
  filterPillActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
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
    paddingTop: 12,
  },
  dateSeparator: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  newsWithTicker: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  tickerBadge: {
    backgroundColor: '#6366F1',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginRight: 8,
    marginTop: 12,
  },
  tickerBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  newsItemWrapper: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
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
