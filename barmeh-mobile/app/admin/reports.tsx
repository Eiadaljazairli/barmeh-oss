import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, AlertCircle, Trash2, CheckCircle, ExternalLink, ShieldAlert } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { COLORS } from '../../styles/colors';

export default function AdminReports() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const res = await api.get('/reports/admin/list');
      setReports(res.data || []);
    } catch (error) {
      Alert.alert(t('common.error'), t('details.error_loading'));
    } finally {
      setIsLoading(false);
    }
  };

  const resolveReport = async (reportId: string) => {
    try {
      await api.post(`/reports/admin/${reportId}/resolve`);
      loadReports();
      Alert.alert(t('common.success'), t('common.success'));
    } catch (error) {
      Alert.alert(t('common.error'), t('common.error'));
    }
  };

  const renderReport = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.reportIcon, { [isRTL ? 'marginLeft' : 'marginRight']: 12 }]}>
          <AlertCircle size={20} color={COLORS.error} />
        </View>
        <View style={[styles.meta, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.reason, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>{item.reason}</Text>
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.infoLabel}>{t('admin.reported_item')}:</Text>
          <Text style={styles.infoValue}>{t('listing.listing')} #{item.listingId.substring(0,8)}</Text>
        </View>
        <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.infoLabel}>{t('admin.reporter')}:</Text>
          <Text style={styles.infoValue}>{item.reporter?.name || item.reporter?.phone}</Text>
        </View>
      </View>
      
      <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity 
          style={[styles.viewBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          onPress={() => router.push(`/listing/${item.listingId}`)}
        >
          <ExternalLink size={16} color={COLORS.primary} />
          <Text style={styles.btnText}>{t('admin.view_listing')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.resolveBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          onPress={() => resolveReport(item.id)}
        >
          <CheckCircle size={16} color="#fff" />
          <Text style={[styles.btnText, { color: '#fff' }]}>{t('common.close')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowRight size={24} color={COLORS.primary} style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('admin.manage_reports')}</Text>
        <ShieldAlert size={24} color={COLORS.error} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReport}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{t('admin.no_reports')}</Text>
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
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  backBtn: { padding: 5 },
  list: { padding: 15 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    padding: 15,
    backgroundColor: '#fffcfc',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  reportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  meta: { flex: 1 },
  reason: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
  date: { fontSize: 12, color: COLORS.darkGray, marginTop: 4 },
  content: { padding: 15 },
  infoRow: { justifyContent: 'space-between', marginBottom: 5 },
  infoLabel: { fontSize: 13, color: COLORS.darkGray },
  infoValue: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },
  actions: {
    padding: 10,
    backgroundColor: '#fafafa',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    gap: 10,
  },
  viewBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  resolveBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnText: { fontSize: 13, fontWeight: 'bold', color: COLORS.primary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 50, color: COLORS.darkGray },
});
