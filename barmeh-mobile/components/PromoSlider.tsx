import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from 'react-native';
import { Shield, Flame, Gift } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../styles/colors';

const { width } = Dimensions.get('window');

interface Promo {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  colors: string[];
}

interface PromoSliderProps {
  isRTL: boolean;
  onPromoPress?: (promoId: string) => void;
}

export const PromoSlider: React.FC<PromoSliderProps> = ({ isRTL, onPromoPress }) => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const promos: Promo[] = [
    {
      id: '1',
      title: t('home.promos.p1.title'),
      subtitle: t('home.promos.p1.subtitle'),
      icon: <Flame size={40} color="#fff" />,
      colors: ['#ef4444', '#dc2626'],
    },
    {
      id: '2',
      title: t('home.promos.p2.title'),
      subtitle: t('home.promos.p2.subtitle'),
      icon: <Shield size={40} color="#fff" />,
      colors: ['#0d9488', '#0f766e'],
    },
    {
      id: '3',
      title: t('home.promos.p3.title'),
      subtitle: t('home.promos.p3.subtitle'),
      icon: <Gift size={40} color="#fff" />,
      colors: ['#8b5cf6', '#7c3aed'],
    },
  ];

  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / (width - 48));
    setActiveIndex(Math.min(index, promos.length - 1));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        onScroll={handleScroll}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        scrollEnabled={promos.length > 1}
      >
        {promos.map((promo) => (
          <TouchableOpacity
            key={promo.id}
            style={styles.promoCard}
            activeOpacity={0.8}
            onPress={() => onPromoPress?.(promo.id)}
          >
            <LinearGradient
              colors={promo.colors as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBg}
            >
              <View
                style={[
                  styles.content,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}
              >
                <View
                  style={[
                    styles.textContainer,
                    { alignItems: isRTL ? 'flex-end' : 'flex-start' },
                  ]}
                >
                  <Text style={styles.title}>{promo.title}</Text>
                  <Text style={styles.subtitle}>{promo.subtitle}</Text>
                  <View style={styles.cta}>
                    <Text style={styles.ctaText}>{t('home.hero.cta')} {isRTL ? '←' : '→'}</Text>
                  </View>
                </View>
                <View style={styles.iconContainer}>{promo.icon}</View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {promos.length > 1 && (
        <View style={[styles.dotsContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {promos.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dot,
                activeIndex === index && styles.dotActive,
              ]}
              onPress={() => {
                scrollViewRef.current?.scrollTo({
                  x: index * (width - 48),
                  animated: true,
                });
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  promoCard: {
    width: width - 48,
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradientBg: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    lineHeight: 18,
  },
  cta: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  ctaText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  iconContainer: {
    marginLeft: 12,
  },
  dotsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
});
