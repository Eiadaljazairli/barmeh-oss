import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ArrowRight,
  User,
  Shield,
  LogOut,
  Trash2,
  Heart,
  Tag,
  Headset,
  ShoppingBag,
  ShieldCheck,
  Globe,
  Crown,
  Camera,
  Search,
  ShieldOff,
  CalendarCheck,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import * as SecureStore from '../../utils/storage';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { authService, usersService, UserMe } from '../../services/api';
import { COLORS } from '../../styles/colors';
import { ensureAbsoluteUrl } from '../../utils/url';
import PasswordlessAuthScreen from '../../components/auth/PasswordlessAuthScreen';

interface CurrentUser {
  id: string;
  trustScore: number;
  isAdmin: boolean;
}

function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { logout: contextLogout } = useAuth();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [me, setMe] = useState<UserMe | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadMe = useCallback(async () => {
    try {
      const data = await usersService.getMe();
      setMe(data);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getLastKnownPositionAsync({});
      if (!location) {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }
      if (location) {
        await usersService
          .updateLocation(location.coords.latitude, location.coords.longitude)
          .catch(() => {});
      }
    } catch {
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const u = await authService.getCurrentUser();
        if (u) {
          setUser(u);
          loadMe();
        }
      })();
    }, [loadMe]),
  );

  const handleAvatarUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), t('post.alerts.photo_permission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (result.canceled || !result.assets[0]) return;

    setIsLoading(true);
    try {
      const res = await usersService.uploadAvatar(result.assets[0].uri);
      if (res && res.url && me) {
        await usersService.updateProfile(me.id, { avatarUrl: res.url });
        setMe((prev) => (prev ? { ...prev, avatarUrl: res.url } : prev));
      }
      Alert.alert(t('common.success'), t('profile.avatar_success'));
      loadMe();
    } catch {
      Alert.alert(t('common.error'), t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = async () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    await SecureStore.setItemAsync('user-language', newLang);
    await i18n.changeLanguage(newLang);
  };

  const handleLogout = async () => {
    await contextLogout();
    setUser(null);
    setMe(null);
  };

  const handleDeleteAccount = () => {
    Alert.alert(t('profile.delete_account'), t('profile.delete_hint'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          try {
            await usersService.deleteAccount();
            handleLogout();
            Alert.alert(t('common.success'), t('profile.delete_account_success'));
          } catch {
            Alert.alert(t('common.error'), t('common.error'));
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <PasswordlessAuthScreen
        onSuccess={() => {
          (async () => {
            const u = await authService.getCurrentUser();
            if (u) {
              setUser(u);
              loadMe();
            }
          })().catch(() => {});
        }}
      />
    );
  }

  return (
    <ScrollView
      style={s.base}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400).springify()}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={s.profileHeader}
        >
          <TouchableOpacity
            style={s.avatarContainer}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleAvatarUpload();
            }}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {me?.avatarUrl ? (
              <Image
                source={{
                  uri: me.avatarUrl
                    ? `${ensureAbsoluteUrl(me.avatarUrl)}?t=${new Date().getTime()}`
                    : undefined,
                }}
                style={{ width: 80, height: 80, borderRadius: 40 }}
                contentFit="cover"
                transition={200}
                cachePolicy="none"
              />
            ) : (
              <User size={40} color={COLORS.primary} />
            )}
            <View style={s.cameraIconBadge}>
              <Camera size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <View
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Text style={s.welcomeText}>
              {t('profile.welcome_back', {
                name: me?.firstName || me?.name || me?.username || '',
              })}
            </Text>
            {me?.userType === 'MERCHANT' && (
              <Crown size={18} color={COLORS.gold} fill={COLORS.gold} />
            )}
          </View>

          {me && (
            <Animated.View
              entering={FadeInDown.delay(100).duration(400).springify()}
              style={[
                s.statsRow,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
            >
              <View style={s.statBox}>
                <Text style={s.statLabel}>{t('profile.last_activity')}</Text>
                <Text style={s.statValue}>
                  {new Date().toLocaleDateString(
                    i18n.language === 'ar' ? 'ar-SY' : 'en-US',
                  )}
                </Text>
              </View>
              <View style={s.statBox}>
                <Text style={s.statLabel}>{t('profile.ratings')}</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Text style={s.statValue}>
                    {me.trustScore > 0
                      ? (me.trustScore / 20).toFixed(1)
                      : '5.0'}
                  </Text>
                  <Heart size={14} color={COLORS.gold} fill={COLORS.gold} />
                </View>
              </View>
              <View style={s.statBox}>
                <Text style={s.statLabelWhite}>
                  {t('profile.trust_status')}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 4,
                    maxWidth: '100%',
                  }}
                >
                  <Text
                    style={[
                      s.statValueGold,
                      {
                        color: '#FACC15',
                        flexShrink: 1,
                        textAlign: 'center',
                      },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {t(
                      `profile.trust_levels.${
                        me.trustScore >= 80
                          ? 'trusted'
                          : me.trustScore >= 40
                            ? 'verified'
                            : 'newbie'
                      }`,
                    )}
                  </Text>
                  <ShieldCheck size={14} color={COLORS.gold} />
                </View>
              </View>
            </Animated.View>
          )}
        </LinearGradient>
      </Animated.View>

      <View style={s.accountSection}>
        <Animated.Text
          entering={FadeInDown.delay(200).duration(400)}
          style={[s.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}
        >
          {t('profile.account_management')}
        </Animated.Text>
        <View style={s.menuContainer}>
          {[
            {
              icon: User,
              label: t('profile.edit_profile'),
              action: () => router.push('/profile/edit'),
            },
            {
              icon: Globe,
              label: t('profile.language'),
              action: toggleLanguage,
              extra: i18n.language === 'ar' ? 'English' : 'العربية',
            },
            {
              icon: Tag,
              label: t('profile.my_listings'),
              action: () => router.push('/profile/listings'),
            },
            {
              icon: Heart,
              label: t('profile.favorites'),
              action: () => router.push('/profile/favorites'),
            },
            {
              icon: Search,
              label: t('profile.saved_searches'),
              action: () => router.push('/profile/saved-searches'),
            },
            {
              icon: ShoppingBag,
              label: t('profile.purchases'),
              action: () => router.push('/purchases'),
              hide: user.isAdmin,
            },
            {
              icon: CalendarCheck,
              label: t('profile.bookings', 'محجوزاتي'),
              action: () => router.push('/bookings' as any),
              hide: user.isAdmin,
            },
            {
              icon: Headset,
              label: t('profile.support'),
              action: () => router.push('/support'),
              hide: user.isAdmin,
            },
            {
              icon: Shield,
              label: t('profile.privacy'),
              action: () => router.push('/privacy'),
            },
            {
              icon: ShieldOff,
              label: t('profile.blocked_users'),
              action: () => router.push('/profile/blocked' as any),
            },
            {
              icon: LogOut,
              label: t('profile.logout'),
              action: handleLogout,
              color: '#64748b',
            },
          ].map(
            (item, idx) =>
              !item.hide && (
                <Animated.View
                  key={idx}
                  entering={FadeInDown.delay(250 + idx * 50)
                    .duration(400)
                    .springify()}
                >
                  <TouchableOpacity
                    style={[
                      s.menuItem,
                      { flexDirection: isRTL ? 'row-reverse' : 'row' },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      item.action();
                    }}
                  >
                    <View style={s.menuIconContainer}>
                      <item.icon size={20} color={item.color || COLORS.primary} />
                    </View>
                    <Text
                      style={[
                        s.menuText,
                        { textAlign: isRTL ? 'right' : 'left' },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.extra ? (
                      <Text style={s.extraText}>{item.extra}</Text>
                    ) : (
                      <ArrowRight
                        size={18}
                        color={COLORS.darkGray}
                        style={{
                          transform: [{ rotate: isRTL ? '180deg' : '0deg' }],
                        }}
                      />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ),
          )}
        </View>

        {user.isAdmin && (
          <Animated.View entering={FadeInDown.delay(600).duration(400)}>
            <TouchableOpacity
              style={s.adminPanel}
              onPress={() => {
                Haptics.selectionAsync();
                router.push('/admin/dashboard');
              }}
            >
              <LinearGradient
                colors={['rgba(6, 78, 59, 0.05)', 'rgba(6, 78, 59, 0.02)']}
                style={s.adminGradient}
              >
                <ShieldCheck color={COLORS.primary} size={32} />
                <Text style={s.adminTitle}>{t('profile.admin_dashboard')}</Text>
                <Text style={s.adminSub}>{t('auth.benefit_safety')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {me?.userType === 'MERCHANT' && (
          <Animated.View entering={FadeInDown.delay(700).duration(400)}>
            <TouchableOpacity
              style={s.merchantPanel}
              onPress={() => {
                Haptics.selectionAsync();
                router.push('/merchant/dashboard' as any);
              }}
            >
              <LinearGradient
                colors={['rgba(196, 160, 82, 0.08)', 'rgba(196, 160, 82, 0.04)']}
                style={s.merchantGradient}
              >
                <ShoppingBag color={COLORS.gold} size={32} />
                <Text style={s.merchantTitle}>
                  {t('profile.merchant_dashboard')}
                </Text>
                <Text style={s.merchantSub}>{t('profile.merchant_sub')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInDown.delay(750).duration(400)}
          style={s.dangerZone}
        >
          <Text
            style={[s.dangerTitle, { textAlign: isRTL ? 'right' : 'left' }]}
          >
            {t('profile.danger_zone')}
          </Text>
          <TouchableOpacity
            style={[
              s.deleteBtn,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
            onPress={() => {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning,
              );
              handleDeleteAccount();
            }}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color="#ef4444" />
            ) : (
              <>
                <Trash2 size={18} color="#ef4444" />
                <Text style={s.deleteText}>{t('profile.delete_account')}</Text>
              </>
            )}
          </TouchableOpacity>
          <Text
            style={[s.dangerHint, { textAlign: isRTL ? 'right' : 'left' }]}
          >
            {t('profile.delete_hint')}
          </Text>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  base: { flex: 1, backgroundColor: COLORS.accent },
  profileHeader: {
    padding: 40,
    paddingTop: 80,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
  },
  statsRow: { marginTop: 25, width: '100%', gap: 10 },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 15,
    borderRadius: 20,
  },
  statValue: {
    color: COLORS.gold,
    fontWeight: '900',
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statValueGold: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.gold,
    marginTop: 5,
  },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '700' },
  statLabelWhite: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.95,
  },
  accountSection: { padding: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.secondary,
    marginBottom: 20,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  menuItem: {
    padding: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(6,78,59,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  extraText: { fontSize: 13, color: COLORS.primary, fontWeight: '800' },
  adminPanel: { marginTop: 25, borderRadius: 25, overflow: 'hidden' },
  adminGradient: { padding: 25, alignItems: 'center' },
  adminTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 10,
    textAlign: 'center',
    width: '100%',
  },
  adminSub: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  merchantPanel: { marginTop: 25, borderRadius: 25, overflow: 'hidden' },
  merchantGradient: { padding: 25, alignItems: 'center' },
  merchantTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.gold,
    marginTop: 10,
    textAlign: 'center',
    width: '100%',
  },
  merchantSub: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  dangerZone: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#fef2f2',
    borderRadius: 25,
  },
  dangerTitle: {
    color: '#ef4444',
    fontWeight: '900',
    marginBottom: 15,
    width: '100%',
  },
  deleteBtn: {
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
  },
  deleteText: {
    color: '#ef4444',
    fontWeight: '800',
    fontSize: 14,
    marginLeft: 10,
  },
  dangerHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 10,
    lineHeight: 18,
    width: '100%',
  },
  upgradeBanner: {
    marginVertical: 10,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  upgradeGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  upgradeSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});

export default ProfileScreen;
