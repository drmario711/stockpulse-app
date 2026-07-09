import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, differenceInSeconds } from 'date-fns';
import { colors, spacing, borderRadius, fontSize } from '@/src/utils/theme';
import { REFRESH_INTERVAL } from '@/src/utils/constants';

// ─── Props ───────────────────────────────────────────────────────────

interface RefreshStatusProps {
  lastRefresh: string | null;
  isRunning: boolean;
  onRefresh: () => void;
}

// ─── Component ───────────────────────────────────────────────────────

export default function RefreshStatus({
  lastRefresh,
  isRunning,
  onRefresh,
}: RefreshStatusProps) {
  const [countdown, setCountdown] = useState('');

  const getRefreshString = () => {
    if (!lastRefresh) return null;
    if (typeof lastRefresh === 'object') {
      return (lastRefresh as any).finished_at || (lastRefresh as any).started_at || null;
    }
    return lastRefresh;
  };

  // Compute countdown to next auto-refresh
  useEffect(() => {
    const timeStr = getRefreshString();
    if (!timeStr) {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const lastDate = new Date(timeStr);
      const nextRefresh = new Date(lastDate.getTime() + REFRESH_INTERVAL);
      const diffSec = differenceInSeconds(nextRefresh, new Date());

      if (diffSec <= 0) {
        setCountdown('brzy');
        return;
      }

      const mins = Math.floor(diffSec / 60);
      const secs = diffSec % 60;
      setCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lastRefresh]);

  const formattedTime = (() => {
    const timeStr = getRefreshString();
    if (!timeStr) return null;
    try {
      return format(new Date(timeStr), 'HH:mm:ss');
    } catch {
      return null;
    }
  })();

  return (
    <View style={styles.container}>
      {/* Status indicator */}
      <View style={styles.statusSection}>
        {isRunning ? (
          <>
            <ActivityIndicator size="small" color={colors.accent.primary} />
            <Text style={styles.statusText}>Aktualizuji...</Text>
          </>
        ) : lastRefresh ? (
          <>
            <Text style={styles.statusIcon}>✅</Text>
            <Text style={styles.statusText}>
              Poslední refresh: {formattedTime}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.statusIcon}>❌</Text>
            <Text style={styles.statusText}>Refresh selhal</Text>
          </>
        )}
      </View>

      {/* Countdown */}
      {!isRunning && countdown !== '' && (
        <View style={styles.countdownSection}>
          <Ionicons name="timer-outline" size={12} color={colors.text.muted} />
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      )}

      {/* Refresh button */}
      <Pressable
        onPress={onRefresh}
        disabled={isRunning}
        style={({ pressed }) => [
          styles.refreshButton,
          isRunning && styles.refreshButtonDisabled,
          pressed && styles.refreshButtonPressed,
        ]}
      >
        <Ionicons
          name="refresh"
          size={14}
          color={isRunning ? colors.text.muted : colors.accent.primary}
        />
        <Text
          style={[
            styles.refreshButtonText,
            isRunning && styles.refreshButtonTextDisabled,
          ]}
        >
          Aktualizovat
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: spacing.sm,
  },
  statusSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusIcon: {
    fontSize: fontSize.md,
  },
  statusText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  countdownSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  countdownText: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    fontVariant: ['tabular-nums'],
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(99,102,241,0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
  },
  refreshButtonPressed: {
    backgroundColor: 'rgba(99,102,241,0.2)',
  },
  refreshButtonDisabled: {
    backgroundColor: 'rgba(107,114,128,0.1)',
    borderColor: 'rgba(107,114,128,0.15)',
  },
  refreshButtonText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.accent.primary,
  },
  refreshButtonTextDisabled: {
    color: colors.text.muted,
  },
});
