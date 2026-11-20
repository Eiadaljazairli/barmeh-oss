import React, { useState, useCallback, useMemo } from 'react';
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
  TextInput,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Heart, MapPin, Search, Trash2, ArrowRight, Grid3x3, List, ChevronDown } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { listingService, authService, ListingSummary, City } from '../../services/api';
import { COLORS } from '../../styles/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { ensureAbsoluteUrl } from '../../utils/url';

const CITY_LABELS: Record<string, string> = {
  DAMASCUS: 'دمشق',
  RURAL_DAMASCUS: 'ريف دمشق',
  ALEPPO: 'حلب',
  HOMS: 'حمص',
  HAMA: 'حماة',
  LATAKIA: 'اللاذقية',
  TARTUS: 'طرطوس',
  IDLIB: 'إدلب',
  DEIR_EZ_ZOR: 'دير الزور',
  RAQQA: 'الرقة',
  HASAKAH: 'الحسكة',
  DARAA: 'درعا',
  SUWAYDA: 'السويداء',
  QUNEITRA: 'القنيطرة',
  QAMISHLI: 'القامشلي',
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=300&auto=format&fit=crop';

type SortOption = 'newest' | 'price-asc' | 'price-desc';
type ViewMode = 'list' | 'grid';

export default function FavoritesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showSortMenu, setShowSortMenu] = useState(false);

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
      const favorites = await listingService.getFavorites();
      setItems(favorites);
    } catch (err: any) {
      console.error('Error loading favorites:', err);
      Alert.alert('خطأ', 'تعذّر جلب قائمة المفضلة');
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

  const filteredAndSortedItems = useMemo(() => {
    let result = items;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.title.toLowerCase().includes(query) ||
        CITY_LABELS[item.city as City]?.toLowerCase().includes(query)
      );
    }

    const sorted = [...result];
    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
      default:
        sorted.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    return sorted;
  }, [items, searchQuery, sortBy]);

  const handleRemoveFavorite = async (id: string) => {
    const prev = items;
    setItems((cur) => cur.filter((x) => x.id !== id));
    try {
      await listingService.toggleFavorite(id);
    } catch (err) {
      setItems(prev);
      Alert.alert('خطأ', 'تعذّر إزالة الإعلان من المفضلة');
    }
  };

  const renderItem = ({ item }: { item: ListingSummary }) => {
    const rawImage = item.images?.[0]?.thumbUrl || item.images?.[0]?.mediumUrl;
    const imageUri = ensureAbsoluteUrl(rawImage) || FALLBACK_IMAGE;

    if (viewMode === 'grid') {
      return (
        <TouchableOpacity
          style={styles.gridCard}
          activeOpacity={0.85}
          onPress={() => router.push(`/listing/${item.id}` as any)}
        >
          <View style={styles.gridImageContainer}>
            <Image source={{ uri: imageUri }} style={styles.gridImage} contentFit="cover" />
            <TouchableOpacity
              style={styles.gridRemoveBtn}
              onPress={(e) => {
                e.stopPropagation();
                handleRemoveFavorite(item.id);
              }}
            >
              <Heart size={18} color="#ef4444" fill="#ef4444" />
            </TouchableOpacity>
          </View>
          <View style={styles.gridInfo}>
            <Text style={styles.gridTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.gridPrice}>{item.price.toLocaleString()} ل.س</Text>
            <View style={styles.gridMeta}>
              <MapPin size={12} color={COLORS.gold} />
              <Text style={styles.gridCity} numberOfLines={1}>
                {CITY_LABELS[item.city as City] ?? item.city}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push(`/listing/${item.id}` as any)}
      >
        <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveFavorite(item.id)}>
          <Heart size={16} color="#ef4444" fill="#ef4444" />
        </TouchableOpacity>
        <Image source={{ uri: imageUri }} style={styles.thumb} contentFit="cover" />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.price}>{item.price.toLocaleString()} ل.س</Text>
          <View style={styles.metaRow}>
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
        <View style={styles.header}>
           <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ArrowRight size={24} color={COLORS.secondary} style={{ transform: [{ rotate: '180deg' }] }} />
           </TouchableOpacity>
           <View style={{ flex: 1, alignItems: 'flex-end' }}>
             <Text style={styles.headerTitle}>المفضلة</Text>
           </View>
        </View>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
           <ArrowRight size={24} color={COLORS.secondary} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
           <Text style={styles.headerTitle}>المفضلة</Text>
           <Text style={styles.headerCount}>{filteredAndSortedItems.length} إعلان</Text>
        </View>
      </View>

      {authed && (
        <View style={styles.controlsSection}>
          <View style={styles.searchContainer}>
            <Search size={18} color={COLORS.darkGray} />
            <TextInput
              placeholder="ابحث في المفضلة..."
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.gold}
            />
          </View>

          <View style={styles.controlsRow}>
            <View style={styles.sortContainer}>
              <TouchableOpacity
                style={styles.sortBtn}
                onPress={() => setShowSortMenu(!showSortMenu)}
              >
                <Text style={styles.sortLabel}>
                  {sortBy === 'newest' && 'الأحدث'}
                  {sortBy === 'price-asc' && 'السعر: من الأقل'}
                  {sortBy === 'price-desc' && 'السعر: من الأعلى'}
                </Text>
                <ChevronDown size={16} color={COLORS.primary} />
              </TouchableOpacity>

              {showSortMenu && (
                <View style={styles.sortMenu}>
                  {(['newest', 'price-asc', 'price-desc'] as SortOption[]).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[styles.sortMenuItem, sortBy === option && styles.sortMenuItemActive]}
                      onPress={() => {
                        setSortBy(option);
                        setShowSortMenu(false);
                      }}
                    >
                      <Text style={[styles.sortMenuText, sortBy === option && styles.sortMenuTextActive]}>
                        {option === 'newest' && 'الأحدث'}
                        {option === 'price-asc' && 'السعر: من الأقل'}
                        {option === 'price-desc' && 'السعر: من الأعلى'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[styles.viewBtn, viewMode === 'list' && styles.viewBtnActive]}
                onPress={() => setViewMode('list')}
              >
                <List size={18} color={viewMode === 'list' ? '#fff' : COLORS.darkGray} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewBtn, viewMode === 'grid' && styles.viewBtnActive]}
                onPress={() => setViewMode('grid')}
              >
                <Grid3x3 size={18} color={viewMode === 'grid' ? '#fff' : COLORS.darkGray} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={filteredAndSortedItems}
        renderItem={renderItem}
        keyExtractor={(it) => it.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridWrapper : undefined}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
               <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.emptyIconGradient}>
                  <Heart size={36} color="#fff" fill="#fff" />
               </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'لم نجد نتائج' : 'قائمتك المفضلة فارغة'}
            </Text>
            <Text style={styles.emptyHint}>
              {searchQuery
                ? 'جرّب البحث عن شيء آخر'
                : 'احفظ الإعلانات التي تهمك للعودة إليها لاحقاً'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/(tabs)')}>
                 <Text style={styles.exploreText}>تصفح برمة الآن</Text>
              </TouchableOpacity>
            )}
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
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    gap: 16,
    alignItems: 'center',
    backgroundColor: COLORS.accent,
  },
  headerRight: { flex: 1, alignItems: 'flex-end' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.secondary, fontFamily: 'Outfit_Bold' },
  headerCount: { fontSize: 13, fontWeight: '700', color: COLORS.darkGray, marginTop: 2 },
  backBtn: { padding: 8, backgroundColor: 'rgba(6, 78, 59, 0.05)', borderRadius: 12 },

  controlsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.accent,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'right',
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    alignItems: 'center',
  },
  sortContainer: { flex: 1, position: 'relative' },
  sortBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 78, 59, 0.2)',
  },
  sortLabel: { fontSize: 12, fontWeight: '700', color: COLORS.secondary },
  sortMenu: {
    position: 'absolute',
    top: 44,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    zIndex: 10,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  sortMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  sortMenuItemActive: { backgroundColor: 'rgba(6, 78, 59, 0.1)' },
  sortMenuText: { fontSize: 13, fontWeight: '600', color: COLORS.secondary, textAlign: 'right' },
  sortMenuTextActive: { color: COLORS.primary, fontWeight: '800' },
  viewToggle: {
    flexDirection: 'row-reverse',
    gap: 4,
    backgroundColor: COLORS.lightGray,
    padding: 4,
    borderRadius: 10,
  },
  viewBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewBtnActive: { backgroundColor: COLORS.primary },
  listContent: { paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 100 },
  gridWrapper: { justifyContent: 'space-between', gap: 12 },
  card: {
    backgroundColor: COLORS.accent,
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row-reverse',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  thumb: { width: 120, height: 120 },
  info: { flex: 1, padding: 16, justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.secondary, textAlign: 'right' },
  price: { fontSize: 18, fontWeight: '900', color: COLORS.primary, textAlign: 'right' },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
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
  gridCard: {
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  gridImageContainer: { position: 'relative', height: 140 },
  gridImage: { width: '100%', height: '100%' },
  gridRemoveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gridInfo: { padding: 12 },
  gridTitle: { fontSize: 13, fontWeight: '800', color: COLORS.secondary, marginBottom: 6 },
  gridPrice: { fontSize: 16, fontWeight: '900', color: COLORS.primary, marginBottom: 6 },
  gridMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  gridCity: { fontSize: 11, color: COLORS.darkGray, fontWeight: '600', flex: 1 },

  emptyBox: { alignItems: 'center', paddingVertical: 100 },
  emptyIcon: { marginBottom: 25 },
  emptyIconGradient: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
  emptyTitle: { color: COLORS.secondary, fontWeight: '900', fontSize: 18, marginBottom: 8 },
  emptyHint: { color: COLORS.darkGray, fontWeight: '600', fontSize: 14, textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
  exploreBtn: { marginTop: 30, backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 14, borderRadius: 16 },
  exploreText: { color: '#fff', fontWeight: '900', fontSize: 15 },
});
