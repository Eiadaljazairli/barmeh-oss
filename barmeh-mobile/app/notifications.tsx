import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, I18nManager, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Bell, Info, Tag, MessageCircle, ChevronRight, ChevronLeft, Package, ShieldAlert, ArrowRight, Settings, Trash2, CalendarCheck, Check, X } from 'lucide-react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../styles/colors';
import { notificationService, listingService, Notification, Booking } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';

export default function NotificationsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Record<string, Booking>>({});
  const [bookingBusy, setBookingBusy] = useState<Record<string, boolean>>({});

  const loadBookings = async (list: Notification[]) => {
    const ids = list
      .filter((n) => n.type === 'BOOKING' && n.referenceId)
      .map((n) => n.referenceId as string);
    if (ids.length === 0) return;
    const results = await Promise.all(
      ids.map((id) =>
        listingService.getBooking(id).catch(() => null),
      ),
    );
    setBookings((prev) => {
      const next = { ...prev };
      results.forEach((b) => {
        if (b) next[b.id] = b;
      });
      return next;
    });
  };

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
      loadBookings(data);
    } catch (error: any) {
      console.warn('Error fetching notifications:', error?.message || error);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const respondBooking = async (notif: Notification, accept: boolean) => {
    const bookingId = notif.referenceId;
    if (!bookingId || bookingBusy[bookingId]) return;
    setBookingBusy((prev) => ({ ...prev, [bookingId]: true }));
    try {
      const updated = accept
        ? await listingService.acceptBooking(bookingId)
        : await listingService.rejectBooking(bookingId);
      setBookings((prev) => ({ ...prev, [bookingId]: { ...prev[bookingId], ...updated } }));
      notificationService.markAsRead(notif.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
      );
    } catch (e: any) {
      Alert.alert(
        isRTL ? 'تعذّر تنفيذ العملية' : 'Action failed',
        e?.response?.data?.message || (isRTL ? 'حاول مرة أخرى' : 'Please try again'),
      );
    } finally {
      setBookingBusy((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleNotifPress = async (notif: Notification) => {
    if (
      notif.type === 'BOOKING' &&
      notif.referenceId &&
      bookings[notif.referenceId]?.status === 'PENDING'
    ) {
      return;
    }
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    notificationService.markAsRead(notif.id).catch(() => {});
    notificationService.deleteNotification(notif.id).catch(() => {});

    if (notif.type === 'MESSAGE' && notif.referenceId) {
      router.push(`/chat/${notif.referenceId}`);
    } else if (notif.type === 'LISTING_UPDATE' && notif.referenceId) {
      router.push(`/listing/${notif.referenceId}`);
    } else if (notif.type === 'SYSTEM' || notif.type === 'INFO' || notif.type === 'PROMO') {
      Alert.alert(notif.title, notif.body);
    }
  };

  const handleDeleteOne = (notif: Notification) => {
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    notificationService.deleteNotification(notif.id).catch(() => {});
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    Alert.alert(
      t('notifications.clear_all_title') || (isRTL ? 'حذف الكل' : 'Clear all'),
      t('notifications.clear_all_confirm') || (isRTL ? 'هل تريد حذف كل التنبيهات؟' : 'Delete all notifications?'),
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: () => {
            setNotifications([]);
            notificationService.deleteAll().catch(() => {});
          },
        },
      ]
    );
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'MESSAGE': return <MessageCircle size={20} color="#f59e0b" />;
      case 'PROMO': return <Tag size={20} color="#10b981" />;
      case 'LISTING_UPDATE': return <Package size={20} color={COLORS.primary} />;
      case 'BOOKING': return <CalendarCheck size={20} color="#2563eb" />;
      case 'SYSTEM': return <ShieldAlert size={20} color="#ef4444" />;
      default: return <Info size={20} color={COLORS.primary} />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'MESSAGE': return '#fffbeb';
      case 'PROMO': return '#ecfdf5';
      case 'LISTING_UPDATE': return 'rgba(6, 78, 59, 0.05)';
      case 'BOOKING': return '#eff6ff';
      case 'SYSTEM': return '#fef2f2';
      default: return COLORS.lightGray;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={styles.backBtn}>
             <ArrowRight size={24} color={COLORS.secondary} style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
        </View>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={styles.backBtn}>
          <ArrowRight size={24} color="#fff" style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} style={styles.backBtn}>
              <Trash2 size={20} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => router.push('/notification-settings')} style={styles.backBtn}>
            <Settings size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <TouchableOpacity
                key={notif.id}
                style={[
                  styles.notifCard,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                  !notif.isRead && styles.unreadCard
                ]}
                onPress={() => handleNotifPress(notif)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: getBgColor(notif.type), [isRTL ? 'marginLeft' : 'marginRight']: 16 }]}>
                  {getIcon(notif.type)}
                </View>
                <View style={styles.content}>
                  <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{notif.title}</Text>
                  <Text style={[styles.body, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
                    {notif.body}
                  </Text>
                  <Text style={[styles.time, { textAlign: isRTL ? 'right' : 'left', marginTop: 6 }]}>
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: isRTL ? arSA : undefined })}
                  </Text>
                  {notif.type === 'BOOKING' && notif.referenceId && bookings[notif.referenceId] && (
                    bookings[notif.referenceId].status === 'PENDING' ? (
                      <View style={[styles.bookingActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <TouchableOpacity
                          style={[styles.bookingBtn, styles.acceptBtn]}
                          disabled={!!bookingBusy[notif.referenceId]}
                          onPress={() => respondBooking(notif, true)}
                        >
                          {bookingBusy[notif.referenceId] ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Check size={16} color="#fff" />
                              <Text style={styles.acceptText}>{isRTL ? 'قبول' : 'Accept'}</Text>
                            </>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.bookingBtn, styles.rejectBtn]}
                          disabled={!!bookingBusy[notif.referenceId]}
                          onPress={() => respondBooking(notif, false)}
                        >
                          <X size={16} color="#ef4444" />
                          <Text style={styles.rejectText}>{isRTL ? 'رفض' : 'Reject'}</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={[styles.bookingStatusText, {
                        textAlign: isRTL ? 'right' : 'left',
                        color: bookings[notif.referenceId].status === 'ACCEPTED' ? '#16a34a' : '#ef4444',
                      }]}>
                        {bookings[notif.referenceId].status === 'ACCEPTED'
                          ? (isRTL ? 'تم القبول' : 'Accepted')
                          : (isRTL ? 'تم الرفض' : 'Rejected')}
                      </Text>
                    )
                  )}
                </View>
                {!notif.isRead && <View style={styles.unreadDot} />}
                <TouchableOpacity
                  onPress={() => handleDeleteOne(notif)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.deleteBtn}
                >
                  <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Bell size={48} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>{t('notifications.empty')}</Text>
              <Text style={styles.emptySubtitle}>{t('notifications.empty_hint')}</Text>
            </View>
          )}
        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20 },
  notifCard: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#fff',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  unreadCard: {
    borderColor: 'rgba(196, 160, 82, 0.2)',
    backgroundColor: '#fffcf5',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gold,
    position: 'absolute',
    top: 12,
    right: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1 },
  headerRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  time: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
  deleteBtn: { padding: 8, marginLeft: 4 },
  body: { fontSize: 13, color: '#64748b', lineHeight: 18 },
  bookingActions: { marginTop: 10, gap: 8 },
  bookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 92,
  },
  acceptBtn: { backgroundColor: '#16a34a' },
  acceptText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  rejectBtn: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  rejectText: { color: '#ef4444', fontWeight: '800', fontSize: 13 },
  bookingStatusText: { marginTop: 8, fontSize: 13, fontWeight: '800' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyIcon: { backgroundColor: '#fff', padding: 30, borderRadius: 40, marginBottom: 24, elevation: 1 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 12 },
  emptySubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', fontFamily: 'Outfit_Bold' },
  backBtn: { padding: 8 },
});
