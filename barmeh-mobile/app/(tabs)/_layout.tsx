import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text } from 'react-native';
import { Home, Heart, Plus, MessageCircle, User, Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { COLORS } from '../../styles/colors';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const { isAuthenticated } = useAuth();
  const colorScheme = useColorScheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      key={i18n.language}
      initialRouteName={isAuthenticated ? 'index' : 'profile'}
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.darkGray,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          display: isAuthenticated ? 'flex' : 'none',
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 6,
          borderTopWidth: 2,
          borderTopColor: COLORS.gold,
          elevation: 0,
          backgroundColor: COLORS.accent,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          href: isAuthenticated ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t('profile.favorites'),
          tabBarIcon: ({ color }) => <Heart size={24} color={color} />,
          href: isAuthenticated ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          tabBarLabel: () => null,
          href: isAuthenticated ? undefined : null,
          tabBarIcon: () => (
            <View style={{
              backgroundColor: COLORS.primary,
              width: 60,
              height: 60,
              borderRadius: 16,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: -15,
              shadowColor: COLORS.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8
            }}>
              <Plus size={28} color="#FFFFFF" strokeWidth={3} />
              <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold', marginTop: 2 }}>{t('tabs.add_post', 'إضافة إعلان')}</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('tabs.chats'),
          tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} />,
          href: isAuthenticated ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
