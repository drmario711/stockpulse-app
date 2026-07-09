import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STOCKS } from '../utils/constants';

export type ThemeMode = 'light' | 'dark' | 'best';

interface SettingsContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  tickerNotifications: Record<string, boolean>;
  toggleTickerNotification: (ticker: string) => void;
}

const defaultTickerNotifs: Record<string, boolean> = {};
STOCKS.forEach((s: any) => {
  defaultTickerNotifs[s.ticker] = true;
});

const SettingsContext = createContext<SettingsContextType>({
  themeMode: 'best',
  setThemeMode: () => {},
  tickerNotifications: defaultTickerNotifs,
  toggleTickerNotification: () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('best');
  const [tickerNotifications, setTickerNotifications] = useState<Record<string, boolean>>(
    defaultTickerNotifs
  );

  useEffect(() => {
    (async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@stockpulse_theme_mode');
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'best') {
          setThemeModeState(savedTheme);
        }
        const savedNotifs = await AsyncStorage.getItem('@stockpulse_ticker_notifs');
        if (savedNotifs) {
          setTickerNotifications({ ...defaultTickerNotifs, ...JSON.parse(savedNotifs) });
        }
      } catch {}
    })();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem('@stockpulse_theme_mode', mode);
    } catch {}
  };

  const toggleTickerNotification = async (ticker: string) => {
    setTickerNotifications((prev) => {
      const next = { ...prev, [ticker]: !prev[ticker] };
      AsyncStorage.setItem('@stockpulse_ticker_notifs', JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  return (
    <SettingsContext.Provider
      value={{
        themeMode,
        setThemeMode,
        tickerNotifications,
        toggleTickerNotification,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);

export function useThemeColors() {
  const { themeMode } = useSettings();
  if (themeMode === 'light') {
    return {
      background: '#F8FAFC',
      card: '#FFFFFF',
      text: '#0F172A',
      subtext: '#475569',
      border: '#E2E8F0',
      headerBg: '#FFFFFF',
    };
  }
  if (themeMode === 'best') {
    return {
      background: 'transparent',
      card: 'rgba(15, 23, 42, 0.62)',
      text: '#F9FAFB',
      subtext: '#D1D5DB',
      border: 'rgba(245, 158, 11, 0.4)',
      headerBg: 'rgba(10, 14, 23, 0.65)',
    };
  }
  return {
    background: '#0A0E17',
    card: '#1A1F2E',
    text: '#F9FAFB',
    subtext: '#9CA3AF',
    border: '#2D3348',
    headerBg: '#0A0E17',
  };
}
