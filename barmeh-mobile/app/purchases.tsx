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
import { ShoppingBag, MapPin, LogIn, Trash2, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { listingService, authService, ListingSummary, City } from '../services/api';
import { COLORS } from '../styles/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';


const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=300&auto=format&fit=crop';

export default function PurchasesScreen() {
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
      const purchases = await listingService.getPurchases();
      setItems(purchases);
    } catch (err: any) {
      console.error('Error loading purchases:', err);
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

  const handleRemovePurchase = async (id: string) => {
    const prev = items;
    setItems((cur) => cur.filter((x) => x.id !== id));
    try {
      await listingService.togglePurchase(id);
    } catch (err) {
      setItems(prev);
      Alert.alert(t('common.error'), t('purchases.error_remove') || t('common.error'));
    }
  };

  const renderItem = ({ item }: { item: ListingSummary }) => {
    const imageUri = item.images?.[0]?.thumbUrl || item.images?.[0]?.mediumUrl || FALLBACK_IMAGE;
    return (
      <TouchableOpacity
        style={[styles.card, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        activeOpacity={0.85}
        onPress={() => router.push(`/listing/${item.id}` as any)}
      >
        <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemovePurchase(item.id)}>
          <Trash2 size={16} color="#ef4444" />
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
            <MapPin size={14} color={COLORS.gold} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
             <ArrowRight size={24} color={COLORS.secondary} style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={styles.headerTitle}>{t('purchases.title')}</Text>
          </View>
        </View>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
      </View>
    );
  }

  if (authed === false) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={styles.backBtn}>
             <ArrowRight size={24} color={COLORS.secondary} style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={styles.headerTitle}>{t('purchases.title')}</Text>
          </View>
        </View>
        <View style={styles.emptyBox}>
          <View style={styles.emptyIcon}>
            <ShoppingBag size={40} color={COLORS.gold} />
          </View>
          <Text style={styles.emptyTitle}>{t('purchases.login_required')}</Text>
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
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
           <ArrowRight size={24} color={COLORS.secondary} style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }} />
        </TouchableOpacity>
        <View style={[styles.headerRight, { alignItems: 'flex-end', flex: 1 }]}>
           <Text style={styles.headerTitle}>{t('purchases.title')}</Text>
           <Text style={styles.headerCount}>{t('purchases.count', { count: items.length })}</Text>
        </View>
      </View>

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
                <ShoppingBag size={40} color={COLORS.gold} />
              </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>{t('purchases.empty')}</Text>
            <Text style={styles.emptyHint}>{t('purchases.empty_hint')}</Text>
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
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
    alignItems: 'center',
    backgroundColor: COLORS.accent,
  },
  headerRight: { alignItems: 'flex-end' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.secondary, fontFamily: 'Outfit_Bold' },
  headerCount: { fontSize: 13, fontWeight: '700', color: COLORS.darkGray, marginTop: 2 },
  backBtn: { padding: 8, backgroundColor: 'rgba(6, 78, 59, 0.05)', borderRadius: 12 },
  card: {
    backgroundColor: COLORS.accent,
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
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
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  city: { color: COLORS.darkGray, fontSize: 12, fontWeight: '700' },
  removeBtn: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 14,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyBox: { alignItems: 'center', paddingVertical: 100 },
  emptyIcon: { marginBottom: 25 },
  emptyIconGradient: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { color: COLORS.secondary, fontWeight: '900', fontSize: 18, marginBottom: 8 },
  emptyHint: { color: COLORS.darkGray, fontWeight: '600', fontSize: 14, textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
  loginBtn: { marginTop: 30, borderRadius: 16, overflow: 'hidden' },
  loginGradient: { paddingHorizontal: 30, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  loginText: { color: '#fff', fontWeight: '900', fontSize: 15 },
});
