import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Flame, TrendingUp } from 'lucide-react-native';
import { COLORS } from '../styles/colors';

interface TrendingItem {
  id: string;
  label: string;
  icon: string;
  count: number;
}

interface TrendingNowSectionProps {
  items: TrendingItem[];
  onItemPress: (id: string) => void;
  isRTL: boolean;
}

export const TrendingNowSection: React.FC<TrendingNowSectionProps> = ({
  items,
  onItemPress,
  isRTL,
}) => {
  if (!items || items.length === 0) return null;
  const isUrl = (str: string) => str?.startsWith('http');

  return (
    <View style={styles.container}>
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.iconLabel, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.iconBg}>
            <Flame size={16} color="#fff" />
          </View>
          <Text style={styles.title}>الآن شعبي</Text>
        </View>
        <View style={[styles.badge, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TrendingUp size={12} color="#fff" />
          <Text style={styles.badgeText}>الأكثر بحثاً</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { flexDirection: 'row' },
        ]}
      >
        {items.slice(0, 6).map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.trendItem,
              index === 0 && styles.trendItemFirst,
            ]}
            onPress={() => onItemPress(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.rankBadge}>
              <Text style={styles.rank}>#{index + 1}</Text>
            </View>

            <View
              style={[
                styles.itemContent,
                { alignItems: isRTL ? 'flex-end' : 'flex-start' },
              ]}
            >
              <View style={[styles.iconContainer]}>
                {isUrl(item.icon) ? (
                  <Image 
                    source={{ uri: item.icon }} 
                    style={{ width: '100%', height: '100%', borderRadius: 8 }} 
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.emoji}>{item.icon}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={styles.count}>
                  {item.count > 999 ? `${(item.count / 1000).toFixed(1)}K` : item.count} إعلان
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
    paddingHorizontal: 20,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconLabel: {
    alignItems: 'center',
    gap: 8,
  },
  iconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    gap: 10,
  },
  trendItem: {
    minWidth: 140,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  trendItemFirst: {
    borderColor: COLORS.gold,
    borderWidth: 2,
    backgroundColor: 'rgba(6, 78, 59, 0.02)',
  },
  rankBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
  },
  rank: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(6, 78, 59, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: 2,
  },
  count: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
});
