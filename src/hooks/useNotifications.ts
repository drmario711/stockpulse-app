import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { API_BASE_URL } from '@/src/utils/constants';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

  const registerForPushNotifications = useCallback(async () => {
    try {
      // Check permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return null;
      }

      // Set up Android notification channels
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('stock-news', {
          name: 'Novinky akcií',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366F1',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('insider-trades', {
          name: 'Insider transakce',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#10B981',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('breaking-news', {
          name: 'Breaking News',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#EF4444',
          sound: 'default',
        });
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: undefined, // Will use the project ID from app.json
      });
      const token = tokenData.data;
      setExpoPushToken(token);

      // Register token with backend
      try {
        await fetch(`${API_BASE_URL}/push-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, deviceId: Platform.OS }),
        });
        console.log('Push token registered:', token);
      } catch (err) {
        console.log('Failed to register push token with backend:', err);
      }

      return token;
    } catch (error) {
      console.log('Error registering for push notifications:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    registerForPushNotifications();

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    // Listen for notification interactions (taps)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        // Handle navigation based on notification data
        if (data?.ticker) {
          // Navigation will be handled by the component using this hook
          console.log('Navigate to:', data.ticker);
        }
      }
    );

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
