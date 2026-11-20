import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { paymentService } from '../../services/api';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type PromotionProduct = {
  id: string;
  type: 'TOP_PLACEMENT' | 'FEATURED' | 'URGENT';
  durationDays: number;
  priceSYP: number;
  label: string | null;
  discountPercent: number;
  priceEUR: number;
  effectivePrice: number;
};

export default function PromoteListingScreen() {
  const { listingId, listingTitle, listingImage } = useLocalSearchParams<{
    listingId: string;
    listingTitle: string;
    listingImage: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<PromotionProduct[]>([]);
  const [selectedType, setSelectedType] = useState<'TOP_PLACEMENT' | 'FEATURED' | 'URGENT'>('TOP_PLACEMENT');
  const [selectedDuration, setSelectedDuration] = useState<number>(7);
  const [paymentMethod, setPaymentMethod] = useState<string>('CARD');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getProducts();
      setProducts(data.products);

      const topProducts = data.products.filter((p: any) => p.type === 'TOP_PLACEMENT');
      if (topProducts.length > 0) {
        setSelectedDuration(topProducts[0].durationDays);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert(t('common.error'), t('promotion.error_loading'));
    } finally {
      setLoading(false);
    }
  };

  const currentProduct = products.find(
    (p) => p.type === selectedType && p.durationDays === selectedDuration
  );

  const handlePromote = async () => {
    if (!currentProduct) return;

    try {
      setSubmitting(true);
      await paymentService.checkout(listingId, currentProduct.id, paymentMethod);

      if (paymentMethod === 'FREE') {
        Alert.alert(t('common.success'), t('promotion.success'), [
          { text: t('common.ok'), onPress: () => router.back() }
        ]);
      } else {
        Alert.alert(
          t('promotion.pending_verification'),
          paymentMethod === 'CARD' ? 'سوف يتم تحويلك لبوابة الدفع قريباً' : 'يرجى التواصل مع الدعم لتأكيد التحويل',
          [{ text: t('common.ok'), onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || t('common.error');
      Alert.alert(t('common.error'), msg);
    } finally {
      setSubmitting(false);
    }
  };

  const renderProductType = (type: 'TOP_PLACEMENT' | 'FEATURED' | 'URGENT', icon: any, color: string) => {
    const isSelected = selectedType === type;
    const typeLabel = t(`promotion.${type.toLowerCase()}`);
    const typeDesc = t(`promotion.${type.toLowerCase()}_desc`);

    return (
      <TouchableOpacity
        style={[styles.typeCard, isSelected && { borderColor: color, backgroundColor: color + '08' }]}
        onPress={() => {
          setSelectedType(type);
          const available = products.filter(p => p.type === type);
          if (available.length > 0) setSelectedDuration(available[0].durationDays);
        }}
      >
        <View style={[styles.iconBox, { backgroundColor: color }]}>
          {icon}
        </View>
        <View style={styles.typeInfo}>
          <Text style={[styles.typeTitle, isSelected && { color: color }]}>{typeLabel}</Text>
          <Text style={styles.typeDesc}>{typeDesc}</Text>
        </View>
        <Ionicons
          name={isSelected ? "radio-button-on" : "radio-button-off"}
          size={24}
          color={isSelected ? color : "#ccc"}
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  const availableDurations = Array.from(new Set(products.filter(p => p.type === selectedType).map(p => p.durationDays))).sort((a, b) => a - b);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('promotion.boost_title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.listingSummary}>
          <Image source={{ uri: listingImage }} style={styles.summaryImage} />
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryTitle} numberOfLines={1}>{listingTitle}</Text>
            <Text style={styles.summaryId}>ID: {listingId.substring(0, 8)}</Text>
          </View>
        </Animated.View>

        <Text style={styles.sectionTitle}>{t('promotion.select_product')}</Text>

        <Animated.View entering={FadeInDown.delay(200)}>
          {renderProductType('TOP_PLACEMENT', <FontAwesome5 name="thumbtack" size={20} color="#fff" />, '#FF4D4D')}
          {renderProductType('FEATURED', <Ionicons name="star" size={24} color="#fff" />, '#FFD700')}
          {renderProductType('URGENT', <MaterialCommunityIcons name="lightning-bolt" size={24} color="#fff" />, '#FF8C00')}
        </Animated.View>

        <Text style={styles.sectionTitle}>{t('promotion.select_duration')}</Text>
        <View style={styles.durationRow}>
          {availableDurations.map((d, index) => (
            <TouchableOpacity
              key={d}
              style={[styles.durationChip, selectedDuration === d && styles.durationChipSelected]}
              onPress={() => setSelectedDuration(d)}
            >
              <Text style={[styles.durationText, selectedDuration === d && styles.durationTextSelected]}>
                {d === 1 ? t('promotion.day') : d === 7 ? t('promotion.days_7') : d === 30 ? t('promotion.days_30') : `${d} ${t('promotion.day')}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('promotion.select_payment')}</Text>
        <View style={styles.paymentBox}>
          {[
            { id: 'CARD', label: t('payment.card'), icon: 'card-outline' },
            { id: 'SYRIATEL_CASH', label: t('payment.syriatel_cash'), icon: 'wallet-outline' },
            { id: 'USDT', label: t('payment.usdt'), icon: 'logo-bitcoin' }
          ].map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.paymentMethod, paymentMethod === m.id && styles.paymentMethodSelected]}
              onPress={() => setPaymentMethod(m.id)}
            >
              <Ionicons name={m.icon as any} size={20} color={paymentMethod === m.id ? '#007AFF' : '#666'} />
              <Text style={[styles.paymentLabel, paymentMethod === m.id && styles.paymentLabelSelected]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <LinearGradient
          colors={['#1a1a1a', '#333']}
          style={styles.priceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View>
            <Text style={styles.priceLabel}>{t('payment.amount')}</Text>
            <Text style={styles.priceValue}>
              {currentProduct?.effectivePrice.toLocaleString()} {t('promotion.syp')}
            </Text>
            {currentProduct && (
               <Text style={styles.priceEur}>{t('promotion.approx_eur', { amount: currentProduct.priceEUR })}</Text>
            )}
          </View>
          {currentProduct && currentProduct.discountPercent > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{currentProduct.discountPercent}%</Text>
            </View>
          )}
        </LinearGradient>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.promoteButton, submitting && { opacity: 0.7 }]}
          onPress={handlePromote}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.promoteButtonText}>{t('promotion.checkout')}</Text>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter_700Bold',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  listingSummary: {
    flexDirection: 'row-reverse',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 25,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ddd',
  },
  summaryImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  summaryInfo: {
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryId: {
    fontSize: 12,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 15,
    marginTop: 5,
    textAlign: 'right',
    color: '#333',
  },
  typeCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeInfo: {
    flex: 1,
    marginRight: 15,
    alignItems: 'flex-end',
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  typeDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    textAlign: 'right',
  },
  durationRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginBottom: 25,
  },
  durationChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#fff',
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  durationChipSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  durationText: {
    fontSize: 14,
    color: '#666',
  },
  durationTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  paymentBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    marginBottom: 25,
  },
  paymentMethod: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
  },
  paymentMethodSelected: {
    backgroundColor: '#F0F7FF',
  },
  paymentLabel: {
    fontSize: 14,
    marginRight: 10,
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
  paymentLabelSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  priceCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    color: '#bbb',
    fontSize: 13,
    textAlign: 'right',
    marginBottom: 4,
  },
  priceValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  priceEur: {
    color: '#888',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 2,
  },
  discountBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discountText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  promoteButton: {
    backgroundColor: '#000',
    borderRadius: 16,
    height: 56,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});
