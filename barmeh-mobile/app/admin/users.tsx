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
import { ArrowRight, User, Shield, ShieldOff, Trash2, Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';

import { COLORS } from '../../styles/colors';

export default function AdminUsers() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await api.get('/users/admin/list');
      setUsers(res.data || []);
    } catch (error) {
      console.log('Load users error:', error);
      Alert.alert(t('common.error'), t('details.error_loading'));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBlock = async (userId: string, isBlocked: boolean) => {
    try {
      await api.post(`/users/admin/${userId}/toggle-block`);
      loadUsers();
      Alert.alert(t('common.success'), isBlocked ? t('admin.success_unblock') : t('admin.success_block'));
    } catch (error) {
      Alert.alert(t('common.error'), t('common.error'));
    }
  };

  const toggleAdmin = async (userId: string, isAdmin: boolean) => {
    Alert.alert(
      t('admin.manage_users'),
      isAdmin ? t('admin.confirm_demote') : t('admin.confirm_promote'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.complete'),
          onPress: async () => {
            try {
              await api.post(`/users/admin/${userId}/toggle-admin`);
              loadUsers();
              Alert.alert(t('common.success'), isAdmin ? t('admin.success_demote') : t('admin.success_promote'));
            } catch (error) {
              Alert.alert(t('common.error'), t('common.error'));
            }
          }
        }
      ]
    );
  };

  const renderUser = ({ item }: { item: any }) => (
    <View style={[styles.userCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={[styles.userInfo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.avatar, { [isRTL ? 'marginLeft' : 'marginRight']: 15 }]}>
          <User size={24} color={COLORS.primary} />
        </View>
        <View style={styles.details}>
          <Text style={[styles.userName, { textAlign: isRTL ? 'right' : 'left' }]}>{item.name || t('admin.no_name_user')}</Text>
          <Text style={[styles.userPhone, { textAlign: isRTL ? 'right' : 'left' }]}>{item.phone}</Text>
          <View style={[styles.badgeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {item.isAdmin && <View style={[styles.badge, { backgroundColor: COLORS.gold }]}>
              <Text style={styles.badgeText}>{t('admin.admin')}</Text>
            </View>}
            {item.isBlocked && <View style={[styles.badge, { backgroundColor: COLORS.error }]}>
              <Text style={styles.badgeText}>{t('admin.blocked')}</Text>
            </View>}
          </View>
        </View>
      </View>
      <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.lightGray }]}
          onPress={() => toggleAdmin(item.id, item.isAdmin)}
        >
          <Shield size={18} color={item.isAdmin ? COLORS.gold : COLORS.darkGray} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: item.isBlocked ? COLORS.success : COLORS.error }]}
          onPress={() => toggleBlock(item.id, item.isBlocked)}
        >
          {item.isBlocked ? <Shield size={18} color="#fff" /> : <ShieldOff size={18} color="#fff" />}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowRight size={24} color={COLORS.primary} style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('admin.manage_users')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{t('admin.no_users')}</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.accent },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  backBtn: { padding: 5 },
  list: { padding: 20 },
  userCard: {
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.accent,
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  userInfo: { alignItems: 'center', flex: 1 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  userPhone: { fontSize: 14, color: COLORS.darkGray, marginTop: 2 },
  badgeRow: { marginTop: 5, gap: 5 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: 'bold' },
  actions: { gap: 10 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 50, color: COLORS.darkGray },
});
