import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { 
  Headset, 
  User, 
  Clock, 
  CheckCircle2, 
  ChevronLeft,
  MessageCircle,
  Phone
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../styles/colors';

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  user: {
    name: string;
    phone: string;
  };
  messages: any[];
}

export default function AdminTicketsScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchTickets = async () => {
    try {
      const response = await api.get('/users/admin/support-list');
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      Alert.alert(t('common.error'), t('details.error_loading'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return '#0ea5e9';
      case 'PENDING': return '#f59e0b';
      case 'CLOSED': return COLORS.success;
      default: return COLORS.darkGray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'OPEN': return t('admin.ticket_open');
      case 'PENDING': return t('admin.ticket_pending');
      case 'CLOSED': return t('admin.ticket_closed');
      default: return status;
    }
  };

  const renderTicketItem = ({ item }: { item: SupportTicket }) => (
    <TouchableOpacity 
      style={styles.ticketCard}
      activeOpacity={0.7}
      onPress={() => Alert.alert(t('admin.coming_soon'), t('admin.coming_soon_msg'))}
    >
      <View style={[styles.ticketHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
        <Text style={styles.ticketDate}>
          {new Date(item.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
        </Text>
      </View>

      <Text style={[styles.ticketSubject, { textAlign: isRTL ? 'right' : 'left' }]}>{item.subject}</Text>

      <View style={[styles.userInfo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.userAvatar, { [isRTL ? 'marginLeft' : 'marginRight']: 10 }]}>
          <User size={16} color={COLORS.primary} />
        </View>
        <View style={[styles.userDetails, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={styles.userName}>{item.user?.name || t('admin.unknown_user')}</Text>
          <View style={[styles.userPhoneRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Phone size={12} color={COLORS.darkGray} />
            <Text style={styles.userPhone}>{item.user?.phone}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.ticketFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.msgCount, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <MessageCircle size={16} color={COLORS.darkGray} />
          <Text style={styles.msgCountText}>{t('admin.messages_count', { count: item.messages?.length ?? 0 })}</Text>
        </View>
        <View style={[styles.actionLink, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.actionLinkText}>{t('common.view_details')}</Text>
          <ChevronLeft size={16} color={COLORS.primary} style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: t('admin.manage_tickets'),
          headerTitleStyle: { fontFamily: 'Outfit_Bold', fontSize: 18 },
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: COLORS.primaryDeep,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
              <ChevronLeft
                size={26}
                color={COLORS.primaryDeep}
                style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }}
              />
            </TouchableOpacity>
          ),
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderTicketItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Headset size={60} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>{t('admin.no_tickets')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  ticketHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Outfit_Bold',
  },
  ticketDate: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontFamily: 'Outfit_Regular',
  },
  ticketSubject: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 15,
    fontFamily: 'Outfit_Bold',
  },
  userInfo: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 12,
    marginBottom: 15,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    fontFamily: 'Outfit_Medium',
  },
  userPhoneRow: {
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  userPhone: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontFamily: 'Outfit_Regular',
  },
  ticketFooter: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  msgCount: {
    alignItems: 'center',
    gap: 6,
  },
  msgCountText: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontFamily: 'Outfit_Medium',
  },
  actionLink: {
    alignItems: 'center',
    gap: 4,
  },
  actionLinkText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
    fontFamily: 'Outfit_Bold',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.darkGray,
    fontFamily: 'Outfit_Medium',
  },
});
