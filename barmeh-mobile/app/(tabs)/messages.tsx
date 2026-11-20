import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { CheckCheck, MessageSquare, LogIn, Search } from 'lucide-react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { authService, chatService, ChatSummary } from '../../services/api';
import { COLORS } from '../../styles/colors';
import { useTranslation } from 'react-i18next';

export default function MessagesScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();
  const [search, setSearch] = useState('');

  function formatTime(iso?: string) {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
      return d.toLocaleTimeString(isRTL ? 'ar-SY' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    }
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays < 7) return t('messages.time.days_ago', { count: diffDays });
    return d.toLocaleDateString(isRTL ? 'ar-SY' : 'en-US');
  }
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [isArchivedMode, setIsArchivedMode] = useState(false);

  const load = useCallback(async () => {
    const isAuthed = await authService.isAuthenticated();
    setAuthed(isAuthed);
    if (!isAuthed) {
      setChats([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const list = await chatService.getMyChats(isArchivedMode);
      setChats(list);
    } catch (err) {
      console.error('Error loading chats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isArchivedMode]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load, isArchivedMode]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleArchiveToggle = (chatId: string) => {
    import('react-native').then(({ Alert }) => {
      Alert.alert(
        isArchivedMode ? (t('chat.unarchive_title') || 'Unarchive Chat') : (t('chat.archive_title') || 'Archive Chat'),
        isArchivedMode ? (t('chat.unarchive_confirm') || 'Move this chat back to inbox?') : (t('chat.archive_confirm') || 'Hide this chat from your main inbox?'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: isArchivedMode ? (t('chat.unarchive_btn') || 'Unarchive') : (t('chat.archive_btn') || 'Archive'),
            onPress: async () => {
              try {
                if (isArchivedMode) {
                  await chatService.unarchiveChat(chatId);
                } else {
                  await chatService.archiveChat(chatId);
                }
                setChats(prev => prev.filter(c => c.id !== chatId));
              } catch (e) {
                console.error(e);
              }
            }
          }
        ]
      );
    });
  };

  const renderItem = ({ item }: { item: ChatSummary }) => {
    return (
      <TouchableOpacity
        style={[styles.chatCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        activeOpacity={0.7}
        onLongPress={() => handleArchiveToggle(item.id)}
        onPress={() => router.push({
          pathname: `/chat/${item.otherUser.id}`,
          params: { listingId: item.listing?.id }
        } as any)}
      >
        <View style={styles.avatarContainer}>
          {item.otherUser.avatarUrl ? (
            <Image source={{ uri: item.otherUser.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{(item.otherUser.name ?? '?').slice(0, 1)}</Text>
            </View>
          )}
        </View>

        <View style={[styles.chatInfo, { [isRTL ? 'marginRight' : 'marginLeft']: 12 }]}>
          <View style={[styles.chatHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.chatName, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              {item.otherUser.name}
            </Text>
            <Text style={styles.chatTime}>{formatTime(item.lastMessageAt)}</Text>
          </View>
          
          <View style={[styles.chatFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={{ flex: 1 }}>
               <Text style={[styles.lastMessage, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                 {item.lastMessage?.content ?? t('messages.no_messages')}
               </Text>
               {item.listing && (
                 <Text style={[styles.listingTag, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                    📦 {item.listing.title}
                 </Text>
               )}
            </View>
            
            {item.listing?.image && (
              <Image source={{ uri: item.listing.image }} style={styles.listingThumb} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
          <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('messages.title')}</Text>
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
          <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('messages.title')}</Text>
        </LinearGradient>
        <View style={styles.emptyBox}>
          <View style={styles.emptyIcon}>
            <MessageSquare size={36} color={COLORS.gold} />
          </View>
          <Text style={styles.emptyTitle}>{t('messages.login_required')}</Text>
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
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={{ paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24, borderBottomWidth: 2, borderBottomColor: COLORS.gold }}>
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.accent, textAlign: isRTL ? 'right' : 'left' }}>
            {isArchivedMode ? (t('chat.archived_chats') || 'Archived Chats') : t('messages.title')}
          </Text>
          <TouchableOpacity 
            onPress={() => setIsArchivedMode(!isArchivedMode)}
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}
          >
            <Text style={{ color: COLORS.accent, fontWeight: '700', fontSize: 13 }}>
              {isArchivedMode ? (t('chat.view_inbox') || 'Inbox') : (t('chat.view_archived') || 'Archived')}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', backgroundColor: COLORS.accent, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 2, borderColor: COLORS.gold }}>
          <Search size={20} color={COLORS.gold} />
          <TextInput
            placeholder={t('explore.search_placeholder')}
            style={{ flex: 1, marginHorizontal: 12, textAlign: isRTL ? 'right' : 'left', fontWeight: '600', color: COLORS.secondary, padding: 0, textAlignVertical: 'center', includeFontPadding: false }}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </LinearGradient>

      <FlatList
        data={chats}
        keyExtractor={(c) => c.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <MessageSquare size={36} color={COLORS.gold} />
            </View>
            <Text style={styles.emptyTitle}>{t('messages.empty')}</Text>
            <Text style={styles.emptyHint}>{t('messages.empty_hint')}</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.browseBtnTxt}>{t('messages.browse_listings')}</Text>
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
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.accent },
  chatCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    marginBottom: 10,
    backgroundColor: COLORS.accent,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  chatInfo: { flex: 1 },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chatName: { fontSize: 16, fontWeight: '800', color: COLORS.secondary, flex: 1 },
  chatTime: { fontSize: 11, color: COLORS.darkGray, fontWeight: '600' },
  chatFooter: { alignItems: 'center', marginTop: 4 },
  lastMessage: { flex: 1, color: COLORS.darkGray, fontSize: 13, fontWeight: '500' },
  listingTag: { fontSize: 11, color: COLORS.primary, fontWeight: '700', marginTop: 2 },
  listingThumb: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#f1f5f9', marginLeft: 10 },
  avatarContainer: { width: 50, height: 50, borderRadius: 25, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: { width: '100%', height: '100%', backgroundColor: 'rgba(196, 160, 82, 0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.gold, borderRadius: 25 },
  avatarText: { color: COLORS.primary, fontWeight: '900', fontSize: 18 },
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
  emptyHint: {
    color: COLORS.darkGray,
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
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
  browseBtn: { marginTop: 20, backgroundColor: 'rgba(6, 78, 59, 0.05)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(196, 160, 82, 0.3)' },
  browseBtnTxt: { color: COLORS.primary, fontWeight: '800', fontSize: 14 },
});
