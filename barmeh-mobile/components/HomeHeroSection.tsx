import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, TrendingUp, Users, Shield } from 'lucide-react-native';
import { COLORS } from '../styles/colors';

import { useTranslation } from 'react-i18next';

interface HomeHeroSectionProps {
  isRTL: boolean;
  onExplore: () => void;
}

export const HomeHeroSection: React.FC<HomeHeroSectionProps> = ({ isRTL, onExplore }) => {
  const { t } = useTranslation();

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={[styles.header, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <View style={[styles.badgeContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TrendingUp size={14} color={COLORS.gold} />
            <Text style={[styles.badgeText, { [isRTL ? 'marginRight' : 'marginLeft']: 6, color: COLORS.gold }]}>{t('home.hero.badge')}</Text>
          </View>
          <Text 
            style={[styles.title, { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {t('home.hero.title')}
          </Text>
          <Text style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
            {t('home.hero.subtitle')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={onExplore}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[COLORS.gold, '#d4af37']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={[styles.ctaText, { color: COLORS.primary }]}>{t('home.hero.cta')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
  header: {
    marginBottom: 24,
  },
  badgeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 40,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    lineHeight: 22,
  },
  statsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    fontSize: 20,
  },
  statLabel: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  ctaButton: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  ctaGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
});
