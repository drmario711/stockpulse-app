import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_BASE_URL } from '@/src/utils/constants';

// Bezpečné načtení expo-notifications (pouze mimo Expo Go na Androidu)
let Notifications: any = null;
try {
  if (Constants.appOwnership !== 'expo') {
    Notifications = require('expo-notifications');
    Notifications?.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch {
  Notifications = null;
}

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any | null>(null);
  const notificationListener = useRef<any | undefined>(undefined);
  const responseListener = useRef<any | undefined>(undefined);

  const registerForPushNotifications = useCallback(async () => {
    try {
      if (!Notifications || Constants.appOwnership === 'expo') {
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return null;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('stock-news', {
          name: 'Novinky akcií',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366F1',
          sound: 'default',
        });
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: undefined,
      });
      const token = tokenData.data;
      setExpoPushToken(token);

      try {
        await fetch(`${API_BASE_URL}/push-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, deviceId: Platform.OS }),
        });
      } catch {}

      return token;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    registerForPushNotifications();

    if (Notifications && Constants.appOwnership !== 'expo') {
      notificationListener.current = Notifications.addNotificationReceivedListener(
        (notification: any) => {
          setNotification(notification);
        }
      );

      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response: any) => {
          const data = response?.notification?.request?.content?.data;
          if (data?.ticker) {
            console.log('Navigate to:', data.ticker);
          }
        }
      );
    }

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [registerForPushNotifications]);

  return {
    expoPushToken,
    notification,
    registerForPushNotifications,
  };
}
