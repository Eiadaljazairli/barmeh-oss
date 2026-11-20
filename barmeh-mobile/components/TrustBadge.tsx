import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, CheckCircle2, Diamond, User } from 'lucide-react-native';
import { COLORS } from '../styles/colors';

export type TrustLevel = 'NEWBIE' | 'VERIFIED' | 'TRUSTED' | 'VIP';

interface TrustBadgeProps {
  level: TrustLevel;
  showText?: boolean;
  size?: number;
}

const TrustBadge: React.FC<TrustBadgeProps> = ({ level, showText = true, size = 16 }) => {
  const getLevelConfig = () => {
    switch (level) {
      case 'VIP':
        return {
          Icon: Diamond,
          color: COLORS.gold,
          label: 'عضو VIP',
          bgColor: 'rgba(196, 160, 82, 0.1)',
        };
      case 'TRUSTED':
        return {
          Icon: ShieldCheck,
          color: COLORS.primary,
          label: 'بائع موثوق',
          bgColor: 'rgba(6, 78, 59, 0.1)',
        };
      case 'VERIFIED':
        return {
          Icon: CheckCircle2,
          color: '#2196F3',
          label: 'موثق الهوية',
          bgColor: 'rgba(33, 150, 243, 0.1)',
        };
      case 'NEWBIE':
      default:
        return {
          Icon: User,
          color: '#9E9E9E',
          label: 'عضو جديد',
          bgColor: 'rgba(158, 158, 158, 0.1)',
        };
    }
  };

  const config = getLevelConfig();
  const { Icon } = config;

  return (
    <View style={[styles.container, { backgroundColor: config.bgColor, paddingHorizontal: showText ? 8 : 4 }]}>
      <Icon size={size} color={config.color} />
      {showText && (
        <Text style={[styles.text, { color: config.color, fontSize: size * 0.8 }]}>
          {config.label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    marginRight: 4,
    fontWeight: 'bold',
    fontFamily: 'Inter_700Bold',
  },
});

export default TrustBadge;
