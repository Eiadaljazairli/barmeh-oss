import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Constants from 'expo-constants';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Share,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-native-qrcode-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  Heart,
  Share2,
  MapPin,
  Clock,
  MessageCircle,
  ShieldCheck,
  ChevronLeft,
  ShoppingBag,
  Trash2,
  QrCode,
  X,
  ShieldAlert,
  Star,
  Info,
  ChevronRight,
  CalendarCheck,
  UserCheck,
  Pencil,
  Crown,
  Zap
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { listingService, authService, City, Booking } from '../../services/api';
import { COLORS } from '../../styles/colors';
import { ImageGallery } from '../../components/ImageGallery';
import UserAvatar from '../../components/UserAvatar';
import { CATEGORY_SCHEMAS } from '../../constants/categorySchemas';
import MapView, { Marker, PROVIDER_GOOGLE } from '../../components/Common/MapView';
import { ensureAbsoluteUrl } from '../../utils/url';

const { width } = Dimensions.get('window');

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  city: City;
  categoryId: string;
  category?: {
    id: string;
    slug: string;
    nameAr: string;
    nameEn: string;
  };
  createdAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'SOLD' | 'PENDING' | 'RESERVED';
  images: { id: string; thumbUrl: string; mediumUrl: string }[];
  user: {
    id: string;
    name?: string;
    avatarUrl?: string;
    trustScore: number;
    trustLevel?: 'NEWBIE' | 'VERIFIED' | 'TRUSTED' | 'VIP';
    userType?: string;
    createdAt: string;
    _count?: { listings: number };
  };
  priceStatus?: 'negotiable' | 'fixed' | 'free';
  attributes?: { [key: string]: any };
  metadata?: { [key: string]: any };
  latitude?: number;
  longitude?: number;
  promotion?: {
    type: 'TOP_PLACEMENT' | 'FEATURED' | 'URGENT';
    expiresAt: string;
  } | null;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=800&auto=format&fit=crop';

export default function ListingDetails() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<{id: string} | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [myBooking, setMyBooking] = useState<Booking | null>(null);

  const formatTimeAgo = useCallback((dateStr: string) => {
    if (!dateStr) return t('details.time.unavailable');
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return t('details.time.now');
    if (diffInSeconds < 3600) return t('details.time.mins', { count: Math.floor(diffInSeconds / 60) });
    if (diffInSeconds < 86400) return t('details.time.hours', { count: Math.floor(diffInSeconds / 3600) });
    return t('details.time.days', { count: Math.floor(diffInSeconds / 86400) });
  }, [t]);

  const fetchDetails = useCallback(async () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!id || typeof id !== 'string' || !uuidRegex.test(id)) {
      return;
    }

    try {
      setLoading(true);
      const data = await listingService.getListingDetails(id as string);
      setListing(data as Listing);

      const u = await authService.getCurrentUser();
      setCurrentUser(u);

      if (u) {
        setIsAdmin(u.isAdmin || false);
        const favorites = await listingService.getFavorites();
        setIsFavorited(favorites.some(f => f.id === id));
        if (u.id !== (data as Listing).user?.id) {
          try {
            const { booking } = await listingService.getMyBookingForListing(id as string);
            setMyBooking(booking);
          } catch {
            setMyBooking(null);
          }
        } else {
          setMyBooking(null);
        }
      } else {
        setIsAdmin(false);
        setIsFavorited(false);
        setMyBooking(null);
      }
    } catch (error) {
      console.error('Error fetching listing details:', error);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useFocusEffect(
    useCallback(() => {
      fetchDetails();
    }, [fetchDetails])
  );

  const isListingOwner = useMemo(() => {
    return currentUser?.id === listing?.user?.id;
  }, [currentUser, listing]);

  const handleChat = async () => {
    if (!listing) return;
    if (!currentUser) {
      Alert.alert(
        t('common.welcome'),
        t('messages.login_required'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.login'), onPress: () => router.push('/(tabs)/profile') }
        ]
      );
      return;
    }
    router.push({
      pathname: `/chat/${listing.user.id}`,
      params: { listingId: listing.id }
    } as any);
  };
  const handleToggleFavorite = async () => {
    if (!listing) return;
    if (!currentUser) {
      Alert.alert(
        t('common.welcome'),
        t('favorites.login_required'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.login'), onPress: () => router.push('/(tabs)/profile') }
        ]
      );
      return;
    }
    try {
      const { favorited } = await listingService.toggleFavorite(listing.id);
      setIsFavorited(favorited);
    } catch (err) {
      Alert.alert(t('common.error'), t('common.error'));
    }
  };

  const handleShare = async () => {
    if (!listing) return;
    try {
      const appUrl = `barmehapp://listing/${listing.id}`;
      const storeUrl = (Constants.expoConfig?.extra?.storeUrl as string | undefined) ?? '';
      await Share.share({
        message: `${listing.title} - ${listing.price} ${t('details.currency')}\n\n${t('details.share_msg')}\n\n${appUrl}${storeUrl ? `\n\n${t('details.download_app') || 'تحميل التطبيق:'} ${storeUrl}` : ''}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleBooking = async () => {
    if (!currentUser) {
      Alert.alert(t('common.welcome'), t('auth.login_required'));
      return;
    }
    try {
      setIsBooking(true);
      await listingService.requestBooking(listing?.id as string);
      Alert.alert(t('common.success'), t('details.booking_success'));
      await fetchDetails();
    } catch (err) {
      Alert.alert(t('common.error'), t('common.error'));
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancelBooking = () => {
    if (!myBooking) return;
    Alert.alert(
      t('details.cancel_booking') || 'إلغاء الحجز',
      t('details.cancel_booking_confirm') || 'متأكد إنك بدك تلغي الحجز؟',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('details.cancel_booking') || 'إلغاء الحجز',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsBooking(true);
              await listingService.cancelBooking(myBooking.id);
              setMyBooking(null);
              await fetchDetails();
            } catch (err) {
              Alert.alert(t('common.error'), t('common.error'));
            } finally {
              setIsBooking(false);
            }
          },
        },
      ],
    );
  };

  const handleDelete = async () => {
    if (!listing) return;
    Alert.alert(
      isListingOwner ? t('details.delete_listing') : t('details.admin_delete'),
      t('profile.delete_hint'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await listingService.deleteListing(id as string);
              Alert.alert(t('common.success'), t('common.success'));
              router.back();
            } catch (err) {
              Alert.alert(t('common.error'), t('common.error'));
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>{t('details.loading')}</Text>
      </View>
    );
  }

  if (!listing) return null;

  const hasBooking = !!myBooking;
  const isReserved = listing.status === 'RESERVED' || myBooking?.status === 'ACCEPTED';

  return (
    <View style={styles.container}>
      <View style={styles.headerButtonsContainer}>
         <View style={[styles.headerButtons, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
             <TouchableOpacity style={styles.iconBtn} onPress={() => {
               if (router.canGoBack()) {
                 router.back();
               } else {
                 router.replace('/(tabs)');
               }
             }}>
               <ChevronLeft size={24} color={COLORS.primary} style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
             </TouchableOpacity>
            <View style={[styles.rightIcons, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
              {isListingOwner && (
                <>
                  <TouchableOpacity
                    style={[styles.iconBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                    onPress={handleDelete}
                  >
                    <Trash2 size={20} color="#ef4444" />
                  </TouchableOpacity>
                   <TouchableOpacity
                     style={[styles.iconBtn, { backgroundColor: 'rgba(6, 78, 59, 0.1)' }]}
                     onPress={() => router.push({ pathname: '/(tabs)/post', params: { editId: listing.id } })}
                   >
                     <Pencil size={20} color={COLORS.primary} />
                   </TouchableOpacity>
                </>
              )}
              <TouchableOpacity style={styles.iconBtn} onPress={() => setShowQrModal(true)}>
                <QrCode size={20} color={COLORS.secondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
                <Share2 size={20} color={COLORS.secondary} />
              </TouchableOpacity>
              {!isListingOwner && (
                <TouchableOpacity style={styles.iconBtn} onPress={handleToggleFavorite}>
                  <Heart size={20} color={isFavorited ? "#ef4444" : COLORS.secondary} fill={isFavorited ? "#ef4444" : "transparent"} />
                </TouchableOpacity>
              )}
            </View>
          </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        <ImageGallery
          images={listing.images || []}
          fallbackImage={FALLBACK_IMAGE}
          activeImageIndex={activeImage}
          onImageChange={setActiveImage}
          isRTL={isRTL}
        />

        {listing.status === 'EXPIRED' && (
          <View style={styles.expiredBanner}>
            <ShieldAlert size={20} color="#fff" />
            <Text style={styles.expiredBannerTxt}>{t('listing.expired_notice')}</Text>
          </View>
        )}

        <View style={styles.content}>
          <View style={[styles.titleContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left', flex: 1 }]}>{listing.title}</Text>
            {listing.promotion && (
              <View style={[
                styles.miniPromoBadge,
                listing.promotion.type === 'TOP_PLACEMENT' && { backgroundColor: COLORS.urgentRed },
                listing.promotion.type === 'FEATURED' && { backgroundColor: COLORS.gold },
                listing.promotion.type === 'URGENT' && { backgroundColor: COLORS.warning }
              ]}>
                <Text style={styles.miniPromoBadgeText}>
                  {t(`promotion.${listing.promotion.type.toLowerCase()}`)}
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.priceRow, { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginBottom: 20 }]}>
            <View style={[styles.priceContainer, { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }]}>
               <Text style={styles.priceText}>
                 {(listing.priceStatus === 'free' || listing.price === 0) ? t('post.price_free') : listing.price.toLocaleString()}
               </Text>
               {(listing.priceStatus !== 'free' && listing.price !== 0) && (
                 <Text style={[styles.currencyText, { [isRTL ? 'marginRight' : 'marginLeft']: 10 }]}>{t('details.currency')}</Text>
               )}
            </View>

            {listing.priceStatus && listing.priceStatus !== 'fixed' && (
              <View style={[styles.statusBadge, { [isRTL ? 'marginRight' : 'marginLeft']: 15 }]}>
                <Text style={styles.statusBadgeText}>
                  {listing.priceStatus === 'negotiable' ? t('post.price_negotiable') : ''}
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.metaItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <MapPin size={16} color={COLORS.gold} />
              <Text style={styles.metaText}>{t(`cities.${listing.city.toLowerCase()}`)}</Text>
            </View>
            <View style={[styles.metaItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Clock size={16} color={COLORS.gold} />
              <Text style={styles.metaText}>{formatTimeAgo(listing.createdAt)}</Text>
            </View>
            <View style={[styles.metaItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <ShoppingBag size={16} color={COLORS.gold} />
              <Text style={styles.metaText}>{isRTL ? listing.category?.nameAr : (listing.category?.nameEn || listing.category?.slug)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.sectionTitle}>{t('details.description')}</Text>
            <Info size={18} color={COLORS.primary} />
          </View>
          <Text style={[styles.description, { textAlign: isRTL ? 'right' : 'left' }]}>{listing.description}</Text>

          {false && isListingOwner && (
            <View style={styles.promotionSection}>
              {listing.promotion ? (
                <LinearGradient
                  colors={[COLORS.gold + '20', COLORS.gold + '10']}
                  style={styles.activePromoBanner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                   <View style={styles.promoHeader}>
                      <Star size={18} color={COLORS.gold} fill={COLORS.gold} />
                      <Text style={styles.promoStatusText}>{t('promotion.active')}</Text>
                   </View>
                   <Text style={styles.promoTypeText}>{t(`promotion.${listing.promotion.type.toLowerCase()}`)}</Text>
                   <Text style={styles.promoExpiryText}>
                     {t('promotion.expires_in', { days: Math.max(1, Math.ceil((new Date(listing.promotion.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) })}
                   </Text>
                </LinearGradient>
              ) : (
                <TouchableOpacity
                  onPress={() => router.push({
                    pathname: '/listing/promote',
                    params: {
                      listingId: listing.id,
                      listingTitle: listing.title,
                      listingImage: ensureAbsoluteUrl(listing.images?.[0]?.thumbUrl) || FALLBACK_IMAGE
                    }
                  })}
                >
                  <LinearGradient
                    colors={['#1a1a1a', '#333']}
                    style={styles.boostBanner}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <View style={styles.boostInfo}>
                      <Text style={styles.boostTitle}>{t('promotion.boost_title')}</Text>
                      <Text style={styles.boostSubtitle}>{t('promotion.boost_subtitle')}</Text>
                    </View>
                    <View style={styles.boostIconContainer}>
                      <Zap size={24} color="#FFD700" fill="#FFD700" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}

          {(listing.attributes || listing.metadata) && Object.keys(listing.attributes || listing.metadata || {}).length > 0 && (
            <View style={styles.attributesContainer}>
              <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={styles.sectionTitle}>{t('post.listing_details')}</Text>
                <ShoppingBag size={18} color={COLORS.primary} />
              </View>
              <View style={[styles.attributesGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {Object.entries((listing.attributes || listing.metadata || {}) as Record<string, any>).map(([key, value]) => {
                  const categorySlug = listing.category?.slug || '';
                  let schema = CATEGORY_SCHEMAS[categorySlug]?.find(f => f.key === key);
                  if (!schema) {
                    schema = Object.values(CATEGORY_SCHEMAS).flat().find(f => f.key === key);
                  }

                  const label = isRTL ? schema?.labelAr : schema?.labelEn;
                  const suffix = isRTL ? schema?.suffixAr : schema?.suffixEn;

                  let displayValue = value;
                  if (schema?.type === 'select' && schema.options) {
                    const opt = schema.options.find(o => o.value === value);
                    displayValue = isRTL ? opt?.labelAr : opt?.labelEn;
                  } else if (schema?.type === 'boolean') {
                    displayValue = value ? t('common.yes') : t('common.no');
                  } else if (schema?.type === 'number') {
                    displayValue = Number(value).toLocaleString();
                  }

                  if (!label || value === undefined || value === null || value === '') return null;

                  return (
                    <View key={key} style={[styles.attributeItem, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                      <Text style={[styles.attributeLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
                      <Text style={[styles.attributeValue, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                        {displayValue}{suffix ? ` ${suffix}` : ''}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.sellerHeader}>
             <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('details.seller_info')}</Text>
          </View>
          <TouchableOpacity
            style={[styles.sellerCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            onPress={() => router.push(`/profile/${listing.user.id}` as any)}
          >
             <View style={[styles.sellerInfo, { flexDirection: isRTL ? 'row-reverse' : 'row', flex: 1 }]}>
                <View style={styles.sellerAvatarContainer}>
                   <UserAvatar
                      name={listing.user.name}
                      photoUrl={listing.user.avatarUrl}
                      seed={listing.user.id}
                      size={56}
                   />
                   <View style={styles.onlineBadge} />
                </View>
                <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start', flex: 1, [isRTL ? 'marginRight' : 'marginLeft']: 12 }}>
                   <View style={[styles.nameWithBadge, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Text style={styles.sellerName}>{listing.user.name || t('common.welcome')}</Text>
                       {listing.user.userType === 'MERCHANT' && (
                         <View style={styles.merchantMiniBadge}>
                            <Crown size={12} color={COLORS.gold} fill={COLORS.gold} />
                         </View>
                       )}
                      {listing.user.trustLevel && (
                        <View style={[
                          styles.trustBadge,
                          listing.user.trustLevel === 'VIP' && styles.trustBadgeVIP,
                          listing.user.trustLevel === 'TRUSTED' && styles.trustBadgeTrusted,
                          listing.user.trustLevel === 'VERIFIED' && styles.trustBadgeVerified,
                          listing.user.trustLevel === 'NEWBIE' && styles.trustBadgeNewbie,
                        ]}>
                          <Text style={[
                            styles.trustBadgeText,
                            { [isRTL ? 'marginRight' : 'marginLeft']: 4 }
                          ]}>
                            {listing.user.trustLevel === 'VIP' && `👑 ${t('profile.trust_levels.vip')}`}
                            {listing.user.trustLevel === 'TRUSTED' && `⭐ ${t('profile.trust_levels.trusted')}`}
                            {listing.user.trustLevel === 'VERIFIED' && `✓ ${t('profile.trust_levels.verified')}`}
                            {listing.user.trustLevel === 'NEWBIE' && `🆕 ${t('profile.trust_levels.newbie')}`}
                          </Text>
                        </View>
                      )}
                   </View>
                   <View style={[styles.trustScoreContainer, { flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: 6 }]}>
                      <Star size={14} color={COLORS.gold} fill={COLORS.gold} />
                      <Text style={[styles.trustScoreText, { [isRTL ? 'marginRight' : 'marginLeft']: 4 }]}>
                         {listing.user.trustScore > 0 ? listing.user.trustScore.toFixed(1) : t('profile.no_ratings') || '0.0'}
                      </Text>
                      {listing.user._count?.listings !== undefined && (
                        <>
                          <Text style={styles.trustDot}>•</Text>
                          <Text style={styles.listingsCount}>{listing.user._count.listings} {t('common.listing')}</Text>
                        </>
                      )}
                   </View>
                </View>
             </View>
          </TouchableOpacity>

           {listing.user.userType === 'MERCHANT' && (listing.user as any).merchantProfile && (
             <View style={styles.merchantStoreCard}>
                <View style={[styles.merchantStoreHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                   <ShoppingBag size={18} color={COLORS.primary} />
                   <Text style={styles.merchantStoreTitle}>{(listing.user as any).merchantProfile.storeName}</Text>
                </View>
                {(listing.user as any).merchantProfile.storeAddress && (
                  <View style={[styles.merchantStoreItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                     <MapPin size={14} color={COLORS.gold} />
                     <Text style={styles.merchantStoreText}>{(listing.user as any).merchantProfile.storeAddress}</Text>
                  </View>
                )}
                <View style={styles.merchantVerifiedRow}>
                   <ShieldCheck size={14} color={COLORS.primary} />
                   <Text style={styles.merchantVerifiedText}>{t('merchant.verified_store') || 'متجر معتمد وموثق'}</Text>
                </View>
             </View>
           )}

          <TouchableOpacity
            style={[styles.viewAllBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            onPress={() => router.push(`/user/${listing.user.id}`)}
          >
            <Text style={styles.viewAllText}>{t('details.view_all_listings')}</Text>
            <ChevronRight size={16} color={COLORS.primary} style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
          </TouchableOpacity>

          {listing.latitude && listing.longitude && (
            <View style={styles.mapSection}>
              <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row', marginBottom: 12 }]}>
                <Text style={styles.sectionTitle}>{t('details.location')}</Text>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
                  <MapPin size={14} color={COLORS.primary} />
                  <Text style={[styles.locationText, { [isRTL ? 'marginRight' : 'marginLeft']: 4, fontSize: 13, color: COLORS.secondary, fontWeight: '600' }]}>
                    {t(`cities.${listing.city.toLowerCase()}`)}
                  </Text>
                </View>
              </View>
              <View style={styles.mapContainer}>
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.smallMap}
                  initialRegion={{
                    latitude: Number(listing.latitude),
                    longitude: Number(listing.longitude),
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  <Marker
                    coordinate={{
                      latitude: Number(listing.latitude),
                      longitude: Number(listing.longitude),
                    }}
                  />
                </MapView>
                <TouchableOpacity
                   style={styles.mapOverlay}
                   onPress={() => {
                     router.push({
                       pathname: '/map',
                       params: {
                         initialLat: listing.latitude,
                         initialLng: listing.longitude
                       }
                     });
                   }}
                />
              </View>
            </View>
          )}

          <View style={styles.safetyCard}>
             <View style={[styles.safetyHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <ShieldAlert size={20} color="#b45309" />
                <Text style={styles.safetyTitle}>{t('details.safety_tips')}</Text>
             </View>
             {['safety_tip1', 'safety_tip2', 'safety_tip3'].map((tipKey, i) => (
                <View key={i} style={[styles.safetyItem, { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'flex-start', marginBottom: 8 }]}>
                  <View style={[styles.bullet, { [isRTL ? 'marginLeft' : 'marginRight']: 10, marginTop: 6 }]} />
                  <Text style={[styles.safetyDesc, { textAlign: isRTL ? 'right' : 'left', flex: 1, marginTop: 0 }]}>{t(`details.${tipKey}`)}</Text>
                </View>
             ))}
          </View>

          {(isAdmin || isListingOwner) && (
            <TouchableOpacity
              style={[styles.adminActionBtn, { backgroundColor: '#fef2f2', borderColor: '#fee2e2', marginTop: 12 }]}
              onPress={handleDelete}
            >
              <Trash2 size={20} color="#ef4444" />
              <Text style={[styles.adminActionText, { color: '#ef4444' }]}>
                {isListingOwner ? t('details.delete_listing') : t('details.admin_delete')}
              </Text>
            </TouchableOpacity>
          )}

          {isReserved && (
            <View style={styles.reservedBanner}>
              <CalendarCheck size={18} color={COLORS.gold} />
              <Text style={styles.reservedBannerText}>
                {t('details.reserved_temporarily') || 'محجوز مؤقتاً'}
              </Text>
            </View>
          )}

          {!isListingOwner && (
            <TouchableOpacity
              style={styles.bookingBtn}
              onPress={hasBooking ? handleCancelBooking : handleBooking}
              disabled={isBooking}
            >
              <LinearGradient
                colors={hasBooking ? ['#b91c1c', '#7f1d1d'] : ['#065f46', '#064e3b']}
                start={{x:0, y:0}}
                end={{x:1, y:0}}
                style={styles.bookingGradient}
              >
                {isBooking ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : hasBooking ? (
                  <>
                    <X size={20} color="#fff" />
                    <Text style={styles.bookingText}>{t('details.cancel_booking') || 'إلغاء الحجز'}</Text>
                  </>
                ) : (
                  <>
                    <CalendarCheck size={20} color="#fff" />
                    <Text style={styles.bookingText}>{t('details.book_now')}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {!isListingOwner && (
        <View style={[styles.bottomActions, listing.status === 'EXPIRED' && { opacity: 0.5 }]}>
          <TouchableOpacity
            style={[styles.chatBtnFull, { flex: 1, marginRight: isRTL ? 0 : 10, marginLeft: isRTL ? 10 : 0 }]}
            onPress={handleChat}
            disabled={listing.status === 'EXPIRED'}
          >
            <LinearGradient
              colors={listing.status === 'EXPIRED' ? ['#94a3b8', '#64748b'] : [COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.chatGradient}
            >
              <MessageCircle size={22} color="#fff" />
              <Text style={styles.chatBtnTextWhite} numberOfLines={1}>
                {t('details.chat')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chatBtnFull, { flex: 1 }]}
            onPress={hasBooking ? handleCancelBooking : handleBooking}
            disabled={listing.status === 'EXPIRED' || isBooking}
          >
            <LinearGradient
              colors={
                listing.status === 'EXPIRED'
                  ? ['#94a3b8', '#64748b']
                  : hasBooking
                    ? ['#b91c1c', '#7f1d1d']
                    : [COLORS.gold, '#B8860B']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.chatGradient}
            >
              {isBooking ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : hasBooking ? (
                <>
                  <X size={22} color="#fff" />
                  <Text style={styles.chatBtnTextWhite} numberOfLines={1}>
                    {t('details.cancel_booking') || 'إلغاء الحجز'}
                  </Text>
                </>
              ) : (
                <>
                  <CalendarCheck size={22} color="#fff" />
                  <Text style={styles.chatBtnTextWhite} numberOfLines={1}>
                    {t('details.request_booking') || 'طلب حجز'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showQrModal} transparent animationType="slide" onRequestClose={() => setShowQrModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.qrContainer}>
            <TouchableOpacity style={styles.closeQr} onPress={() => setShowQrModal(false)}>
              <X size={24} color={COLORS.secondary} />
            </TouchableOpacity>
            <Text style={styles.qrTitle}>{t('details.qr_title')}</Text>
            <Text style={styles.qrSub}>{t('details.qr_desc')}</Text>
            <View style={styles.qrWrapper}>
              <QRCode value={`https://example.com/listing/${listing.id}`} size={220} color={COLORS.primary} backgroundColor="white" />
            </View>
            <Text style={styles.qrListingTitle}>{listing.title}</Text>
            <TouchableOpacity style={styles.qrDoneBtn} onPress={() => setShowQrModal(false)}>
               <Text style={styles.qrDoneText}>{t('details.done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.accent },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.accent },
  loaderText: { marginTop: 15, color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  scrollContent: { paddingBottom: 40 },
  headerButtonsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightIcons: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    padding: 24,
    marginTop: -30,
    backgroundColor: COLORS.accent,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    minHeight: 500,
  },
  attributesContainer: {
    marginBottom: 30,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(6, 78, 59, 0.05)',
  },
  attributesGrid: {
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  attributeItem: {
    width: '48%',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 16,
  },
  attributeLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontWeight: '600',
    marginBottom: 4,
  },
  attributeValue: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '800',
  },
  statusBadge: {
    backgroundColor: 'rgba(196, 160, 82, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '900',
  },
  priceContainer: {
    alignItems: 'baseline',
    marginBottom: 8,
  },
  priceRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.primary,
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gold,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: 16,
  },
  metaRow: {
    gap: 15,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  metaItem: {
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(6, 78, 59, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  metaText: {
    color: COLORS.darkGray,
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 24,
  },
  sectionHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  viewAllBtn: { padding: 4 },
  viewAllText: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
  locationText: { fontSize: 13, color: COLORS.darkGray, fontWeight: '600' },
  safetyItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.gold, marginTop: 6 },
  description: {
    fontSize: 16,
    color: COLORS.darkGray,
    lineHeight: 28,
    fontWeight: '500',
    marginBottom: 30,
  },
  sellerHeader: { marginBottom: 15 },
  sellerCard: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 78, 59, 0.1)',
  },
  sellerInfo: {
    alignItems: 'center',
    gap: 8,
  },
  sellerAvatarContainer: { position: 'relative' },
  sellerAvatar: { width: 56, height: 56, borderRadius: 28 },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#f8fafc',
  },
  nameWithBadge: {
    alignItems: 'center',
    gap: 6,
  },
  sellerName: { fontSize: 16, fontWeight: '800', color: COLORS.secondary },
  trustBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustBadgeVIP: {
    backgroundColor: COLORS.gold,
    borderWidth: 1,
    borderColor: '#9A7B24',
  },
  trustBadgeTrusted: {
    backgroundColor: '#3b82f6',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  trustBadgeVerified: {
    backgroundColor: '#10b981',
    borderWidth: 1,
    borderColor: '#059669',
  },
  trustBadgeNewbie: {
    backgroundColor: '#f3e8ff',
    borderWidth: 1,
    borderColor: '#d8b4fe',
  },
  trustBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fff',
  },
  trustScoreContainer: { alignItems: 'center', gap: 6 },
  trustScoreText: { fontSize: 12, color: COLORS.darkGray, fontWeight: '700' },
  trustDot: { fontSize: 8, color: COLORS.gold, fontWeight: '700' },
  listingsCount: { fontSize: 11, color: COLORS.darkGray, fontWeight: '600' },
  messageBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 78, 59, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapSection: {
    marginTop: 24,
  },
  mapContainer: {
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  smallMap: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  safetyCard: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#fffbeb',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  safetyHeader: { alignItems: 'center', gap: 10, marginBottom: 12 },
  safetyTitle: { color: '#b45309', fontWeight: '900', fontSize: 15 },
  safetyDesc: { color: '#92400e', fontSize: 13, marginBottom: 6, fontWeight: '600' },
  adminActionBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 20,
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  adminActionText: { color: '#ef4444', fontSize: 15, fontWeight: '800' },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  chatBtnFull: { flex: 1, height: 58, borderRadius: 20, overflow: 'hidden' },
  chatGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  chatBtnTextWhite: { color: '#fff', fontSize: 18, fontWeight: '900' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrContainer: {
    backgroundColor: COLORS.accent,
    padding: 30,
    borderRadius: 35,
    alignItems: 'center',
    width: '100%',
  },
  closeQr: { alignSelf: 'flex-start', marginBottom: 10 },
  qrTitle: { fontSize: 24, fontWeight: '900', color: COLORS.secondary, marginBottom: 8 },
  qrSub: { fontSize: 14, color: COLORS.darkGray, textAlign: 'center', marginBottom: 30, fontWeight: '600', lineHeight: 20 },
  qrWrapper: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  qrListingTitle: { marginTop: 25, fontSize: 18, fontWeight: '800', color: COLORS.secondary, textAlign: 'center' },
  qrDoneBtn: {
    marginTop: 30,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
  },
  qrDoneText: { color: COLORS.accent, fontWeight: '900', fontSize: 16 },
  expiredBanner: { backgroundColor: '#ef4444', paddingVertical: 12, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' },
  expiredBannerTxt: { color: '#fff', fontWeight: '900', fontSize: 14 },
  modernActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 15,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  modernActionItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  modernActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  actionActiveLike: {
    backgroundColor: 'rgba(6, 95, 70, 0.05)',
    borderRadius: 16,
  },
  actionActiveDislike: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: 16,
  },
  feedbackSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 15,
    padding: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  bookingBtn: {
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  bookingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  bookingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  reservedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    marginHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(196, 160, 82, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(196, 160, 82, 0.35)',
  },
  reservedBannerText: {
    color: COLORS.gold,
    fontSize: 15,
    fontWeight: '900',
  },
  merchantMiniBadge: {
    marginLeft: 8,
    marginRight: 8,
    backgroundColor: 'rgba(6, 78, 59, 0.1)',
    padding: 4,
    borderRadius: 6,
  },
  merchantStoreCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 24,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(196, 160, 82, 0.2)',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  merchantStoreHeader: {
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  merchantStoreTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  merchantStoreItem: {
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  merchantStoreText: {
    fontSize: 13,
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  merchantVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(196, 160, 82, 0.1)',
    gap: 6,
  },
  merchantVerifiedText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  promotionSection: {
    marginTop: 25,
    marginBottom: 10,
    marginHorizontal: 20,
  },
  boostBanner: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  boostInfo: {
    flex: 1,
    marginRight: 15,
  },
  boostTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  boostSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  boostIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePromoBanner: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.gold + '40',
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  promoStatusText: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  promoTypeText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  promoExpiryText: {
    fontSize: 13,
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  titleContainer: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  miniPromoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniPromoBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
});
