import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { notificationService } from './api';
import * as SecureStore from '../utils/storage';

const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === 'storeClient';

const Notifications = !isExpoGo ? require('expo-notifications') : null;

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (isExpoGo || !Notifications) {
    console.warn('Push notifications are not supported in Expo Go. Use a development/production build.');
    return null;
  }

  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return null;
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Push notifications permission not granted');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return null;

    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenResponse.data ?? null;
  } catch (error) {
    console.error('Push registration failed:', error);
    try {
      Sentry.captureException(error, {
        tags: { feature: 'push-registration' },
      });
    } catch {}
    return null;
  }
}

export async function updatePushTokenOnServer(): Promise<boolean> {
  try {
    const token = await registerForPushNotificationsAsync();
    if (!token) return false;

    await notificationService.savePushToken(token);
    await SecureStore.setItemAsync('pushToken', token);
    return true;
  } catch (error) {
    console.error('Error updating push token on server:', error);
    try {
      Sentry.captureException(error, {
        tags: { feature: 'push-save' },
      });
    } catch {}
    return false;
  }
}

export async function hasRegisteredPushToken(): Promise<boolean> {
  const t = await SecureStore.getItemAsync('pushToken');
  return !!t;
}
