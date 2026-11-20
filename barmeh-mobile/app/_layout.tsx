import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppState, LogBox } from 'react-native';
import * as Sentry from "@sentry/react-native";
import Constants from 'expo-constants';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
]);

import { loadSavedLanguage } from '../i18n';
import "../global.css";
import "../i18n";
import { useColorScheme } from '@/hooks/use-color-scheme';
import { UpdatePrompt } from '../components/UpdatePrompt';
import AnimatedSplash from '../components/AnimatedSplash';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { configureGoogleSignIn } from '../utils/googleAuth';

try {
  configureGoogleSignIn();
} catch (e) {
  console.warn('Google Sign-In configure failed:', e);
}

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || Constants.expoConfig?.extra?.SENTRY_DSN;

try {
  if (SENTRY_DSN && !SENTRY_DSN.includes("your_project_id")) {
    Sentry.init({
      dsn: SENTRY_DSN,
      debug: __DEV__,
      environment: __DEV__ ? "development" : "production",
    });
  }
} catch (e) {
  console.warn('Sentry init failed:', e);
}

import {
  updatePushTokenOnServer,
  hasRegisteredPushToken,
} from '../services/notificationHandler';

let Notifications: any = null;
try {
  if (Constants.appOwnership !== 'expo') {
    Notifications = require('expo-notifications');
  }
} catch (e) {
  console.warn('expo-notifications unavailable:', e);
  Notifications = null;
}

if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    console.warn('setNotificationHandler failed:', e);
  }
}

SplashScreen.preventAutoHideAsync().catch(() => {});

setTimeout(() => {
  SplashScreen.hideAsync().catch(() => {});
}, 4000);

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNavBase() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        await loadSavedLanguage();
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error('App initialization error:', error);
        try { Sentry.captureException(error); } catch {}
      }
    };

    initApp();

    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const tryRegister = async () => {
      const already = await hasRegisteredPushToken();
      if (already) return;
      if (cancelled) return;
      await updatePushTokenOnServer();
    };

    tryRegister();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') tryRegister();
    });

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) return;

    const PUBLIC_TOP_LEVEL = new Set([
      'privacy',
      'terms',
      'support',
      'faq',
      'safety',
      'banned-items',
      'verification',
      'modal',
    ]);

    const inTabs = segments[0] === '(tabs)';
    const onProfileTab = inTabs && segments[1] === 'profile';
    const top = segments[0] as string | undefined;
    const isPublic = top ? PUBLIC_TOP_LEVEL.has(top) : false;

    if (onProfileTab || isPublic) return;

    router.replace('/(tabs)/profile');
  }, [authLoading, isAuthenticated, segments, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DefaultTheme}>
        {!authLoading && (
          <>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="listing/[id]" />
              <Stack.Screen name="user/[id]" />
              <Stack.Screen name="map" />
              <Stack.Screen name="chat/[userId]" />
              <Stack.Screen name="notifications" />
            </Stack>
            <UpdatePrompt />
          </>
        )}
        {!splashDone && (
          <AnimatedSplash
            ready={!authLoading}
            onFinish={() => setSplashDone(true)}
          />
        )}
        <StatusBar style="dark" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const isSentryEnabled = SENTRY_DSN && !SENTRY_DSN.includes("your_project_id");
const RootLayoutNav = isSentryEnabled ? Sentry.wrap(RootLayoutNavBase) : RootLayoutNavBase;

export default RootLayout;
