import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ChevronLeft, Star, ShieldCheck, MapPin, Calendar, MessageCircle, Ban, ShieldAlert } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { listingService, authService, usersService } from '../../services/api';
import { COLORS } from '../../styles/colors';
import { ListingCard } from '../../components/ListingCard';
import { LinearGradient } from 'expo-linear-gradient';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [user, setUser] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const userListings = await listingService.getListingsByUserId(id as string);
      setListings(userListings);

      if (userListings.length > 0) {
        setUser(userListings[0].user);
      }

      const me = await authService.getCurrentUser();
      setCurrentUser(me);
      if (me) {
        const blocks = await usersService.getBlockedUsers();
        setIsBlocked(blocks.some((b: any) => b.id === id));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleBlockToggle = async () => {
    if (!currentUser) return;
    if (isBlocked) {
      try {
        await usersService.unblockUser(id as string);
        setIsBlocked(false);
        Alert.alert(t('common.success'), t('profile.unblocked_success'));
      } catch (e) {
        Alert.alert(t('common.error'), t('profile.unblock_failed'));
      }
    } else {
      Alert.alert(
        t('profile.block_user_title'),
        t('profile.block_user_confirm', { name: user.name }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('profile.block'),
            style: 'destructive',
            onPress: async () => {
              try {
                await usersService.blockUser(id as string);
                setIsBlocked(true);
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
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('common.error')}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.header}
      >
        <TouchableOpacity
          style={[styles.backIcon, { [isRTL ? 'right' : 'left']: 20 }]}
          onPress={() => router.back()}
        >
          <ChevronLeft size={28} color="#fff" style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
        </TouchableOpacity>
        {currentUser && currentUser.id !== id && (
          <TouchableOpacity
            style={[styles.actionIcon, { [isRTL ? 'left' : 'right']: 20 }]}
            onPress={handleBlockToggle}
          >
            {isBlocked ? <ShieldAlert size={24} color="#fff" /> : <Ban size={24} color="#fff" />}
          </TouchableOpacity>
        )}

        <View style={styles.profileInfo}>
          <Image
            source={{ uri: user.avatar || 'https://ui-avatars.com/api/?name=' + user.name }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{user.name}</Text>
          <View style={styles.trustBadge}>
            <ShieldCheck size={16} color={COLORS.gold} />
            <Text style={styles.trustLevel}>{user.trustLevel ? t(`profile.trust_levels.${user.trustLevel.toLowerCase()}`) : t('profile.trust_levels.newbie')}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{listings.length}</Text>
              <Text style={styles.statLabel}>{t('profile.my_listings')}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.trustScore}/100</Text>
              <Text style={styles.statLabel}>{t('profile.trust_status')}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.sectionTitle}>{t('profile.my_listings')}</Text>
          <Text style={styles.listingCount}>{t('purchases.count', { count: listings.length })}</Text>
        </View>

        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <ListingCard item={item} onPress={(listingId) => router.push(`/listing/${listingId}`)} />
            </View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('profile.no_listings')}</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 20,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  actionIcon: {
    position: 'absolute',
    top: 50,
    zIndex: 10,
    padding: 8,
  },
  backIcon: {
    position: 'absolute',
    top: 50,
    zIndex: 10,
    padding: 8,
  },
  profileInfo: {
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
    marginBottom: 20,
  },
  trustLevel: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 15,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  listingCount: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 15,
    paddingBottom: 40,
  },
  cardContainer: {
    marginBottom: 15,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
  },
});
