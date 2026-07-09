import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Linking,
} from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { cs } from 'date-fns/locale/cs';
import { colors, spacing, borderRadius, fontSize, shadows, getNewsAgeColor } from '@/src/utils/theme';

// ─── Props ───────────────────────────────────────────────────────────

interface NewsItemProps {
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  isBreaking?: boolean;
  isNew?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────

export default function NewsItem({
  title,
  summary,
  source,
  url,
  publishedAt,
  isBreaking = false,
  isNew = false,
}: NewsItemProps) {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Pulse glow for "NOVÉ" badge
  React.useEffect(() => {
    if (isNew) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isNew, pulseAnim]);

  const ageColor = getNewsAgeColor(publishedAt);

  const relativeTime = formatDistanceToNow(new Date(publishedAt), {
    addSuffix: true,
    locale: cs,
  });

  const handlePress = () => {
    Linking.openURL(url).catch(() => {
      // Silently handle – URL may be invalid
    });
  };

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      {/* Left age-color bar */}
      <View style={[styles.ageBar, { backgroundColor: ageColor }]} />

      <View style={styles.content}>
        {/* Badges row */}
        {(isBreaking || isNew) && (
          <View style={styles.badgeRow}>
            {isBreaking && (
              <View style={styles.breakingBadge}>
                <Text style={styles.breakingText}>🔴 BREAKING</Text>
              </View>
            )}
            {isNew && (
              <Animated.View
                style={[
                  styles.newBadge,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Text style={styles.newBadgeText}>NOVÉ</Text>
              </Animated.View>
            )}
          </View>
        )}

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {/* Summary */}
        {summary ? (
          <Text style={styles.summary} numberOfLines={3}>
            {summary}
          </Text>
        ) : null}

        {/* Footer: source + time */}
        <View style={styles.footer}>
          <Text style={styles.source}>{source}</Text>
          <View style={styles.dot} />
          <Text style={styles.time}>{relativeTime}</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    overflow: 'hidden',
    ...shadows.subtle,
  },
  cardPressed: {
    backgroundColor: colors.bg.cardHover,
  },
  ageBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  breakingBadge: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  breakingText: {
    color: colors.news.breaking,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  newBadge: {
    backgroundColor: 'rgba(0,255,136,0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.3)',
  },
  newBadgeText: {
    color: colors.news.fresh,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
    lineHeight: 22,
  },
  summary: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  source: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: colors.text.muted,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.text.muted,
    marginHorizontal: spacing.sm,
  },
  time: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },
});
