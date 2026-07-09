import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, useSettings } from '@/src/context/SettingsContext';

export default function TabLayout() {
  const colors = useThemeColors();
  const { themeMode } = useSettings();

  const isLight = themeMode === 'light';
  const isBest = themeMode === 'best';

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: isBest ? 'rgba(10, 14, 23, 0.85)' : isLight ? '#FFFFFF' : '#0A0E17',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: isBest ? 'rgba(245, 158, 11, 0.3)' : isLight ? '#E2E8F0' : '#1F2937',
        },
        headerTintColor: isLight ? '#0F172A' : '#F9FAFB',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 20,
        },
        tabBarStyle: {
          backgroundColor: isBest ? 'rgba(17, 24, 39, 0.9)' : isLight ? '#FFFFFF' : '#111827',
          borderTopColor: isBest ? 'rgba(245, 158, 11, 0.3)' : isLight ? '#E2E8F0' : '#1F2937',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: isBest ? '#F59E0B' : '#6366F1',
        tabBarInactiveTintColor: isLight ? '#64748B' : '#6B7280',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Přehled',
          headerTitle: '📈 StockPulse',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Novinky',
          headerTitle: '🔔 Centrum zpráv',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Nastavení',
          headerTitle: '⚙️ Nastavení',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
