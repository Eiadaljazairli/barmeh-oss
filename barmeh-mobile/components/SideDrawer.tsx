import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  ShieldCheck,
  AlertOctagon,
  LifeBuoy,
  HelpCircle,
  Settings,
  User,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../styles/colors';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

type StoredUser = {
  id: string;
  trustScore?: number;
  trustLevel?: string;
  isAdmin?: boolean;
};

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.82, 340);

type DrawerItem = {
  key: string;
  labelAr: string;
  labelEn: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  path?: string;
  onPress?: () => void;
  variant?: 'default' | 'danger';
  badge?: string | number;
};

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const SideDrawer: React.FC<Props> = ({ visible, onClose }) => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { isAuthenticated, logout } = useAuth();
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    if (visible && isAuthenticated) {
      authService.getCurrentUser().then((u) => setUser(u as StoredUser | null)).catch(() => {});
    }
  }, [visible, isAuthenticated]);

  const isVerified = user?.trustLevel === 'VERIFIED' || user?.trustLevel === 'TRUSTED';

  const slideAnim = useRef(new Animated.Value(isRTL ? DRAWER_WIDTH : -DRAWER_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: isRTL ? DRAWER_WIDTH : -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, isRTL, slideAnim, backdropAnim]);

  const go = (path: string) => {
    onClose();
    setTimeout(() => router.push(path as any), 220);
  };

  const handleLogout = async () => {
    onClose();
    setTimeout(async () => {
      await logout();
      router.replace('/login' as any);
    }, 220);
  };

  const accountItems: DrawerItem[] = [
    {
      key: 'profile',
      labelAr: 'حسابي',
      labelEn: 'My account',
      Icon: User,
      path: '/(tabs)/profile',
    },
    {
      key: 'settings',
      labelAr: 'الإعدادات',
      labelEn: 'Settings',
      Icon: Settings,
      path: '/notification-settings',
    },
  ];

  const infoItems: DrawerItem[] = [
    {
      key: 'safety',
      labelAr: 'مركز الأمان',
      labelEn: 'Safety center',
      Icon: LifeBuoy,
      path: '/safety',
    },
    {
      key: 'banned',
      labelAr: 'الممنوعات',
      labelEn: 'Banned items',
      Icon: AlertOctagon,
      path: '/banned-items',
    },
    {
      key: 'faq',
      labelAr: 'الأسئلة الشائعة',
      labelEn: 'FAQ',
      Icon: HelpCircle,
      path: '/faq',
    },
    {
      key: 'support',
      labelAr: 'تواصل مع الدعم',
      labelEn: 'Contact support',
      Icon: MessageSquare,
      path: '/support',
    },
  ];

  const renderItem = (item: DrawerItem) => {
    const label = isRTL ? item.labelAr : item.labelEn;
    const isDanger = item.variant === 'danger';
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

    return (
      <TouchableOpacity
        key={item.key}
        style={[styles.item, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        activeOpacity={0.7}
        onPress={() => {
          if (item.onPress) item.onPress();
          else if (item.path) go(item.path);
        }}
      >
        <View
          style={[
            styles.itemIconWrap,
            isDanger && styles.itemIconWrapDanger,
          ]}
        >
          <item.Icon
            size={20}
            color={isDanger ? COLORS.error : COLORS.primary}
            strokeWidth={1.85}
          />
        </View>
        <Text
          style={[
            styles.itemLabel,
            { textAlign: isRTL ? 'right' : 'left' },
            isDanger && styles.itemLabelDanger,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {item.badge !== undefined && (
          <View style={styles.itemBadge}>
            <Text style={styles.itemBadgeText}>{String(item.badge)}</Text>
          </View>
        )}
        <ChevronIcon size={16} color={isDanger ? COLORS.error : '#cbd5e1'} />
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="dark-content" />
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View
            style={[
              styles.backdrop,
              { opacity: backdropAnim },
            ]}
          />
        </Pressable>

        <Animated.View
          style={[
            styles.drawer,
            isRTL ? styles.drawerRight : styles.drawerLeft,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.drawerHeader}
          >
            <TouchableOpacity
              style={[styles.closeBtn, isRTL ? styles.closeBtnRTL : styles.closeBtnLTR]}
              onPress={onClose}
            >
              <X size={20} color={COLORS.gold} />
            </TouchableOpacity>
            <View style={styles.userBlock}>
              <View style={styles.avatarRing}>
                <Text style={styles.avatarText}>
                  {isAuthenticated ? (isRTL ? 'مر' : 'ME') : 'U'}
                </Text>
              </View>
              <Text style={styles.userName} numberOfLines={1}>
                {isAuthenticated
                  ? (isRTL ? 'مرحباً بك' : 'Welcome')
                  : (isRTL ? 'زائر' : 'Guest')}
              </Text>
              <Text style={styles.userMeta} numberOfLines={1}>
                {isAuthenticated
                  ? (isRTL ? 'حساب موثَّق' : 'Signed in')
                  : (isRTL ? 'غير مسجَّل دخول' : 'Not signed in')}
              </Text>
              {isVerified && (
                <View style={styles.verifiedChip}>
                  <ShieldCheck size={12} color={COLORS.gold} strokeWidth={2.5} />
                  <Text style={styles.verifiedChipText}>
                    {isRTL ? 'موثَّق' : 'Verified'}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'حسابي' : 'Account'}
            </Text>
            {accountItems.map(renderItem)}

            <View style={styles.divider} />

            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'المساعدة والأمان' : 'Help & Safety'}
            </Text>
            {infoItems.map(renderItem)}

            <View style={styles.divider} />

            {isAuthenticated && renderItem({
              key: 'logout',
              labelAr: 'تسجيل الخروج',
              labelEn: 'Sign out',
              Icon: LogOut,
              onPress: handleLogout,
              variant: 'danger',
            })}

            <View style={styles.footer}>
              <Text style={styles.footerText}>Barmeh · v1.0</Text>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: COLORS.accent,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  drawerLeft: { left: 0 },
  drawerRight: { right: 0 },
  drawerHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 24,
    paddingHorizontal: 22,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    backgroundColor: 'rgba(255,255,255,0.12)',
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnLTR: { right: 16 },
  closeBtnRTL: { left: 16 },
  userBlock: { alignItems: 'center', marginTop: 8 },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(184, 134, 11, 0.18)',
    borderWidth: 2,
    borderColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.gold,
    fontFamily: 'Outfit_Bold',
  },
  userName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    fontFamily: 'Outfit_Bold',
  },
  userMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
    fontWeight: '600',
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(184, 134, 11, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.4)',
  },
  verifiedChipText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: COLORS.gold,
    letterSpacing: 0.3,
  },
  body: { flex: 1 },
  bodyContent: { paddingVertical: 16 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.darkGray,
    opacity: 0.55,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 22,
    marginTop: 8,
    marginBottom: 8,
  },
  item: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    gap: 14,
  },
  itemIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 78, 59, 0.07)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemIconWrapDanger: { backgroundColor: 'rgba(239, 68, 68, 0.08)' },
  itemLabel: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  itemLabelDanger: { color: COLORS.error },
  itemBadge: {
    backgroundColor: COLORS.error,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 12,
    marginHorizontal: 18,
  },
  footer: { alignItems: 'center', marginTop: 24 },
  footerText: { fontSize: 11, color: COLORS.darkGray, opacity: 0.4, fontWeight: '700' },
});
