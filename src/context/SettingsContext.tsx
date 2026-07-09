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
