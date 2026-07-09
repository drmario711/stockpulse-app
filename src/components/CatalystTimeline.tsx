import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type Catalyst } from '@/src/utils/constants';

interface CatalystTimelineProps {
  catalysts: Catalyst[];
}

export default function CatalystTimeline({ catalysts }: CatalystTimelineProps) {
  if (!catalysts || catalysts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={48} color="#6B7280" />
        <Text style={styles.emptyTitle}>Žádné známé katalyzátory</Text>
        <Text style={styles.emptySubtitle}>
          Aktuálně neevidujeme žádné blížící se události pro tuto akcii.
        </Text>
      </View>
    );
  }

  const getCategoryBadge = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'earnings':
        return { label: 'Výsledky (Earnings)', color: '#F59E0B', icon: 'stats-chart' };
      case 'fda':
        return { label: 'FDA / Klinická data', color: '#06B6D4', icon: 'medkit' };
      case 'conference':
        return { label: 'Konference & Prezentace', color: '#8B5CF6', icon: 'mic' };
      case 'regulatory':
        return { label: 'Regulace & Deadlines', color: '#EF4444', icon: 'shield-checkmark' };
      default:
        return { label: 'Katalyzátor', color: '#6366F1', icon: 'flag' };
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Datum neupřesněno';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('cs-CZ', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>📅 Časová osa katalyzátorů</Text>
      <View style={styles.timeline}>
        {catalysts.map((item, index) => {
          const badge = getCategoryBadge(item.category || item.catalystType || '');
          const isLast = index === catalysts.length - 1;

          return (
            <View key={item.id || index} style={styles.itemRow}>
              {/* Timeline left col */}
              <View style={styles.lineCol}>
                <View style={[styles.dot, { backgroundColor: badge.color }]} />
                {!isLast && <View style={styles.verticalLine} />}
              </View>

              {/* Card content */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, { backgroundColor: badge.color + '20' }]}>
                    <Ionicons name={badge.icon as any} size={12} color={badge.color} style={{ marginRight: 4 }} />
                    <Text style={[styles.badgeText, { color: badge.color }]}>
                      {badge.label}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                </View>

                <Text style={styles.titleText}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.descText}>{item.description}</Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  sectionTitle: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 4,
  },
  itemRow: {
    flexDirection: 'row',
  },
  lineCol: {
    alignItems: 'center',
    width: 28,
    marginRight: 10,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 4,
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#2D3348',
    marginVertical: 4,
  },
  card: {
    flex: 1,
    backgroundColor: '#1A1F2E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2D3348',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dateText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  titleText: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  descText: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#9CA3AF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
});
