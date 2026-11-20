import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MapPin, Crown, Star, Zap, Clock } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../styles/colors';
import { ListingSummary } from '../services/api';
import TrustBadge from './TrustBadge';
import UserAvatar from './UserAvatar';
import { ensureAbsoluteUrl } from '../utils/url';
import { extractTopTags } from '../utils/attributeTags';
import { formatDual } from '../utils/formatPrice';
import { formatRelativeTime } from '../utils/relativeTime';
import type { Currency } from '../constants/currency';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=300&auto=format&fit=crop';

interface ListingCardProps {
  item: ListingSummary;
  onPress: (id: string) => void;
  index?: number;
}

export const ListingCard = React.memo(({ item, onPress, index = 0 }: ListingCardProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const imageUri =
    ensureAbsoluteUrl(item.images?.[0]?.thumbUrl || item.images?.[0]?.mediumUrl) ||
    FALLBACK_IMAGE;

  const isFeatured =
    item.promotion?.type === 'FEATURED' || item.promotion?.type === 'TOP_PLACEMENT';
  const isUrgent = item.promotion?.type === 'URGENT';
  const isMerchant = item.user?.userType === 'MERCHANT';

  const tags = extractTopTags(item.attributes, i18n.language);

  const dualPrice =
    item.price > 0
      ? formatDual(item.price, (item.currency as Currency) || 'SYP', i18n.language)
      : null;

  const relTime = formatRelativeTime(item.createdAt, i18n.language);
  const cityLabel = t(`cities.${item.city.toLowerCase()}`);

  const sellerName =
    (item.user as any)?.name ||
    (item.user as any)?.firstName ||
    (item.user as any)?.username ||
    t('common.user');
  const sellerPhoto = (item.user as any)?.avatarUrl || (item.user as any)?.photoUrl || null;
  const sellerSeed = (item.user as any)?.id || sellerName;

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 80).duration(360)}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => onPress(item.id)}
        style={[
          styles.card,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
          isFeatured && styles.featuredCard,
        ]}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            contentFit="cover"
            transition={400}
            cachePolicy="memory-disk"
          />

          {isFeatured ? (
            <View style={[styles.cornerBadge, { backgroundColor: COLORS.gold }]}>
              <Star size={9} color="#fff" fill="#fff" />
              <Text style={styles.cornerBadgeText}>{t('promotion.featured')}</Text>
            </View>
          ) : isUrgent ? (
            <View style={[styles.cornerBadge, { backgroundColor: COLORS.urgentRed }]}>
              <Zap size={9} color="#fff" fill="#fff" />
              <Text style={styles.cornerBadgeText}>{t('promotion.urgent')}</Text>
            </View>
          ) : null}

          {isMerchant && (
            <View style={styles.merchantPill}>
              <Crown size={9} color="#fff" fill="#fff" />
              <Text style={styles.merchantPillText}>{t('common.merchant') || 'تاجر'}</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          <View
            style={[
              styles.sellerRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <UserAvatar
              name={sellerName}
              photoUrl={sellerPhoto}
              seed={sellerSeed}
              size={22}
            />
            <Text
              style={[
                styles.sellerName,
                {
                  flex: 1,
                  textAlign: isRTL ? 'right' : 'left',
                  [isRTL ? 'marginRight' : 'marginLeft']: 6,
                },
              ]}
              numberOfLines={1}
            >
              {sellerName}
            </Text>
            {item.user?.trustLevel && item.user.trustLevel !== 'NEWBIE' && (
              <TrustBadge level={item.user.trustLevel} showText={false} size={12} />
            )}
          </View>

          {item.price === 0 ? (
            <View style={[styles.freeBadge, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={styles.freeBadgeText}>{t('post.price_free')}</Text>
            </View>
          ) : dualPrice ? (
            <Text
              style={[
                styles.price,
                { textAlign: isRTL ? 'right' : 'left' },
              ]}
              numberOfLines={1}
            >
              {dualPrice.primary}
            </Text>
          ) : null}

          <View
            style={[
              styles.metaRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            {relTime && (
              <View
                style={[
                  styles.metaItem,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}
              >
                <Clock size={11} color={COLORS.darkGray} />
                <Text
                  style={[
                    styles.metaText,
                    { [isRTL ? 'marginRight' : 'marginLeft']: 4 },
                  ]}
                  numberOfLines={1}
                >
                  {relTime}
                </Text>
              </View>
            )}
            <View
              style={[
                styles.metaItem,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
            >
              <MapPin size={11} color={COLORS.darkGray} />
              <Text
                style={[
                  styles.metaText,
                  { [isRTL ? 'marginRight' : 'marginLeft']: 4 },
                ]}
                numberOfLines={1}
              >
                {cityLabel}
              </Text>
            </View>
          </View>

          {tags.length > 0 && (
            <View
              style={[
                styles.tagsRow,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
            >
              {tags.slice(0, 3).map((tag) => (
                <View key={tag.key} style={styles.tagChip}>
                  <Text style={styles.tagText} numberOfLines={1}>
                    {tag.label}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 18,
    marginBottom: 14,
    shadowColor: '#0E251F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.05)',
  },
  featuredCard: {
    borderWidth: 1.5,
    borderColor: COLORS.gold,
  },

  imageContainer: {
    position: 'relative',
    width: 124,
    height: 124,
    margin: 8,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  image: { width: '100%', height: '100%' },
  cornerBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cornerBadgeText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '800',
  },
  merchantPill: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(196, 160, 82, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  merchantPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
  },

  content: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
    justifyContent: 'space-between',
  },
  title: {
    color: COLORS.secondary,
    fontWeight: '800',
    fontSize: 14.5,
    lineHeight: 21,
  },

  sellerRow: {
    alignItems: 'center',
  },
  sellerName: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontWeight: '600',
  },

  price: {
    color: COLORS.primary,
    fontWeight: '900',
    fontSize: 17,
    letterSpacing: 0.2,
  },
  freeBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  freeBadgeText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.3,
  },

  metaRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaItem: {
    alignItems: 'center',
    flexShrink: 1,
  },
  metaText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },

  tagsRow: {
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  tagChip: {
    backgroundColor: 'rgba(6, 78, 59, 0.06)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(6, 78, 59, 0.10)',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondary,
  },
});
