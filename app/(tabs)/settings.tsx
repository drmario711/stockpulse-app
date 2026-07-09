import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSettings, useThemeColors, ThemeMode } from '@/src/context/SettingsContext';
import { STOCKS } from '@/src/utils/constants';

export default function SettingsScreen() {
  const { themeMode, setThemeMode, tickerNotifications, toggleTickerNotification } = useSettings();
  const colors = useThemeColors();
  const [newsNotifications, setNewsNotifications] = useState(true);
  const [insiderNotifications, setInsiderNotifications] = useState(true);
  const [breakingNotifications, setBreakingNotifications] = useState(true);

  const toggleGlobalSwitch = (setter: (v: boolean) => void, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(!value);
  };

  const handleSelectTheme = (mode: ThemeMode) => {
    Haptics.selectionAsync();
    setThemeMode(mode);
  };

  const content = (
    <>
      {/* Vizuální režim aplikace */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎨 Vizuální režim</Text>
        <Text style={styles.sectionSubtitle}>
          Vyberte si vzhled aplikace podle preferencí
        </Text>

        <View style={styles.themeOptionsRow}>
          <Pressable
            style={[
              styles.themeCard,
              themeMode === 'light' && styles.themeCardActive,
            ]}
            onPress={() => handleSelectTheme('light')}
          >
            <Ionicons
              name="sunny"
              size={24}
              color={themeMode === 'light' ? '#6366F1' : '#9CA3AF'}
            />
            <Text
              style={[
                styles.themeText,
                themeMode === 'light' && styles.themeTextActive,
              ]}
            >
              1. Světlý
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.themeCard,
              themeMode === 'dark' && styles.themeCardActive,
            ]}
            onPress={() => handleSelectTheme('dark')}
          >
            <Ionicons
              name="moon"
              size={24}
              color={themeMode === 'dark' ? '#6366F1' : '#9CA3AF'}
            />
            <Text
              style={[
                styles.themeText,
                themeMode === 'dark' && styles.themeTextActive,
              ]}
            >
              2. Tmavý
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.themeCard,
              themeMode === 'best' && styles.themeCardActiveBest,
            ]}
            onPress={() => handleSelectTheme('best')}
          >
            <Ionicons
              name="sparkles"
              size={24}
              color={themeMode === 'best' ? '#F59E0B' : '#9CA3AF'}
            />
            <Text
              style={[
                styles.themeText,
                themeMode === 'best' && styles.themeTextActiveBest,
              ]}
            >
              3. Nejlepší ✨
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Obecná nastavení upozornění */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 Typy upozornění</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Novinky akcií</Text>
            <Text style={styles.settingDesc}>
              Upozornění na nové zprávy u sledovaných akcií
            </Text>
          </View>
          <Switch
            value={newsNotifications}
            onValueChange={() => toggleGlobalSwitch(setNewsNotifications, newsNotifications)}
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
            onValueChange={() => toggleGlobalSwitch(setInsiderNotifications, insiderNotifications)}
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
            onValueChange={() => toggleGlobalSwitch(setBreakingNotifications, breakingNotifications)}
            trackColor={{ false: '#374151', true: '#6366F1' }}
            thumbColor="#F9FAFB"
          />
        </View>
      </View>

      {/* Nastavení upozornění pro jednotlivé firmy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏢 Upozornění pro jednotlivé firmy</Text>
        <Text style={styles.sectionSubtitle}>
          Zapněte nebo vypněte upozornění pro každou sledovanou firmu zvlášť
        </Text>

        {STOCKS.map((s) => {
          const isEnabled = tickerNotifications[s.ticker] ?? true;
          return (
            <View key={s.ticker} style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>
                  {s.ticker} – {s.name}
                </Text>
                <Text style={styles.settingDesc}>
                  Sektor: {s.sector} ({s.exchange})
                </Text>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleTickerNotification(s.ticker);
                }}
                trackColor={{ false: '#374151', true: '#10B981' }}
                thumbColor="#F9FAFB"
              />
            </View>
          );
        })}
      </View>

      {/* O aplikaci */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ O aplikaci</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>StockPulse 1.0</Text>
          <Text style={styles.aboutDesc}>
            Aplikace pro sledování nejnovějších zpráv, insider transakcí a ověřených aktualit k vašemu portfoliu firem.
          </Text>
          <Text style={styles.aboutNote}>
            Všechna data jsou agregována ze spolehlivých zdrojů: Finnhub API, Yahoo Finance, Google News a SEC EDGAR.
          </Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </>
  );

  if (themeMode === 'best') {
    return (
      <ImageBackground
        source={require('../../assets/images/specialni.jpg')}
        style={{ flex: 1, width: '100%', height: '100%' }}
        resizeMode="cover"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.15)' }}>
          <ScrollView contentContainerStyle={styles.content}>
            {content}
          </ScrollView>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 12,
  },
  themeOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  themeCard: {
    flex: 1,
    backgroundColor: '#1A1F2E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D3348',
  },
  themeCardActive: {
    borderColor: '#6366F1',
    backgroundColor: '#1E2438',
  },
  themeCardActiveBest: {
    borderColor: '#F59E0B',
    backgroundColor: '#262118',
  },
  themeText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  themeTextActive: {
    color: '#6366F1',
    fontWeight: '700',
  },
  themeTextActiveBest: {
    color: '#F59E0B',
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1F2E',
    padding: 14,
    borderRadius: 12,
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
    fontSize: 14,
    fontWeight: '600',
  },
  settingDesc: {
    color: '#9CA3AF',
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
