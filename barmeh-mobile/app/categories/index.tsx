import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Layers } from 'lucide-react-native';
import { listingService } from '../../services/api';
import { COLORS } from '../../styles/colors';
import { renderCategoryIcon, hasLucideIcon } from '../../constants/categoryIcons';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 14;
const HORIZONTAL_PADDING = 16;
const COLUMNS = 2;
const ITEM_WIDTH =
  (width - HORIZONTAL_PADDING * 2 - COLUMN_GAP * (COLUMNS - 1)) / COLUMNS;

interface CategoryItem {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  order: number;
  parentId?: string | null;
  _count?: { listings: number };
}

const isUrl = (s: string) => typeof s === 'string' && s.startsWith('http');

export default function CategoriesPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const all = await listingService.getCategories();
      const tops = all
        .filter((c) => !c.parentId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((top) => {
          const own = top._count?.listings ?? 0;
          const childrenSum = all
            .filter((c) => c.parentId === top.id)
            .reduce((sum, c) => sum + (c._count?.listings ?? 0), 0);
          return { ...top, _count: { listings: own + childrenSum } };
        });
      setCategories(tops);
    } catch (e) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCategories();
  };

  const goToCategory = (id: string) => {
    router.push({ pathname: '/(tabs)/', params: { categoryId: id } });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowRight
            size={24}
            color={COLORS.primary}
            style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('categories.all_categories', 'كل الفئات')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.grid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {categories.map((cat) => {
              const name = isRTL ? cat.nameAr : cat.nameEn || cat.nameAr;
              const count = cat._count?.listings ?? 0;
              return (
                <TouchableOpacity
                  key={cat.id}
                  activeOpacity={0.85}
                  onPress={() => goToCategory(cat.id)}
                  style={[styles.tile, { width: ITEM_WIDTH }]}
                >
                  <View style={styles.iconWrap}>
                    {hasLucideIcon(cat.slug)
                      ? renderCategoryIcon(cat.slug, {
                          size: 40,
                          color: COLORS.primary,
                          strokeWidth: 1.75,
                        })
                      : isUrl(cat.icon) ? (
                          <Image
                            source={{ uri: cat.icon }}
                            style={{ width: '100%', height: '100%', borderRadius: 16 }}
                            contentFit="cover"
                          />
                        ) : cat.icon ? (
                          <Text style={styles.emoji}>{cat.icon}</Text>
                        ) : (
                          <Layers size={28} color={COLORS.primary} />
                        )}
                  </View>
                  <Text style={styles.name} numberOfLines={2}>
                    {name}
                  </Text>
                  {count > 0 && (
                    <View style={styles.countPill}>
                      <Text style={styles.countText}>
                        {count.toLocaleString()}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.accent,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(6, 78, 59, 0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: HORIZONTAL_PADDING,
  },
  grid: {
    flexWrap: 'wrap',
    gap: COLUMN_GAP,
  },
  tile: {
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 78, 59, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    minHeight: 160,
    justifyContent: 'center',
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(6, 78, 59, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 40,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.secondary,
    textAlign: 'center',
    minHeight: 36,
  },
  countPill: {
    marginTop: 6,
    backgroundColor: 'rgba(196, 160, 82, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.gold,
  },
});
