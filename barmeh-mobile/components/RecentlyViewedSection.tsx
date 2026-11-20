import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Clock, ChevronLeft } from 'lucide-react-native';
import { COLORS } from '../styles/colors';
import { ListingSummary } from '../services/api';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=300&auto=format&fit=crop';

interface RecentlyViewedSectionProps {
  items: ListingSummary[];
  onItemPress: (id: string) => void;
  isRTL: boolean;
  loading?: boolean;
  onViewAll?: () => void;
}

export const RecentlyViewedSection: React.FC<RecentlyViewedSectionProps> = ({
  items,
  onItemPress,
  isRTL,
  loading = false,
  onViewAll,
}) => {
  if (!items || items.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.titleContainer, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <View style={[styles.iconLabel, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Clock size={16} color={COLORS.primary} />
            <Text style={styles.title}>شُفت مؤخراً</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.viewAllBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          onPress={onViewAll}
        >
          <Text style={styles.viewAllText}>الكل</Text>
          <ChevronLeft
            size={16}
            color={COLORS.primary}
            style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={COLORS.primary}
            style={styles.loader}
          />
        ) : (
          items.slice(0, 6).map((item) => {
            const imageUri =
              item.images?.[0]?.thumbUrl ||
              item.images?.[0]?.mediumUrl ||
              FALLBACK_IMAGE;

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => onItemPress(item.id)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={styles.image}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                <View style={styles.cardOverlay}>
                  <View style={styles.priceTag}>
                    <Text style={styles.price}>
                      {item.price.toLocaleString()} ل.س
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
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
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  iconLabel: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  viewAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(6, 78, 59, 0.1)',
    borderRadius: 10,
    gap: 4,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  scrollContent: {
    gap: 12,
  },
  loader: {
    marginHorizontal: 20,
  },
  card: {
    width: 120,
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  priceTag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  price: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
});
