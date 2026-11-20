import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Tag,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Headset,
  Activity
} from 'lucide-react-native';
import { api } from '../../services/api';

const { width } = Dimensions.get('window');

import { COLORS } from '../../styles/colors';

export default function AdminDashboard() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    activeReports: 0,
    pendingTickets: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [usersRes, listingsRes, reportsRes, ticketsRes] = await Promise.all([
        api.get('/users/admin/count'),
        api.get('/listings/admin/count'),
        api.get('/reports/admin/count'),
        api.get('/users/admin/support-count')
      ]);
      setStats({
        totalUsers: usersRes.data.count || 0,
        totalListings: listingsRes.data.count || 0,
        activeReports: reportsRes.data.count || 0,
        pendingTickets: ticketsRes.data.count || 0
      });
    } catch (error) {
      console.log('Stats error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, onPress }: any) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']} style={styles.statCardInner}>
        <View style={[styles.iconCircle, { backgroundColor: color + '25' }]}>
          <Icon size={24} color={color} />
        </View>
        <View style={[styles.statInfo, { [isRTL ? 'marginRight' : 'marginLeft']: 12 }]}>
          <Text style={[styles.statValue, { textAlign: isRTL ? 'right' : 'left' }]}>{value}</Text>
          <Text style={[styles.statTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          {isRTL ? <ArrowRight size={24} color={COLORS.accent} /> : <ArrowLeft size={24} color={COLORS.accent} />}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('admin.dashboard')}</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        <LinearGradient
          colors={[COLORS.tealDark, COLORS.primaryDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.welcomeSection, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          <ShieldCheck size={36} color={COLORS.gold} />
          <View style={[styles.welcomeTextContainer, { [isRTL ? 'marginRight' : 'marginLeft']: 15 }]}>
            <Text style={[styles.welcomeText, { textAlign: isRTL ? 'right' : 'left' }]}>{t('admin.welcome')}</Text>
            <Text style={[styles.welcomeSubText, { textAlign: isRTL ? 'right' : 'left' }]}>{t('admin.status')}</Text>
          </View>
        </LinearGradient>

        <View style={[styles.statsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <StatCard
            title={t('admin.users')}
            value={stats.totalUsers}
            icon={Users}
            color="#3498db"
            onPress={() => router.push('/admin/users')}
          />
          <StatCard
            title={t('admin.listings')}
            value={stats.totalListings}
            icon={Tag}
            color={COLORS.success}
            onPress={() => router.push('/admin/listings')}
          />
          <StatCard
            title={t('admin.reports')}
            value={stats.activeReports}
            icon={AlertTriangle}
            color={COLORS.error}
            onPress={() => router.push('/admin/reports')}
          />
          <StatCard
            title={t('admin.tickets')}
            value={stats.pendingTickets}
            icon={Headset}
            color={COLORS.gold}
            onPress={() => router.push('/admin/tickets')}
          />
        </View>

        <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Activity size={20} color={COLORS.gold} />
          <Text style={[styles.sectionTitle, { [isRTL ? 'marginRight' : 'marginLeft']: 8 }]}>{t('admin.advanced')}</Text>
        </View>

        <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/admin/users')} activeOpacity={0.8}>
          <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']} style={[styles.actionMain, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Users size={22} color={COLORS.gold} />
            <Text style={[styles.actionText, { [isRTL ? 'marginRight' : 'marginLeft']: 15 }]}>{t('admin.manage_users')}</Text>
            <View style={styles.actionSpacer} />
            {isRTL ? (
              <ArrowRight size={20} color="rgba(255,255,255,0.55)" style={{ transform: [{ rotate: '180deg' }] }} />
            ) : (
              <ArrowLeft size={20} color="rgba(255,255,255,0.55)" style={{ transform: [{ rotate: '180deg' }] }} />
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/admin/listings')} activeOpacity={0.8}>
          <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']} style={[styles.actionMain, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Tag size={22} color={COLORS.gold} />
            <Text style={[styles.actionText, { [isRTL ? 'marginRight' : 'marginLeft']: 15 }]}>{t('admin.manage_listings')}</Text>
            <View style={styles.actionSpacer} />
            {isRTL ? (
              <ArrowRight size={20} color="rgba(255,255,255,0.55)" style={{ transform: [{ rotate: '180deg' }] }} />
            ) : (
              <ArrowLeft size={20} color="rgba(255,255,255,0.55)" style={{ transform: [{ rotate: '180deg' }] }} />
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/admin/reports')} activeOpacity={0.8}>
          <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']} style={[styles.actionMain, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <AlertTriangle size={22} color={COLORS.error} />
            <Text style={[styles.actionText, { [isRTL ? 'marginRight' : 'marginLeft']: 15 }]}>{t('admin.manage_reports')}</Text>
            <View style={styles.actionSpacer} />
            {isRTL ? (
              <ArrowRight size={20} color="rgba(255,255,255,0.55)" style={{ transform: [{ rotate: '180deg' }] }} />
            ) : (
              <ArrowLeft size={20} color="rgba(255,255,255,0.55)" style={{ transform: [{ rotate: '180deg' }] }} />
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/admin/tickets')} activeOpacity={0.8}>
          <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']} style={[styles.actionMain, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Headset size={22} color={COLORS.gold} />
            <Text style={[styles.actionText, { [isRTL ? 'marginRight' : 'marginLeft']: 15 }]}>{t('admin.manage_tickets')}</Text>
            <View style={styles.actionSpacer} />
            {isRTL ? (
              <ArrowRight size={20} color="rgba(255,255,255,0.55)" style={{ transform: [{ rotate: '180deg' }] }} />
            ) : (
              <ArrowLeft size={20} color="rgba(255,255,255,0.55)" style={{ transform: [{ rotate: '180deg' }] }} />
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>{t('common.app_name')} OS V1.0.0 | ENTERPRISE EDITION</Text>
          <Text style={styles.footerText}>{t('admin.footer')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  backBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 50,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeText: {
    color: COLORS.accent,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeSubText: {
    color: 'rgba(245, 241, 232, 0.75)',
    fontSize: 12,
  },
  statsGrid: {
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statCard: {
    width: (width - 55) / 2,
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statCardInner: {
    padding: 15,
    alignItems: 'center',
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  statTitle: {
    fontSize: 11,
    color: 'rgba(245, 241, 232, 0.8)',
    marginTop: 2,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  actionItem: {
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
  },
  actionMain: {
    alignItems: 'center',
    padding: 18,
  },
  actionText: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '500',
  },
  actionSpacer: {
    flex: 1,
  },
  footerInfo: {
    marginTop: 40,
    marginBottom: 50,
    alignItems: 'center',
    opacity: 0.5,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.accent,
    letterSpacing: 1,
    marginTop: 4,
  },
});
