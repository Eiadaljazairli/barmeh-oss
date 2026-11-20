import React, { useCallback, useState } from 'react';
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
import { ArrowRight, ArrowLeft, ShieldOff, UserX } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usersService, authService } from '../../services/api';
import { COLORS } from '../../styles/colors';
import { ensureAbsoluteUrl } from '../../utils/url';

type BlockedUser = { id: string; name: string; avatarUrl?: string };

export default function BlockedUsersScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [items, setItems] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

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
      const blocked = await usersService.getBlockedUsers();
      setItems(blocked);
    } catch (err) {
      console.error('Error loading blocked users:', err);
      Alert.alert(t('common.error'), t('profile.block_failed'));
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

  const handleUnblock = (user: BlockedUser) => {
    Alert.alert(
      t('profile.unblock'),
      t('profile.unblock_user_confirm', { name: user.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.unblock'),
          style: 'destructive',
          onPress: async () => {
            setUnblockingId(user.id);
            const prev = items;
            setItems((cur) => cur.filter((u) => u.id !== user.id));
            try {
              await usersService.unblockUser(user.id);
            } catch (err) {
              setItems(prev);
              Alert.alert(t('common.error'), t('profile.unblock_failed'));
            } finally {
              setUnblockingId(null);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: BlockedUser }) => {
    const avatar = ensureAbsoluteUrl(item.avatarUrl);
    const initial = item.name?.trim()?.[0] || '?';
    const isUnblocking = unblockingId === item.id;

    return (
      <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity
          style={[styles.userInfo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          activeOpacity={0.7}
          onPress={() => router.push(`/user/${item.id}` as any)}
        >
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}
          <Text
            style={[styles.name, { textAlign: isRTL ? 'right' : 'left' }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.unblockBtn, isUnblocking && styles.unblockBtnDisabled]}
          onPress={() => handleUnblock(item)}
          disabled={isUnblocking}
          activeOpacity={0.8}
        >
          {isUnblocking ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <ShieldOff size={16} color={COLORS.primary} />
              <Text style={styles.unblockText}>{t('profile.unblock')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const HeaderBar = (
    <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        {isRTL ? (
          <ArrowRight size={24} color="#fff" />
        ) : (
          <ArrowLeft size={24} color="#fff" />
        )}
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{t('profile.blocked_users')}</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        {HeaderBar}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  if (authed === false) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        {HeaderBar}
        <View style={styles.center}>
          <UserX size={64} color={COLORS.darkGray} />
          <Text style={styles.emptyTitle}>{t('common.login_required')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      {HeaderBar}
      <FlatList
        data={items}
        keyExtractor={(u) => u.id}
        renderItem={renderItem}
        contentContainerStyle={items.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <ShieldOff size={64} color={COLORS.darkGray} />
            <Text style={styles.emptyTitle}>{t('profile.no_blocked_users')}</Text>
            <Text style={styles.emptySubtitle}>{t('profile.no_blocked_users_hint')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    height: 60,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  row: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  userInfo: {
    flex: 1,
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eee',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  unblockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    minWidth: 90,
    justifyContent: 'center',
  },
  unblockBtnDisabled: {
    opacity: 0.5,
  },
  unblockText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#444',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
