import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNotifications } from '@/src/hooks/useNotifications';

export default function SettingsScreen() {
  const { expoPushToken } = useNotifications();
  const [newsNotifications, setNewsNotifications] = useState(true);
  const [insiderNotifications, setInsiderNotifications] = useState(true);
  const [breakingNotifications, setBreakingNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const toggleSwitch = (setter: (v: boolean) => void, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(!value);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Push Token Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📱 Push Notifikace</Text>
        <View style={styles.tokenCard}>
          <Ionicons
            name={expoPushToken ? 'checkmark-circle' : 'alert-circle'}
            size={20}
            color={expoPushToken ? '#10B981' : '#EF4444'}
          />
          <Text style={styles.tokenText}>
            {expoPushToken ? 'Token registrován' : 'Token neregistrován'}
          </Text>
        </View>
        {expoPushToken && (
          <Text style={styles.tokenValue} numberOfLines={1}>
            {expoPushToken}
          </Text>
        )}
      </View>

      {/* Notification Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 Nastavení upozornění</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Novinky akcií</Text>
            <Text style={styles.settingDesc}>
              Upozornění na nové zprávy u sledovaných akcií
            </Text>
          </View>
          <Switch
            value={newsNotifications}
            onValueChange={() => toggleSwitch(setNewsNotifications, newsNotifications)}
            trackColor={{ false: '#374151', true: '#6366F1' }}
            thumbColor="#F9FAFB"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Insider transakce</Text>
            <Text style={styles.settingDesc}>
              Upozornění na nákupy a prodeje insiderů
            </Text>
          </View>
          <Switch
            value={insiderNotifications}
            onValueChange={() => toggleSwitch(setInsiderNotifications, insiderNotifications)}
            trackColor={{ false: '#374151', true: '#6366F1' }}
            thumbColor="#F9FAFB"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Breaking News</Text>
            <Text style={styles.settingDesc}>
              Urgentní zprávy (SEC filings, earning surprises)
            </Text>
          </View>
          <Switch
            value={breakingNotifications}
            onValueChange={() => toggleSwitch(setBreakingNotifications, breakingNotifications)}
            trackColor={{ false: '#374151', true: '#6366F1' }}
            thumbColor="#F9FAFB"
          />
        </View>
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Aplikace</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto-refresh (30 min)</Text>
            <Text style={styles.settingDesc}>
              Automatická aktualizace novinek každých 30 minut
            </Text>
          </View>
          <Switch
            value={autoRefresh}
            onValueChange={() => toggleSwitch(setAutoRefresh, autoRefresh)}
            trackColor={{ false: '#374151', true: '#6366F1' }}
            thumbColor="#F9FAFB"
          />
        </View>
      </View>

      {/* Data Sources */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Zdroje dat</Text>
        <View style={styles.sourceList}>
          {[
            { name: 'Finnhub', desc: 'Novinky, insider transakce, kotace', icon: '📈' },
            { name: 'Yahoo Finance', desc: 'RSS feed s novinkami', icon: '🟣' },
            { name: 'Google News', desc: 'Agregované novinky z více zdrojů', icon: '🔍' },
            { name: 'SEC EDGAR', desc: 'Insider filings, 13F institucionální data', icon: '🏛️' },
            { name: 'MarketBeat', desc: 'Analýzy a ratingy', icon: '📊' },
          ].map((source) => (
            <View key={source.name} style={styles.sourceRow}>
              <Text style={styles.sourceIcon}>{source.icon}</Text>
              <View style={styles.sourceInfo}>
                <Text style={styles.sourceName}>{source.name}</Text>
                <Text style={styles.sourceDesc}>{source.desc}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            </View>
          ))}
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ O aplikaci</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>StockPulse v1.0.0</Text>
          <Text style={styles.aboutDesc}>
            Sledování novinek, insider transakcí a skrytých příležitostí pro 15 vybraných akcií.
          </Text>
          <Text style={styles.aboutNote}>
            ⚠️ Informace v aplikaci nejsou investičním doporučením. Vždy provádějte vlastní due diligence.
          </Text>
        </View>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  tokenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1F2E',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#2D3348',
  },
  tokenText: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '600',
  },
  tokenValue: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 8,
    fontFamily: 'SpaceMono',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1F2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2D3348',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '600',
  },
  settingDesc: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  sourceList: {
    backgroundColor: '#1A1F2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D3348',
    overflow: 'hidden',
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3348',
  },
  sourceIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '600',
  },
  sourceDesc: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  aboutCard: {
    backgroundColor: '#1A1F2E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2D3348',
  },
  aboutTitle: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  aboutDesc: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  aboutNote: {
    color: '#F59E0B',
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
