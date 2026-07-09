import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, shadows, getSectorColor } from '@/src/utils/theme';

// ─── Props ───────────────────────────────────────────────────────────

interface StockCardProps {
  ticker: string;
  name: string;
  sector: string;
  exchange: string;
  totalNews: number;
  recentNews24h: number;
  onPress: () => void;
}

// ─── Component ───────────────────────────────────────────────────────

export default function StockCard({
  ticker,
  name,
  sector,
  exchange,
  totalNews,
  recentNews24h,
  onPress,
}: StockCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for the news badge
  React.useEffect(() => {
    if (recentNews24h > 0) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
  }, [recentNews24h, pulseAnim]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
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

  const accentColor = getSectorColor(sector);

  // Exchange badge color
  const exchangeColor = (() => {
    switch (exchange.toUpperCase()) {
      case 'NYSE':
        return colors.accent.info;
      case 'NASDAQ':
        return colors.accent.primary;
      case 'TSX':
      case 'TSX-V':
        return colors.accent.warning;
      default:
        return colors.text.muted;
    }
  })();

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        {/* Left accent bar */}
        <View style={[styles.accent, { backgroundColor: accentColor }]} />

        {/* Content */}
        <View style={styles.content}>
          {/* Top row: ticker + exchange */}
          <View style={styles.topRow}>
            <Text style={styles.ticker}>{ticker}</Text>
            <View style={[styles.exchangeBadge, { backgroundColor: `${exchangeColor}22` }]}>
              <Text style={[styles.exchangeText, { color: exchangeColor }]}>
                {exchange}
              </Text>
            </View>
          </View>

          {/* Company name */}
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>

          {/* Bottom row: sector + news count */}
          <View style={styles.bottomRow}>
            <Text style={styles.sectorLabel}>{sector}</Text>
            <Text style={styles.totalNewsLabel}>
              {totalNews} {totalNews === 1 ? 'zpráva' : totalNews >= 2 && totalNews <= 4 ? 'zprávy' : 'zpráv'}
            </Text>
          </View>
        </View>

        {/* Right side: news badge + chevron */}
        <View style={styles.rightSection}>
          {recentNews24h > 0 && (
            <Animated.View
              style={[
                styles.newsBadge,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Text style={styles.newsBadgeText}>{recentNews24h}</Text>
            </Animated.View>
          )}
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.text.muted}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.md,
    ...shadows.card,
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  ticker: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  exchangeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  exchangeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  name: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectorLabel: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: colors.text.muted,
    textTransform: 'capitalize',
  },
  totalNewsLabel: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: spacing.md,
    gap: spacing.sm,
  },
  newsBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsBadgeText: {
    color: '#FFFFFF',
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
});
