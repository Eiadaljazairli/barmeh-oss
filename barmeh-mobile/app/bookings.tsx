import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { CalendarCheck, LogIn, X, ArrowRight } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { listingService, authService, MyBooking } from '../services/api';
import { COLORS } from '../styles/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=300&auto=format&fit=crop';

const STATUS_META: Record<
  string,
  { color: string; bg: string; key: string; fallback: string }
> = {
  PENDING: { color: '#B8860B', bg: 'rgba(196, 160, 82, 0.14)', key: 'bookings.status_pending', fallback: 'بانتظار الموافقة' },
  ACCEPTED: { color: COLORS.primary, bg: 'rgba(6, 78, 59, 0.10)', key: 'bookings.status_accepted', fallback: 'محجوز مؤقتاً' },
  REJECTED: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.10)', key: 'bookings.status_rejected', fallback: 'مرفوض' },
  CANCELLED: { color: '#64748b', bg: 'rgba(100, 116, 139, 0.10)', key: 'bookings.status_cancelled', fallback: 'ملغى' },
};

export default function BookingsScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();
  const [items, setItems] = useState<MyBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    const isAuthed = await authService.isAuthenticated();
    setAuthed(isAuthed);
    if (!isAuthed) {
      setItems([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const bookings = await listingService.getMyBookings();
      setItems(bookings);
    } catch (err) {
      console.error('Error loading bookings:', err);
      Alert.alert(t('common.error'), t('common.error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleCancel = (booking: MyBooking) => {
    Alert.alert(
      t('details.cancel_booking') || 'إلغاء الحجز',
      t('details.cancel_booking_confirm') || 'متأكد إنك بدك تلغي الحجز؟',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('details.cancel_booking') || 'إلغاء الحجز',
          style: 'destructive',
          onPress: async () => {
            const prev = items;
            setItems((cur) =>
              cur.map((b) => (b.id === booking.id ? { ...b, status: 'CANCELLED' } : b)),
            );
            try {
              await listingService.cancelBooking(booking.id);
              load();
            } catch (err) {
              setItems(prev);
              Alert.alert(t('common.error'), t('common.error'));
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: MyBooking }) => {
    const imageUri =
      item.listing?.images?.[0]?.thumbUrl ||
      item.listing?.images?.[0]?.mediumUrl ||
      FALLBACK_IMAGE;
    const meta = STATUS_META[item.status] || STATUS_META.PENDING;
    const canCancel = item.status === 'PENDING' || item.status === 'ACCEPTED';
    return (
      <TouchableOpacity
        style={[styles.card, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        activeOpacity={0.85}
        onPress={() => item.listing && router.push(`/listing/${item.listing.id}` as any)}
      >
        <Image source={{ uri: imageUri }} style={styles.thumb} contentFit="cover" />
        <View style={styles.info}>
          <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
            {item.listing?.title || '—'}
          </Text>
          {item.listing && item.listing.price > 0 && (
            <View style={[styles.priceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={styles.price}>{item.listing.price.toLocaleString()}</Text>
              <Text style={[styles.currency, { [isRTL ? 'marginRight' : 'marginLeft']: 4 }]}>
                {t('details.currency')}
              </Text>
            </View>
          )}
          <View style={[styles.bottomRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
              <Text style={[styles.statusText, { color: meta.color }]}>{t(meta.key, meta.fallback)}</Text>
            </View>
            {canCancel && (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item)}>
                <X size={14} color="#ef4444" />
                <Text style={styles.cancelText}>{t('details.cancel_booking') || 'إلغاء الحجز'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const Header = () => (
    <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <TouchableOpacity
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
        style={styles.backBtn}
      >
        <ArrowRight
          size={24}
          color={COLORS.secondary}
          style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }}
        />
      </TouchableOpacity>
      <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
        <Text style={styles.headerTitle}>{t('bookings.title', 'محجوزاتي')}</Text>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <Header />
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
      </View>
    );
  }

  if (authed === false) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <Header />
        <View style={styles.emptyBox}>
          <View style={styles.emptyIcon}>
            <CalendarCheck size={40} color={COLORS.gold} />
          </View>
          <Text style={styles.emptyTitle}>{t('bookings.login_required', 'سجّل دخولك لعرض محجوزاتك')}</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(tabs)/profile')}>
            <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.loginGradient}>
              <LogIn size={20} color="#fff" />
              <Text style={styles.loginText}>{t('common.login')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Header />
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={styles.emptyIconGradient}>
                <CalendarCheck size={40} color={COLORS.gold} />
              </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>{t('bookings.empty', 'ما عندك محجوزات')}</Text>
            <Text style={styles.emptyHint}>
              {t('bookings.empty_hint', 'لما تحجز إعلان رح يظهر هون')}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.accent },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'flex-start',
    gap: 16,
    alignItems: 'center',
    backgroundColor: COLORS.accent,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.secondary, fontFamily: 'Outfit_Bold' },
  backBtn: { padding: 8, backgroundColor: 'rgba(6, 78, 59, 0.05)', borderRadius: 12 },
  card: {
    backgroundColor: COLORS.accent,
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  thumb: { width: 120, height: 120 },
  info: { flex: 1, padding: 16, justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.secondary, marginBottom: 4 },
  priceRow: { alignItems: 'baseline' },
  price: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  currency: { fontSize: 12, fontWeight: '700', color: COLORS.gold },
  bottomRow: { alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '900' },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  cancelText: { color: '#ef4444', fontSize: 12, fontWeight: '900' },
  emptyBox: { alignItems: 'center', paddingVertical: 100 },
  emptyIcon: { marginBottom: 25 },
  emptyIconGradient: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { color: COLORS.secondary, fontWeight: '900', fontSize: 18, marginBottom: 8 },
  emptyHint: { color: COLORS.darkGray, fontWeight: '600', fontSize: 14, textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
  loginBtn: { marginTop: 30, borderRadius: 16, overflow: 'hidden' },
  loginGradient: { paddingHorizontal: 30, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  loginText: { color: '#fff', fontWeight: '900', fontSize: 15 },
});
