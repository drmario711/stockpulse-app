import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ImageBackground, View, StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNotifications } from '@/src/hooks/useNotifications';
import { SettingsProvider, useSettings } from '@/src/context/SettingsContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 2 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    },
  },
});

function NotificationSetup() {
  useNotifications();
  return null;
}

function ThemedRootStack() {
  const { themeMode } = useSettings();

  const getBackgroundColor = () => {
    if (themeMode === 'light') return '#F8FAFC';
    if (themeMode === 'dark') return '#0A0E17';
    return 'transparent';
  };

  const content = (
    <>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: getBackgroundColor() },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="stock/[ticker]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: themeMode === 'light' ? '#FFFFFF' : '#111827' },
            headerTintColor: themeMode === 'light' ? '#0F172A' : '#F9FAFB',
            headerTitleStyle: { fontWeight: '700' },
            presentation: 'card',
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={themeMode === 'light' ? 'dark' : 'light'} />
    </>
  );

  if (themeMode === 'best') {
    return (
      <ImageBackground
        source={require('../assets/images/specialni.jpg')}
        style={styles.bgImage}
        resizeMode="cover"
      >
        <View style={styles.bgOverlay}>{content}</View>
      </ImageBackground>
    );
  }

  return <View style={{ flex: 1, backgroundColor: getBackgroundColor() }}>{content}</View>;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <NotificationSetup />
        <ThemedRootStack />
      </SettingsProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  bgOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 23, 0.82)',
  },
});
