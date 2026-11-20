import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ImageBackground,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Send, MoreVertical, ShieldCheck, Check, CheckCheck, Star, X, Ban, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { authService, chatService, ChatMessage, api, reviewService, usersService } from '../../services/api';
import { socketService } from '../../services/socket';
import { COLORS } from '../../styles/colors';
import { Modal } from 'react-native';
import TrustBadge from '../../components/TrustBadge';

export default function ChatDetailScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();
  const { userId, listingId } = useLocalSearchParams<{ userId: string; listingId?: string }>();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [otherUser, setOtherUser] = useState<{ name?: string; avatarUrl?: string | null; trustLevel?: string } | null>(null);
  const [listing, setListing] = useState<any>(null);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [meId, setMeId] = useState<string | null>(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  const listRef = useRef<FlatList<ChatMessage>>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatIdRef = useRef<string | null>(null);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchOtherUser = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await api.get(`/users/${userId}/public`);
      setOtherUser(response.data);
    } catch (err) {
      console.error('Error fetching user info:', err);
    }
  }, [userId]);

  const loadHistory = useCallback(async () => {
    if (!userId) return;
    try {
      const history = await chatService.getHistory(userId, listingId);
      setMessages(history.messages || []);
      if (history.listing) {
        setListing(history.listing);
      }

      if (history.id) {
        chatIdRef.current = history.id;
        chatService.markAsRead(history.id);
        socketService.markRead(history.id);
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        router.replace('/(tabs)/profile');
      }
    } finally {
      setLoading(false);
    }
  }, [userId, listingId, router]);

  useEffect(() => {
    (async () => {
      const me = await authService.getCurrentUser();
      if (!me) {
        router.replace('/(tabs)/profile');
        return;
      }
      setMeId(me.id);
      fetchOtherUser();
      loadHistory();

      await socketService.connect();
      const socket = socketService.getSocket();

      if (socket) {
        socket.on('new_message', (msg: ChatMessage) => {
          if (msg.senderId === userId || msg.senderId === me.id) {
             setMessages((prev) => {
               if (prev.some(m => m.id === msg.id)) return prev;
               return [...prev, msg];
             });
             setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
             if (msg.senderId === userId) {
               const cid = chatIdRef.current || msg.chatId;
               if (cid) socketService.markRead(cid);
             }
          }
        });

        socket.on('messages_read', (data: { chatId: string; readAt: string }) => {
          if (chatIdRef.current && data.chatId !== chatIdRef.current) return;
          setMessages((prev) =>
            prev.map((m) =>
              m.senderId === me.id && !m.readAt ? { ...m, readAt: data.readAt } : m,
            ),
          );
        });

        socket.on('typing', (data: { senderId: string, listingId?: string }) => {
          if (data.senderId === userId) {
            setIsOtherTyping(true);
          }
        });

        socket.on('stop_typing', (data: { senderId: string }) => {
          if (data.senderId === userId) {
            setIsOtherTyping(false);
          }
        });
      }
    })();

    return () => {
      socketService.getSocket()?.off('new_message');
      socketService.getSocket()?.off('typing');
      socketService.getSocket()?.off('stop_typing');
      socketService.getSocket()?.off('messages_read');
    };
  }, [userId, listingId, loadHistory, fetchOtherUser, router]);

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || !userId) return;

    setSending(true);
    setContent('');
    socketService.stopTyping(userId, listingId);

    try {
      const newMsg = await chatService.sendMessage(userId, trimmed, listingId);
      setMessages((prev) => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      Alert.alert(t('common.error'), t('chat.send_error'));
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (text: string) => {
    setContent(text);
    if (!userId) return;

    socketService.sendTyping(userId, listingId);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopTyping(userId, listingId);
    }, 3000);
  };

    const handleMoreActions = () => {
    Alert.alert(
      t('chat.actions_title') || 'Actions',
      '',
      [
        { text: t('chat.view_profile') || 'View Profile', onPress: () => router.push(`/user/${userId}`) },
        {
          text: t('profile.block') || 'Block',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('profile.block_user_title'),
              t('profile.block_user_confirm', { name: otherUser?.name }),
              [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('profile.block'),
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await usersService.blockUser(userId as string);
                      Alert.alert(t('common.success'), t('profile.blocked_success'));
                      router.back();
                    } catch (e) {
                      Alert.alert(t('common.error'), t('profile.block_failed'));
                    }
                  }
                }
              ]
            );
          }
        },
        { text: t('common.cancel'), style: 'cancel' }
      ]
    );
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert(t('common.error'), t('reviews.rating_required') || 'Please select a rating');
      return;
    }
    setSubmittingReview(true);
    try {
      await reviewService.createReview({
        reviewedUserId: userId,
        rating,
        comment: reviewComment
      });
      Alert.alert(t('common.success'), t('reviews.success') || 'Thank you for your rating!');
      setShowReviewModal(false);
    } catch (err) {
      Alert.alert(t('common.error'), t('reviews.error') || 'Could not submit rating. Try again later.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    Alert.alert(
      t('chat.delete_msg_title') || 'Delete Message',
      t('chat.delete_msg_confirm') || 'Are you sure you want to delete this message for yourself? The other person will still see it.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatService.deleteMessageForMe(messageId);
              setMessages(prev => prev.filter(m => m.id !== messageId));
            } catch (err) {
              Alert.alert(t('common.error'), t('chat.delete_error') || 'Could not delete message');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isMine = item.senderId === meId;
    const time = new Date(item.createdAt).toLocaleTimeString(isRTL ? 'ar-SY' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={[
        styles.messageRow,
        {
          flexDirection: isRTL ? 'row-reverse' : 'row',
          justifyContent: isMine ? 'flex-end' : 'flex-start',
        },
      ]}>
        {!isMine && (
          <View style={[styles.avatarContainer, { [isRTL ? 'marginLeft' : 'marginRight']: 8 }]}>
            {otherUser?.avatarUrl ? (
              <Image source={{ uri: otherUser.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{(otherUser?.name || 'U').charAt(0)}</Text>
              </View>
            )}
          </View>
        )}
        <TouchableOpacity
          style={[styles.bubbleWrapper, isMine ? styles.myWrapper : styles.theirWrapper]}
          activeOpacity={0.8}
          onLongPress={() => handleDeleteMessage(item.id)}
        >
          {isMine ? (
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.bubble, isRTL ? styles.tailLeft : styles.tailRight]}
            >
              <Text style={[styles.myMessageText, { textAlign: isRTL ? 'right' : 'left' }]}>{item.content}</Text>
              <View style={[styles.bubbleFooter, { flexDirection: isRTL ? 'row-reverse' : 'row', alignSelf: isRTL ? 'flex-start' : 'flex-end' }]}>
                 <Text style={styles.myTimeText}>{time}</Text>
                 {item.readAt ? (
                   <CheckCheck size={12} color="#fff" style={{ [isRTL ? 'marginRight' : 'marginLeft']: 4, opacity: 0.8 }} />
                 ) : (
                   <Check size={12} color="#fff" style={{ [isRTL ? 'marginRight' : 'marginLeft']: 4, opacity: 0.6 }} />
                 )}
              </View>
            </LinearGradient>
          ) : (
            <View style={[styles.theirBubble, isRTL ? styles.tailRight : styles.tailLeft]}>
              <Text style={[styles.theirMessageText, { textAlign: isRTL ? 'right' : 'left' }]}>{item.content}</Text>
              <View style={[styles.bubbleFooter, { flexDirection: isRTL ? 'row-reverse' : 'row', alignSelf: isRTL ? 'flex-start' : 'flex-end' }]}>
                 <Text style={styles.theirTimeText}>{time}</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={COLORS.secondary} style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
           <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
             <Text style={styles.headerName}>{otherUser?.name || t('chat.user_placeholder')}</Text>
             {otherUser?.trustLevel && otherUser.trustLevel !== 'NEWBIE' && (
               <TrustBadge level={otherUser.trustLevel as any} showText={false} size={14} />
             )}
           </View>
           <View style={[styles.headerStatus, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.onlineDot, { [isRTL ? 'marginLeft' : 'marginRight']: 6 }]} />
              <Text style={styles.statusText}>{isOtherTyping ? t('chat.typing') : t('chat.online')}</Text>
           </View>
        </View>

        <TouchableOpacity style={styles.moreBtn} onPress={() => setShowReviewModal(true)}>
           <Star size={22} color={COLORS.gold} fill={rating > 0 ? COLORS.gold : 'transparent'} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.moreBtn} onPress={handleMoreActions}>
           <MoreVertical size={22} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>

      {listing && (
        <TouchableOpacity
          style={[styles.listingHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          onPress={() => router.push(`/listing/${listing.id}`)}
        >
          <Image
            source={{ uri: listing.images?.[0]?.thumbUrl || 'https://via.placeholder.com/150' }}
            style={styles.listingThumb}
          />
          <View style={{ flex: 1, [isRTL ? 'marginRight' : 'marginLeft']: 12 }}>
            <Text style={[styles.listingTitle, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{listing.title}</Text>
            <Text style={[styles.listingPrice, { textAlign: isRTL ? 'right' : 'left' }]}>{listing.price.toLocaleString()} {t('details.currency')}</Text>
          </View>
        </TouchableOpacity>
      )}

      <ImageBackground
        source={{ uri: 'https://www.transparenttextures.com/patterns/cubes.png' }}
        style={styles.chatArea}
        imageStyle={{ opacity: 0.05 }}
      >
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <View style={styles.shieldIcon}>
                   <ShieldCheck size={40} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>{t('chat.empty_title')}</Text>
                <Text style={styles.emptySub}>{t('chat.empty_sub')}</Text>
              </View>
            }
          />
        )}
      </ImageBackground>

      {isOtherTyping && (
        <View style={[styles.typingOverlay, { [isRTL ? 'right' : 'left']: 20 }]}>
           <Text style={styles.typingText}>{t('chat.typing_hint', { name: otherUser?.name })}</Text>
        </View>
      )}

      <View style={[styles.composer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TextInput
          style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
          placeholder={t('chat.placeholder')}
          placeholderTextColor="#94a3b8"
          value={content}
          onChangeText={handleTyping}
          multiline
          maxLength={2000}
          keyboardDismissMode="interactive"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!content.trim()) && styles.sendBtnDisabled, { [isRTL ? 'marginRight' : 'marginLeft']: 10 }]}
          onPress={handleSend}
          disabled={!content.trim() || sending}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.sendGradient}
          >
            {sending ? <ActivityIndicator color="#fff" size="small" /> : <Send size={20} color="#fff" style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showReviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={[styles.modalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
               <Text style={styles.modalTitle}>{t('reviews.rate_user', { name: otherUser?.name })}</Text>
               <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                  <X size={24} color={COLORS.secondary} />
               </TouchableOpacity>
            </View>

            <View style={styles.starRow}>
               {[1, 2, 3, 4, 5].map((s) => (
                 <TouchableOpacity key={s} onPress={() => setRating(s)} style={{ marginHorizontal: 8 }}>
                    <Star size={40} color={COLORS.gold} fill={s <= rating ? COLORS.gold : 'transparent'} />
                 </TouchableOpacity>
               ))}
            </View>

            <TextInput
              style={[styles.reviewInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={t('reviews.comment_placeholder') || 'Tell us about your experience...'}
              multiline
              numberOfLines={4}
              value={reviewComment}
              onChangeText={setReviewComment}
            />

            <TouchableOpacity
              style={[styles.submitBtn, submittingReview && { opacity: 0.7 }]}
              onPress={handleSubmitReview}
              disabled={submittingReview}
            >
              <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.submitGradient}>
                {submittingReview ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{t('reviews.submit') || 'Submit Rating'}</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.accent },
  header: {
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    zIndex: 10,
  },
  headerInfo: { flex: 1, alignItems: 'center' },
  headerName: { fontSize: 17, fontWeight: '900', color: COLORS.secondary },
  headerStatus: { alignItems: 'center', marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  statusText: { fontSize: 11, color: '#10b981', fontWeight: '700' },
  backBtn: { padding: 8, backgroundColor: 'rgba(6, 78, 59, 0.05)', borderRadius: 12 },
  moreBtn: { padding: 8 },

  listingHeader: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  listingThumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#f1f5f9' },
  listingTitle: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  listingPrice: { fontSize: 12, fontWeight: '800', color: COLORS.primary, marginTop: 2 },

  chatArea: { flex: 1, backgroundColor: '#fdfdfd' },
  messageRow: { marginBottom: 15, alignItems: 'flex-end' },
  avatarContainer: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: { width: '100%', height: '100%', backgroundColor: 'rgba(196, 160, 82, 0.2)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 12, fontWeight: '900', color: COLORS.primary },

  bubbleWrapper: { maxWidth: '80%' },
  myWrapper: { alignItems: 'flex-end' },
  theirWrapper: { alignItems: 'flex-start' },
  bubble: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, minWidth: 90 },
  theirBubble: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, minWidth: 90, borderWidth: 1, borderColor: '#f1f5f9' },
  tailLeft: { borderBottomLeftRadius: 4 },
  tailRight: { borderBottomRightRadius: 4 },
  myMessageText: { color: '#fff', fontSize: 15, fontWeight: '500', lineHeight: 22 },
  theirMessageText: { color: COLORS.secondary, fontSize: 15, fontWeight: '500', lineHeight: 22 },
  bubbleFooter: { marginTop: 3, alignItems: 'center' },
  myTimeText: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  theirTimeText: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },

  typingOverlay: { position: 'absolute', bottom: 100, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  typingText: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },

  composer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 15,
    backgroundColor: COLORS.accent,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    maxHeight: 120,
    fontSize: 15,
    color: COLORS.secondary,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    textAlignVertical: 'top',
    includeFontPadding: false,
    marginHorizontal: 8,
  },
  attachBtn: {
    padding: 4,
  },
  attachIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(6, 78, 59, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtn: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  sendGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
  emptyBox: { alignItems: 'center', paddingVertical: 100 },
  shieldIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(6, 78, 59, 0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { color: COLORS.secondary, fontWeight: '900', fontSize: 16, marginBottom: 8 },
  emptySub: { color: '#64748b', fontSize: 13, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 60 },
  modalHeader: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: COLORS.secondary },
  starRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  reviewInput: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, fontSize: 15, color: COLORS.secondary, height: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 24 },
  submitBtn: { height: 55, borderRadius: 16, overflow: 'hidden' },
  submitGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
