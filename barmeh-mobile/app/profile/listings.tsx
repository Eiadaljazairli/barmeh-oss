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
import { Tag, MapPin, Trash2, ArrowRight, ShoppingBag, Pencil } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ensureAbsoluteUrl } from '../../utils/url';
import { listingService, authService, ListingSummary, City } from '../../services/api';
import { COLORS } from '../../styles/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=300&auto=format&fit=crop';

export default function MyListingsScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();
  const [items, setItems] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const CITY_LABELS: Record<string, string> = {
    DAMASCUS: t('cities.damascus'),
    RURAL_DAMASCUS: t('cities.rural_damascus'),
    ALEPPO: t('cities.aleppo'),
    HOMS: t('cities.homs'),
    HAMA: t('cities.hama'),
    LATAKIA: t('cities.latakia'),
    TARTUS: t('cities.tartus'),
    IDLIB: t('cities.idlib'),
    DEIR_EZ_ZOR: t('cities.deir_ez_zor'),
    RAQQA: t('cities.raqqa'),
    HASAKAH: t('cities.hasakah'),
    DARAA: t('cities.daraa'),
    SUWAYDA: t('cities.suwayda'),
    QUNEITRA: t('cities.quneitra'),
    QAMISHLI: t('cities.qamishli'),
  };

  const load = useCallback(async () => {
    try {
      const data = await listingService.getMyListings();
      setItems(data);
    } catch (err: any) {
      console.error('Error loading my listings:', err);
      Alert.alert(t('common.error'), t('details.error_loading'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

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

  const handleDelete = async (id: string) => {
    Alert.alert(
      t('common.delete'),
      t('profile.delete_hint'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
            try {
              await listingService.deleteListing(id);
              setItems(cur => cur.filter(x => x.id !== id));
              Alert.alert(t('common.success'), t('listing.deleted_success'));
            } catch (err) {
              Alert.alert(t('common.error'), t('common.error'));
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: ListingSummary }) => {

    const imageUri = ensureAbsoluteUrl(item.images?.[0]?.thumbUrl || item.images?.[0]?.mediumUrl) || FALLBACK_IMAGE;
    return (
      <TouchableOpacity
        style={[styles.card, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        activeOpacity={0.85}
        onPress={() => router.push(`/listing/${item.id}` as any)}
      >
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => handleDelete(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, { marginTop: 8 }]} 
            onPress={() => router.push({ pathname: '/(tabs)/post', params: { editId: item.id } })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Pencil size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <Image source={{ uri: imageUri }} style={styles.thumb} contentFit="cover" />
        <View style={styles.info}>
          <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.price, { textAlign: isRTL ? 'right' : 'left' }]}>{item.price.toLocaleString()} {t('common.currency')}</Text>
          <View style={[styles.metaRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
            <Text style={styles.city}>{CITY_LABELS[item.city as City] ?? item.city}</Text>
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
             <Text style={styles.headerTitle}>{t('profile.my_listings')}</Text>
           </View>
        </View>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={styles.backBtn}>
           <ArrowRight size={24} color={COLORS.secondary} style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }} />
        </TouchableOpacity>
        <View style={[styles.headerContent, { alignItems: 'flex-end' }]}>
           <Text style={styles.headerTitle}>{t('profile.my_listings')}</Text>
           <Text style={styles.headerCount}>{items.length} {t('common.listing')}</Text>
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
               <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.emptyIconGradient}>
                  <Tag size={36} color="#fff" />
               </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>{t('profile.no_listings')}</Text>
            <Text style={styles.emptyHint}>{t('profile.no_listings_hint')}</Text>
            <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/(tabs)/post')}>
               <Text style={styles.exploreText}>{t('post.title')}</Text>
            </TouchableOpacity>
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
  headerContent: { flex: 1, alignItems: 'flex-end' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.secondary },
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
  title: { fontSize: 16, fontWeight: '800', color: COLORS.secondary },
  price: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  metaRow: { alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  city: { color: COLORS.darkGray, fontSize: 12, fontWeight: '700' },
  cardActions: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 2,
  },
  actionBtn: {
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
  emptyIconGradient: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
  emptyTitle: { color: COLORS.secondary, fontWeight: '900', fontSize: 18, marginBottom: 8 },
  emptyHint: { color: COLORS.darkGray, fontWeight: '600', fontSize: 14, textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
  exploreBtn: { marginTop: 30, backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 14, borderRadius: 16 },
  exploreText: { color: '#fff', fontWeight: '900', fontSize: 15 },
});
