import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Store, MapPin, Tag, Clock, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../styles/colors';
import { merchantService } from '../../services/api';

export default function MerchantUpgradeScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();

  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!storeName.trim()) {
      Alert.alert(t('common.error'), t('merchant.store_name_error') || 'Please enter store name');
      return;
    }

    setLoading(true);
    try {
      await merchantService.upgrade({
        storeName: storeName.trim(),
        storeAddress: storeAddress.trim(),
        taxId: taxId.trim(),
      });
      
      Alert.alert(
        t('common.success'),
        t('merchant.upgrade_success') || 'Your account has been upgraded to Merchant!',
        [{ text: t('common.ok'), onPress: () => router.replace('/(tabs)/profile') }]
      );
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={COLORS.secondary} style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.upgrade_business') || 'Upgrade to Business'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
           <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.heroGradient}>
              <Store size={60} color={COLORS.gold} />
              <Text style={styles.heroTitle}>{t('merchant.hero_title') || 'انضم لنخبة التجار في برمة'}</Text>
              <Text style={styles.heroSub}>{t('merchant.hero_sub') || 'زد مبيعاتك مع أدوات إدارة احترافية وثقة أعلى من المشترين'}</Text>
           </LinearGradient>
        </View>

        <View style={styles.benefitsRow}>
           <View style={styles.benefitItem}>
              <CheckCircle size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>{t('merchant.benefit1') || 'متجر متكامل'}</Text>
           </View>
           <View style={styles.benefitItem}>
              <CheckCircle size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>{t('merchant.benefit2') || 'شارة توثيق'}</Text>
           </View>
           <View style={styles.benefitItem}>
              <CheckCircle size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>{t('merchant.benefit3') || 'حدود أعلى'}</Text>
           </View>
        </View>

        <View style={styles.form}>
          <Text style={[styles.sectionLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{t('merchant.store_details') || 'تفاصيل المتجر'}</Text>
          
          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
               <Store size={20} color={COLORS.darkGray} />
               <TextInput
                 style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                 placeholder={t('merchant.store_name_placeholder') || 'اسم المتجر/الشركة'}
                 value={storeName}
                 onChangeText={setStoreName}
               />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
               <MapPin size={20} color={COLORS.darkGray} />
               <TextInput
                 style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                 placeholder={t('merchant.store_address_placeholder') || 'العنوان التفصيلي (اختياري)'}
                 value={storeAddress}
                 onChangeText={setStoreAddress}
               />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
               <Tag size={20} color={COLORS.darkGray} />
               <TextInput
                 style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                 placeholder={t('merchant.tax_id_placeholder') || 'رقم السجل التجاري (اختياري)'}
                 value={taxId}
                 onChangeText={setTaxId}
                 keyboardType="numeric"
               />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
            onPress={handleUpgrade}
            disabled={loading}
          >
            <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.submitGradient}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{t('merchant.upgrade_confirm') || 'تأكيد الترقية'}</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
             {t('merchant.upgrade_disclaimer') || 'بالترقية لحساب تجاري، أنت توافق على شروط وأحكام التجار في منصة برمة.'}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.accent },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 8, backgroundColor: '#f8fafc', borderRadius: 12 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.secondary },
  scrollContent: { paddingBottom: 40 },
  heroSection: { padding: 20 },
  heroGradient: { padding: 30, borderRadius: 32, alignItems: 'center' },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 15, textAlign: 'center' },
  heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 22, fontWeight: '600' },
  benefitsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 30 },
  benefitItem: { alignItems: 'center', gap: 8 },
  benefitText: { fontSize: 12, fontWeight: '800', color: COLORS.secondary },
  form: { paddingHorizontal: 24 },
  sectionLabel: { fontSize: 16, fontWeight: '900', color: COLORS.secondary, marginBottom: 15 },
  inputGroup: { marginBottom: 15 },
  inputWrapper: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 55,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  input: { flex: 1, height: '100%', fontSize: 15, color: COLORS.secondary, fontWeight: '600', paddingHorizontal: 12 },
  submitBtn: { height: 60, borderRadius: 20, overflow: 'hidden', marginTop: 20 },
  submitGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  disclaimer: { textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 20, lineHeight: 18, fontWeight: '500' },
});
