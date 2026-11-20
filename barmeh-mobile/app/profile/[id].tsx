import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { User, MessageCircle, Star, ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { listingService, authService, ListingSummary } from '../../services/api';
import { COLORS } from '../../styles/colors';
import { ListingCard } from '../../components/ListingCard';
import UserAvatar from '../../components/UserAvatar';
import { LinearGradient } from 'expo-linear-gradient';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();

  const [seller, setSeller] = useState<any>(null);
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!id || typeof id !== 'string' || !uuidRegex.test(id)) {
        if (id && id !== '[id]') console.warn('Invalid user ID format in profile page:', id);
        return;
      }

      try {
        setLoading(true);
        const userListings = await listingService.getListingsByUserId(id as string);
        setListings(userListings);

        try {
          const profile = await authService.getPublicProfile(id as string);
          setSeller(profile);
        } catch (profileError) {
          console.warn('Could not fetch user profile directly, falling back to listing user data');
          if (userListings.length > 0 && userListings[0].user) {
            setSeller(userListings[0].user);
          }
        }

        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching public profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProfile();
  }, [id]);

  const handleMessage = () => {
    if (!currentUser) {
      Alert.alert(
        t('common.welcome'),
        t('messages.login_required'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.login'), onPress: () => router.push('/(tabs)/profile') }
        ]
      );
      return;
    }
    if (seller?.id) {
      router.push(`/chat/${seller.id}` as any);
    }
  };

  const getTrustLevelBadge = () => {
    if (!seller?.trustLevel) return null;

    const levelConfig: Record<string, { label: string; bg: string; border: string; text: string }> = {
      VIP: { label: '👑 VIP', bg: '#fef3c7', border: '#fcd34d', text: COLORS.secondary },
      TRUSTED: { label: '⭐ موثوق', bg: '#dbeafe', border: '#93c5fd', text: COLORS.secondary },
      VERIFIED: { label: '✓ مُتحقق', bg: '#ecfdf5', border: '#86efac', text: COLORS.secondary },
      NEWBIE: { label: '🆕 جديد', bg: '#f3e8ff', border: '#d8b4fe', text: COLORS.secondary },
    };

    const config = levelConfig[seller.trustLevel];
    if (!config) return null;

    return (
      <View style={[styles.trustBadge, { backgroundColor: config.bg, borderColor: config.border }]}>
        <Text style={[styles.trustBadgeText, { color: config.text }]}>{config.label}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!seller) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: t('profile.title'),
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
                <ChevronLeft size={24} color={COLORS.primary} />
              </TouchableOpacity>
            ),
            headerStyle: { backgroundColor: COLORS.accent },
            headerTitleStyle: { fontWeight: '900', color: COLORS.secondary },
          }}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('home.empty')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: seller?.name || t('profile.title'),
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <ChevronLeft size={24} color={COLORS.primary} style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: COLORS.accent },
          headerTitleStyle: { fontWeight: '900', color: COLORS.secondary },
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={['rgba(6, 78, 59, 0.05)', 'rgba(6, 78, 59, 0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.header}
        >
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <UserAvatar
                name={seller?.name || seller?.firstName}
                photoUrl={seller?.avatarUrl}
                seed={seller?.id}
                size={100}
                ring
              />
              <View style={styles.onlineBadge} />
            </View>

            <View style={{ flex: 1, [isRTL ? 'marginRight' : 'marginLeft']: 16 }}>
              <Text style={styles.name}>{seller?.name || t('common.user_placeholder')}</Text>
              {getTrustLevelBadge()}
            </View>
          </View>

          <View style={[styles.statsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{listings.length}</Text>
              <Text style={styles.statLabel}>{t('profile.my_listings')}</Text>
            </View>
            <View style={[styles.divider, { height: 40 }]} />
            <View style={styles.statItem}>
              <View style={[styles.scoreContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={styles.statNumber}>{seller?.trustScore || 0}</Text>
                <Star size={18} color={COLORS.gold} fill={COLORS.gold} style={{ marginTop: 4 }} />
              </View>
              <Text style={styles.statLabel}>{t('details.trust_score')}</Text>
            </View>
          </View>

          {currentUser?.id !== seller?.id && (
            <TouchableOpacity
              style={[styles.messageBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={handleMessage}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.messageBtnGradient}
              >
                <MessageCircle size={20} color="#fff" />
                <Text style={styles.messageBtnText}>{t('details.chat')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </LinearGradient>

        <View style={styles.content}>
          <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('profile.my_listings')}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{listings.length}</Text>
            </View>
          </View>

          {listings.length > 0 ? (
            <View style={styles.grid}>
              {listings.map((item) => (
                <View key={item.id} style={styles.cardWrapper}>
                  <ListingCard item={item} onPress={(id) => router.push(`/listing/${id}` as any)} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('home.empty')}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.accent },
  scrollContent: { paddingBottom: 40 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: COLORS.darkGray, fontWeight: '600', fontSize: 16 },

  header: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: COLORS.primary,
    position: 'relative',
  },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#fff',
  },
  name: { fontSize: 22, fontWeight: '900', color: COLORS.secondary, marginBottom: 8 },
  trustBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  trustBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  statsRow: {
    gap: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(6, 78, 59, 0.05)',
    borderRadius: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    gap: 4,
  },
  statNumber: { fontSize: 20, fontWeight: '900', color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.darkGray, fontWeight: '600', marginTop: 4 },
  divider: {
    width: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },

  messageBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  messageBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  messageBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },

  content: { padding: 20 },
  sectionHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: COLORS.secondary },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: { color: COLORS.accent, fontWeight: '800', fontSize: 12 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  cardWrapper: { width: '48%', marginBottom: 8 },
  empty: { padding: 40, alignItems: 'center' },
});
