import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  Store,
  MapPin,
  Clock,
  Save,
  Camera,
  FileText
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../styles/colors';
import { usersService, merchantService, UserMe } from '../../services/api';

export default function MerchantSettings() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [businessHours, setBusinessHours] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const me = await usersService.getMe();
      if (me.merchantProfile) {
        setStoreName(me.merchantProfile.storeName || '');
        setStoreAddress(me.merchantProfile.storeAddress || '');
        setTaxId(me.merchantProfile.taxId || '');
        const bh = me.merchantProfile.businessHours;
        if (bh && typeof bh === 'object' && typeof (bh as any).text === 'string') {
          setBusinessHours((bh as any).text);
        } else if (typeof bh === 'string') {
          setBusinessHours(bh);
        } else {
          setBusinessHours('');
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!storeName.trim()) {
      Alert.alert(t('common.error'), t('merchant.store_name_required') || 'اسم المتجر مطلوب');
      return;
    }

    setSaving(true);
    try {
      const trimmedHours = businessHours.trim();
      await merchantService.updateProfile({
        storeName: storeName.trim(),
        storeAddress: storeAddress.trim(),
        taxId: taxId.trim(),
        businessHours: trimmedHours ? { text: trimmedHours } : {},
      });
      Alert.alert(t('common.success'), t('common.success'));
      router.back();
    } catch (error: any) {
      const msg = error?.response?.data?.message;
      const detail = Array.isArray(msg) ? msg.join('\n') : (msg || t('common.error'));
      Alert.alert(t('common.error'), detail);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={COLORS.secondary} style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('merchant.store_settings') || 'إعدادات المتجر'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={styles.logoContainer}>
            <Store size={40} color={COLORS.primary} />
            <TouchableOpacity style={styles.cameraBtn}>
              <Camera size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>{t('merchant.change_logo') || 'تغيير شعار المتجر'}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('merchant.store_name') || 'اسم المتجر'}</Text>
            <View style={[styles.inputWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Store size={20} color={COLORS.gold} />
              <TextInput
                style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                value={storeName}
                onChangeText={setStoreName}
                placeholder={t('merchant.store_name_placeholder') || 'أدخل اسم المتجر'}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('merchant.store_address') || 'عنوان المتجر'}</Text>
            <View style={[styles.inputWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <MapPin size={20} color={COLORS.gold} />
              <TextInput
                style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                value={storeAddress}
                onChangeText={setStoreAddress}
                placeholder={t('merchant.store_address_placeholder') || 'عنوان المتجر التفصيلي'}
                multiline
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('merchant.tax_id') || 'السجل التجاري (اختياري)'}</Text>
            <View style={[styles.inputWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <FileText size={20} color={COLORS.gold} />
              <TextInput
                style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                value={taxId}
                onChangeText={setTaxId}
                placeholder="رقم السجل التجاري"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('merchant.business_hours') || 'ساعات العمل'}</Text>
            <View style={[styles.inputWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Clock size={20} color={COLORS.gold} />
              <TextInput
                style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                value={businessHours}
                onChangeText={setBusinessHours}
                placeholder="مثال: 9:00 ص - 10:00 م"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={saving}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveGradient}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Save size={20} color="#fff" />
                  <Text style={styles.saveText}>{t('common.save')}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(6, 78, 59, 0.05)',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarHint: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  inputWrapper: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 78, 59, 0.05)',
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  saveBtn: {
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  saveText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
});
