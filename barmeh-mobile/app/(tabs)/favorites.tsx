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
import { Heart, MapPin, LogIn } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { listingService, authService, ListingSummary, City } from '../../services/api';
import { COLORS } from '../../styles/colors';
import { useTranslation } from 'react-i18next';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=300&auto=format&fit=crop';

export default function FavoritesScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();
  const [items, setItems] = useState<ListingSummary[]>([]);
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
      const favs = await listingService.getFavorites();
      setItems(favs);
    } catch (err: any) {
      console.error('Error loading favorites:', err);
      Alert.alert(t('common.error'), t('purchases.error_fetch') || t('common.error'));
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

  const handleUnfavorite = async (id: string) => {
    const prev = items;
    setItems((cur) => cur.filter((x) => x.id !== id));
    try {
      await listingService.toggleFavorite(id);
    } catch (err) {
      setItems(prev);
      Alert.alert(t('common.error'), t('purchases.error_remove') || t('common.error'));
    }
  };

  const renderItem = ({ item }: { item: ListingSummary }) => {
    const imageUri = item.images?.[0]?.thumbUrl || item.images?.[0]?.mediumUrl || FALLBACK_IMAGE;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push(`/listing/${item.id}` as any)}
      >
        <TouchableOpacity style={styles.heartBtn} onPress={() => handleUnfavorite(item.id)}>
          <Heart size={18} color="#ef4444" fill="#ef4444" />
        </TouchableOpacity>
        <Image source={{ uri: imageUri }} style={styles.thumb} contentFit="cover" />
        <View style={styles.info}>
          <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={[styles.priceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
             <Text style={styles.price}>{item.price.toLocaleString()}</Text>
             <Text style={[styles.currency, { [isRTL ? 'marginRight' : 'marginLeft']: 4 }]}>{t('details.currency')}</Text>
          </View>
          <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.city}>{t(`cities.${item.city.toLowerCase()}`)}</Text>
            <MapPin size={14} color={COLORS.darkGray} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
          <Text style={styles.headerTitle}>{t('favorites.title')}</Text>
        </LinearGradient>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
      </View>
    );
  }

  if (authed === false) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
          <Text style={styles.headerTitle}>{t('favorites.title')}</Text>
        </LinearGradient>
        <View style={styles.emptyBox}>
          <View style={styles.emptyIcon}>
            <Heart size={36} color={COLORS.gold} />
          </View>
          <Text style={styles.emptyTitle}>{t('favorites.login_required')}</Text>
          <TouchableOpacity style={[styles.loginBtn, { flexDirection: isRTL ? 'row' : 'row-reverse' }]} onPress={() => router.push('/(tabs)/profile')}>
            <LogIn size={18} color={COLORS.accent} />
            <Text style={styles.loginText}>{t('common.login')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={styles.headerTitle}>{t('favorites.title')}</Text>
        <Text style={styles.headerCount}>{t('favorites.count', { count: items.length })}</Text>
      </LinearGradient>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <Heart size={36} color={COLORS.gold} />
            </View>
            <Text style={styles.emptyTitle}>{t('favorites.empty')}</Text>
            <Text style={styles.emptyHint}>{t('favorites.empty_hint')}</Text>
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
    paddingBottom: 25,
    paddingHorizontal: 24,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.accent },
  headerCount: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  card: {
    backgroundColor: COLORS.accent,
    borderRadius: 24,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    flexDirection: 'row-reverse',
  },
  thumb: { width: 110, height: 110 },
  info: { flex: 1, padding: 14, justifyContent: 'space-between' },
  title: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  priceRow: { alignItems: 'baseline' },
  price: { fontSize: 17, fontWeight: '900', color: COLORS.primary },
  currency: { fontSize: 12, fontWeight: '700', color: COLORS.gold },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    opacity: 0.8,
  },
  city: { color: COLORS.darkGray, fontSize: 12, fontWeight: '600' },
  heartBtn: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 2,
    backgroundColor: COLORS.accent,
    borderRadius: 18,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyBox: { alignItems: 'center', paddingVertical: 80 },
  emptyIcon: {
    backgroundColor: COLORS.lightGray,
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  emptyTitle: { color: '#475569', fontWeight: '800', fontSize: 15, marginBottom: 6 },
  emptyHint: { color: COLORS.darkGray, fontWeight: '600', fontSize: 13 },
  loginBtn: {
    marginTop: 18,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginText: { color: COLORS.accent, fontWeight: '900', fontSize: 14 },
});
