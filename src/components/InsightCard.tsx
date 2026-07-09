import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { cs } from 'date-fns/locale/cs';
import { colors, spacing, borderRadius, fontSize, shadows } from '@/src/utils/theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Props ───────────────────────────────────────────────────────────

interface InsightCardProps {
  title: string;
  description: string;
  context?: string;
  retailMeaning?: string;
  category: 'insider' | 'institutional' | 'sector' | 'sentiment' | string;
  sources?: string[];
  importance: number; // 1–5
  updatedAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function getCategoryConfig(category: string) {
  switch (category) {
    case 'insider':
    case 'insider_trend':
      return {
        gradient: ['#10B981', '#059669'] as [string, string],
        label: 'Insider',
        color: '#10B981',
      };
    case 'institutional':
    case 'institutional_change':
      return {
        gradient: ['#3B82F6', '#2563EB'] as [string, string],
        label: 'Institucionální',
        color: '#3B82F6',
      };
    case 'sector':
      return {
        gradient: ['#F59E0B', '#D97706'] as [string, string],
        label: 'Sektorový',
        color: '#F59E0B',
      };
    case 'sentiment':
    case 'news_sentiment':
      return {
        gradient: ['#A855F7', '#7C3AED'] as [string, string],
        label: 'Sentiment',
        color: '#A855F7',
      };
    default:
      return {
        gradient: ['#6366F1', '#4F46E5'] as [string, string],
        label: 'Obecný',
        color: '#6366F1',
      };
  }
}

// ─── Component ───────────────────────────────────────────────────────

export default function InsightCard({
  title,
  description,
  context,
  retailMeaning,
  category,
  sources,
  importance,
  updatedAt,
}: InsightCardProps) {
  const [contextExpanded, setContextExpanded] = useState(false);

  const config = getCategoryConfig(category);

  const relativeTime = (() => {
    try {
      return formatDistanceToNow(new Date(updatedAt), { addSuffix: true, locale: cs });
    } catch {
      return '';
    }
  })();

  const toggleContext = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setContextExpanded((prev) => !prev);
  }, []);

  // Render importance dots
  const importanceDots = Array.from({ length: 5 }, (_, i) => (
    <View
      key={i}
      style={[
        styles.importanceDot,
        {
          backgroundColor: i < importance ? config.color : 'rgba(255,255,255,0.1)',
        },
      ]}
    />
  ));

  return (
    <View style={styles.outerWrapper}>
      {/* Gradient border effect */}
      <LinearGradient
        colors={[config.gradient[0], config.gradient[1], 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <View style={styles.card}>
          {/* Header: nedopalek badge + category */}
          <View style={styles.headerRow}>
            <View style={styles.nedopalekBadge}>
              <Text style={styles.nedopalekText}>💎 NEDOPALEK</Text>
            </View>
            <View style={[styles.categoryBadge, { backgroundColor: `${config.color}22` }]}>
              <Text style={[styles.categoryLabel, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Description */}
          <Text style={styles.description}>{description}</Text>

          {/* Importance indicator */}
          <View style={styles.importanceRow}>
            <Text style={styles.importanceLabel}>Důležitost</Text>
            <View style={styles.importanceDots}>{importanceDots}</View>
          </View>

          {/* Expandable context */}
          {context && (
            <Pressable onPress={toggleContext} style={styles.contextToggle}>
              <Ionicons
                name={contextExpanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={colors.text.muted}
              />
              <Text style={styles.contextToggleText}>
                {contextExpanded ? 'Skrýt kontext' : 'Zobrazit kontext'}
              </Text>
            </Pressable>
          )}

          {contextExpanded && context && (
            <View style={styles.contextSection}>
              <Text style={styles.contextText}>{context}</Text>
            </View>
          )}

          {/* Retail meaning section */}
          {retailMeaning && (
            <View style={styles.retailSection}>
              <Text style={styles.retailTitle}>
                🎯 Co to znamená pro retail investory
              </Text>
              <Text style={styles.retailText}>{retailMeaning}</Text>
            </View>
          )}

          {/* Sources */}
          {sources && sources.length > 0 && (
            <View style={styles.sourcesSection}>
              <Text style={styles.sourcesTitle}>Zdroje:</Text>
              {sources.map((source, index) => (
                <Text key={index} style={styles.sourceItem}>
                  • {source}
                </Text>
              ))}
            </View>
          )}

          {/* Footer: updated time */}
          <View style={styles.footer}>
            <Ionicons name="time-outline" size={11} color={colors.text.muted} />
            <Text style={styles.footerText}>Aktualizováno {relativeTime}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  outerWrapper: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    ...shadows.card,
  },
  gradientBorder: {
    borderRadius: borderRadius.lg,
    padding: 1.5,
  },
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg - 1,
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  nedopalekBadge: {
    backgroundColor: 'rgba(99,102,241,0.12)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
  },
  nedopalekText: {
    color: '#818CF8',
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  categoryLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
    lineHeight: 26,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    lineHeight: 21,
    marginBottom: spacing.sm,
  },
  importanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  importanceLabel: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },
  importanceDots: {
    flexDirection: 'row',
    gap: 4,
  },
  importanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  contextToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  contextToggleText: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
    fontWeight: '500',
  },
  contextSection: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  contextText: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  retailSection: {
    backgroundColor: 'rgba(99,102,241,0.08)',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
  },
  retailTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  retailText: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  sourcesSection: {
    marginBottom: spacing.sm,
  },
  sourcesTitle: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    fontWeight: '600',
    marginBottom: 2,
  },
  sourceItem: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },
});
