import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../styles/colors';

export const AnimatedBackground: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <LinearGradient
      colors={['#1B5E5E', '#0D3B3B', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
      }}
    >
      {children}
    </LinearGradient>
  );
};

export const BarmehHeader: React.FC<{
  showNotification?: boolean;
  onNotificationPress?: () => void;
}> = ({ showNotification = false, onNotificationPress }) => {
  return (
    <View
      style={{
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.primary,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(196, 160, 82, 0.2)',
      }}
    >
      <View>
        <Text
          style={{
            fontSize: 24,
            fontWeight: '900',
            color: COLORS.accent,
            textAlign: 'right',
            letterSpacing: 1,
          }}
        >
          بَرْمَة
        </Text>
      </View>

      {showNotification && (
        <TouchableOpacity onPress={onNotificationPress}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.2)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 20 }}>🔔</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};
