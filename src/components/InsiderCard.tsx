import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale/cs';
import { colors, spacing, borderRadius, fontSize, shadows } from '@/src/utils/theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Props ───────────────────────────────────────────────────────────

interface InsiderCardProps {
  personName: string;
  personTitle: string;
  transactionType: 'buy' | 'sell' | 'exercise' | 'other';
  shares: number;
  price: number | null;
  totalValue: number | null;
  filingDate: string;
  context?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString('en-US')}`;
}

function getTransactionConfig(type: string) {
  switch (type) {
    case 'buy':
      return {
        icon: 'arrow-up-circle' as const,
        color: colors.accent.success,
        bgTint: 'rgba(16,185,129,0.08)',
        borderTint: 'rgba(16,185,129,0.2)',
        label: 'Nákup',
      };
    case 'sell':
      return {
        icon: 'arrow-down-circle' as const,
        color: colors.accent.danger,
        bgTint: 'rgba(239,68,68,0.08)',
        borderTint: 'rgba(239,68,68,0.2)',
        label: 'Prodej',
      };
    case 'exercise':
      return {
        icon: 'swap-horizontal-outline' as const,
        color: colors.accent.warning,
        bgTint: 'rgba(245,158,11,0.08)',
        borderTint: 'rgba(245,158,11,0.2)',
        label: 'Uplatnění opcí',
      };
    default:
      return {
        icon: 'ellipse-outline' as const,
        color: colors.text.muted,
        bgTint: 'rgba(107,114,128,0.08)',
        borderTint: 'rgba(107,114,128,0.2)',
        label: 'Jiné',
      };
  }
}

// ─── Component ───────────────────────────────────────────────────────

export default function InsiderCard({
  personName,
  personTitle,
  transactionType,
  shares,
  price,
  totalValue,
  filingDate,
  context,
}: InsiderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const config = getTransactionConfig(transactionType);

  const formattedDate = (() => {
    try {
      return format(new Date(filingDate), 'd. MMMM yyyy', { locale: cs });
    } catch {
      return filingDate;
    }
  })();

  const toggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={context ? toggleExpand : undefined}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          { backgroundColor: config.bgTint, borderColor: config.borderTint },
        ]}
      >
        {/* Header row */}
        <View style={styles.headerRow}>
          <Ionicons name={config.icon} size={28} color={config.color} />
          <View style={styles.headerInfo}>
            <Text style={styles.personName}>{personName}</Text>
            <Text style={styles.personTitle}>{personTitle}</Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: `${config.color}22` }]}>
            <Text style={[styles.typeLabel, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>

        {/* Transaction details */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Akcie</Text>
            <Text style={[styles.detailValue, { color: config.color }]}>
              {shares.toLocaleString('cs-CZ')}
            </Text>
          </View>

          {price != null && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Cena/akcie</Text>
              <Text style={styles.detailValue}>${price.toFixed(2)}</Text>
            </View>
          )}

          {totalValue != null && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Celkem</Text>
              <Text style={[styles.detailValue, { color: config.color }]}>
                {formatCompact(totalValue)}
              </Text>
            </View>
          )}
        </View>

        {/* Date */}
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={12} color={colors.text.muted} />
          <Text style={styles.dateText}>{formattedDate}</Text>

          {context && (
            <View style={styles.expandHint}>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={colors.text.muted}
              />
            </View>
          )}
        </View>

        {/* Expandable context */}
        {expanded && context && (
          <View style={styles.contextSection}>
            <View style={styles.contextDivider} />
            <Text style={styles.contextTitle}>📋 Kontext</Text>
            <Text style={styles.contextText}>{context}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    ...shadows.subtle,
  },
  card: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  personName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
  },
  personTitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 1,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  typeLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    flex: 1,
  },
  expandHint: {
    opacity: 0.6,
  },
  contextSection: {
    marginTop: spacing.sm,
  },
  contextDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: spacing.sm,
  },
  contextTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  contextText: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
