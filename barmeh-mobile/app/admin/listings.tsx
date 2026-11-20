import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Trash2, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { COLORS } from '../../styles/colors';

export default function AdminListings() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      const res = await api.get('/listings/admin/list');
      setListings(res.data || []);
    } catch (error) {
      Alert.alert(t('common.error'), t('details.error_loading'));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteListing = async (id: string) => {
    Alert.alert(
      t('common.confirm_delete'),
      t('post.alerts.delete_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/listings/${id}/delete`);
              loadListings();
              Alert.alert(t('common.success'), t('common.success'));
            } catch (error) {
              Alert.alert(t('common.error'), t('common.error'));
            }
          }
        }
      ]
    );
  };

  const renderListing = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.listingMeta, { [isRTL ? 'marginRight' : 'marginLeft']: 12, alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.listingTitle, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.listingPrice, { textAlign: isRTL ? 'right' : 'left' }]}>{item.price} {t('common.syp')}</Text>
        </View>
        <Image 
          source={{ uri: item.images?.[0]?.thumbUrl || 'https://via.placeholder.com/100' }} 
          style={styles.thumb} 
        />
      </View>
      
      <View style={[styles.cardFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={[styles.userName, { textAlign: isRTL ? 'right' : 'left' }]}>{t('details.seller')}: {item.user?.name || item.user?.phone}</Text>
        <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity 
            style={styles.viewBtn}
            onPress={() => router.push(`/listing/${item.id}`)}
          >
            <ExternalLink size={16} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteBtn}
            onPress={() => deleteListing(item.id)}
          >
            <Trash2 size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowRight size={24} color={COLORS.primary} style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('admin.manage_listings')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      ) : (
        <FlatList
          data={listings}
          renderItem={renderListing}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{t('admin.no_listings')}</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  backBtn: { padding: 5 },
  list: { padding: 15 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.gray,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 12,
    alignItems: 'center',
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
  },
  listingMeta: {
    flex: 1,
  },
  listingTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  listingPrice: {
    fontSize: 13,
    color: COLORS.gold,
    fontWeight: 'bold',
    marginTop: 4,
  },
  cardFooter: {
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fafafa',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  userName: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  actions: {
    gap: 8,
  },
  viewBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 50, color: COLORS.darkGray },
});
