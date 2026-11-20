import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ShoppingBag,
  TrendingUp,
  Users,
  BarChart3,
  Package,
  Settings,
  ChevronLeft,
  ArrowUpRight,
  MessageCircle,
  Star
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../styles/colors';
import { usersService, UserMe } from '../../services/api';

interface MerchantStats {
  activeListings: number;
  unreadMessages: number;
  reviewsCount: number;
  averageRating: number;
}

const { width } = Dimensions.get('window');

export default function MerchantDashboard() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [me, setMe] = useState<UserMe | null>(null);
  const [stats, setStats] = useState<MerchantStats | null>(null);

  const loadData = async () => {
    try {
      const [userData, statsData] = await Promise.all([
        usersService.getMe(),
        usersService.getMeStats().catch(() => null),
      ]);
      setMe(userData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading merchant data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.header}>
        <View style={[styles.topBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#fff" style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/merchant/settings')}>
            <Settings size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <View pointerEvents="none" style={styles.titleOverlay}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t('merchant.dashboard_title') || (isRTL ? 'لوحة التحكم' : 'Dashboard')}
          </Text>
        </View>

        <View style={styles.storeSummary}>
          <View style={styles.storeLogoContainer}>
            <ShoppingBag size={30} color={COLORS.gold} />
          </View>
          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <Text style={styles.storeName}>{me?.merchantProfile?.storeName || (isRTL ? 'متجري' : 'My Store')}</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>{t('merchant.verified') || (isRTL ? 'تاجر معتمد' : 'Verified Merchant')}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(6, 78, 59, 0.1)' }]}>
              <Package size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{stats ? stats.activeListings : '—'}</Text>
            <Text style={styles.statLabel}>{t('merchant.active_listings')}</Text>
          </View>

          <View style={[styles.statCard, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
              <MessageCircle size={20} color="#2563eb" />
            </View>
            <Text style={styles.statValue}>{stats ? stats.unreadMessages : '—'}</Text>
            <Text style={styles.statLabel}>{t('merchant.new_messages')}</Text>
          </View>

          <View style={[styles.statCard, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
              <Star size={20} color="#f59e0b" />
            </View>
            <Text style={styles.statValue}>
              {stats && stats.reviewsCount > 0 ? stats.averageRating.toFixed(1) : '—'}
            </Text>
            <Text style={styles.statLabel}>{t('merchant.rating')}</Text>
          </View>

          <View style={[styles.statCard, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(196, 160, 82, 0.1)' }]}>
              <Users size={20} color={COLORS.gold} />
            </View>
            <Text style={styles.statValue}>{stats ? stats.reviewsCount : '—'}</Text>
            <Text style={styles.statLabel}>
              {t('merchant.reviews_count') || (isRTL ? 'عدد التقييمات' : 'Reviews')}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('merchant.quick_actions') || (isRTL ? 'إجراءات سريعة' : 'Quick Actions')}</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/post')}>
            <Package size={24} color={COLORS.primary} />
            <Text style={styles.actionLabel}>{t('merchant.add_listing') || (isRTL ? 'إضافة إعلان' : 'Add Listing')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/profile/listings')}>
            <BarChart3 size={24} color={COLORS.secondary} />
            <Text style={styles.actionLabel}>{t('merchant.manage_listings') || (isRTL ? 'إدارة الإعلانات' : 'Manage Ads')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/merchant/settings')}>
            <Settings size={24} color={COLORS.gold} />
            <Text style={styles.actionLabel}>{t('merchant.store_settings') || (isRTL ? 'إعدادات المتجر' : 'Store Settings')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/messages')}>
            <MessageCircle size={24} color="#2563eb" />
            <Text style={styles.actionLabel}>{t('merchant.messages') || (isRTL ? 'الرسائل' : 'Messages')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.limitCard}>
          <View style={[styles.limitHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TrendingUp size={20} color={COLORS.primary} />
            <Text style={styles.limitTitle}>{t('merchant.listing_usage') || (isRTL ? 'استهلاك حصة الإعلانات' : 'Listing Quota')}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(((stats?.activeListings ?? me?._count?.listings) || 0) / 50) * 100}%` }]} />
          </View>
          <View style={[styles.limitFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.limitText}>{(stats?.activeListings ?? me?._count?.listings) || 0} / 50 {t('common.listing')}</Text>
            <Text style={styles.limitPercent}>{Math.round((((stats?.activeListings ?? me?._count?.listings) || 0) / 50) * 100)}%</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  topBar: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    position: 'relative',
  },
  titleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },
  storeSummary: {
    alignItems: 'center',
  },
  storeLogoContainer: {
    width: 80,
    height: 80,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  storeName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  statCard: {
    width: (width - 55) / 2,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontWeight: '600',
    marginTop: 2,
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.secondary,
    marginTop: 30,
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    width: (width - 70) / 4,
    alignItems: 'center',
    gap: 8,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  limitCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 24,
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  limitHeader: {
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  limitTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  limitFooter: {
    justifyContent: 'space-between',
    marginTop: 10,
  },
  limitText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
  limitPercent: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primary,
  },
});
