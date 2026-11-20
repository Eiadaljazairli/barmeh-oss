import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Bell, Trash2, Search, MapPin, Tag } from 'lucide-react-native';
import { COLORS } from '../../styles/colors';
import { savedSearchService } from '../../services/api';

export default function SavedSearchesScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [searches, setSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSearches = async () => {
    try {
      const data = await savedSearchService.findAll();
      setSearches(data);
    } catch (error) {
      console.error('Error fetching saved searches:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSearches();
  }, []);

  const handleDelete = (id: string) => {
    Alert.alert(
      isRTL ? 'حذف البحث' : 'Delete Search',
      isRTL ? 'هل أنت متأكد من رغبتك في حذف هذا البحث وتوقف التنبيهات؟' : 'Are you sure you want to delete this search and stop alerts?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await savedSearchService.remove(id);
              setSearches(prev => prev.filter(s => s.id !== id));
            } catch (e) {
              Alert.alert(t('common.error'), t('common.error'));
            }
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSearches();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowRight size={24} color="#fff" style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isRTL ? 'البحوث المحفوظة' : 'Saved Searches'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {searches.length > 0 ? (
          searches.map((search) => (
            <View key={search.id} style={[styles.card, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.iconContainer, { [isRTL ? 'marginLeft' : 'marginRight']: 16 }]}>
                <Search size={22} color={COLORS.primary} />
              </View>
              
              <View style={styles.content}>
                <Text style={[styles.queryText, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {search.query || (isRTL ? 'بحث بدون عنوان' : 'Untitled Search')}
                </Text>
                
                <View style={[styles.filtersRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  {search.filters.city && (
                    <View style={[styles.filterBadge, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <MapPin size={10} color={COLORS.gold} />
                      <Text style={styles.filterText}>{search.filters.city}</Text>
                    </View>
                  )}
                  {search.filters.minPrice && (
                    <View style={[styles.filterBadge, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Tag size={10} color={COLORS.gold} />
                      <Text style={styles.filterText}>{`>${search.filters.minPrice}`}</Text>
                    </View>
                  )}
                </View>
              </View>

              <TouchableOpacity onPress={() => handleDelete(search.id)} style={styles.deleteBtn}>
                <Trash2 size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
               <Bell size={48} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>{isRTL ? 'لا يوجد بحوث محفوظة' : 'No Saved Searches'}</Text>
            <Text style={styles.emptySubtitle}>
              {isRTL ? 'احفظ عمليات البحث الخاصة بك لتصلك تنبيهات فورية عند توفر إعلانات جديدة.' : 'Save your searches to receive instant alerts when new listings are available.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  backBtn: { padding: 8 },
  scroll: { padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(6, 78, 59, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1 },
  queryText: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  filtersRow: { flexWrap: 'wrap', gap: 6 },
  filterBadge: {
    backgroundColor: 'rgba(196, 160, 82, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    gap: 4,
  },
  filterText: { fontSize: 10, color: COLORS.gold, fontWeight: '700' },
  deleteBtn: { padding: 10 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyIcon: { backgroundColor: '#fff', padding: 30, borderRadius: 40, marginBottom: 24, elevation: 1 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 12 },
  emptySubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
});
