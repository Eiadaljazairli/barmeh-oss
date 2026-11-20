import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { COLORS } from '../styles/colors';
import { ClipboardList, Users, Flame } from 'lucide-react-native';

interface QuickStatsSectionProps {
  totalListings?: number;
  totalUsers?: number;
  isRTL: boolean;
  loading?: boolean;
  onStatPress?: (statType: 'listings' | 'users' | 'availability') => void;
}

export const QuickStatsSection: React.FC<QuickStatsSectionProps> = ({
  totalListings = 0,
  totalUsers = 0,
  isRTL,
  loading = false,
  onStatPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={[styles.statsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => onStatPress?.('listings')}
          activeOpacity={0.7}
        >
          <View style={styles.statIconBg}>
            <ClipboardList size={22} color={COLORS.primary} />
          </View>
          <View style={[styles.statContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.statValue}>
                {totalListings > 999 ? `${(totalListings / 1000).toFixed(1)}K` : totalListings}
              </Text>
            )}
            <Text style={styles.statLabel}>فرص حصرية</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => onStatPress?.('users')}
          activeOpacity={0.7}
        >
          <View style={styles.statIconBg}>
            <Users size={22} color={COLORS.primary} />
          </View>
          <View style={[styles.statContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.statValue}>
                {totalUsers > 999 ? `${(totalUsers / 1000).toFixed(1)}K` : totalUsers}
              </Text>
            )}
            <Text style={styles.statLabel}>تاجر معتمد</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => onStatPress?.('availability')}
          activeOpacity={0.7}
        >
          <View style={styles.statIconBg}>
            <Flame size={22} color={COLORS.primary} />
          </View>
          <View style={[styles.statContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={styles.statValue}>24/7</Text>
            <Text style={styles.statLabel}>دعم فني 24/7</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.accent,
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 78, 59, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
});
