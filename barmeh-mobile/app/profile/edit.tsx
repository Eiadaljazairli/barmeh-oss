import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  User,
  Mail,
  ArrowRight,
  Save,
  MapPin,
  ChevronDown,
  Camera,
  Store,
  UserCheck,
  AtSign,
} from 'lucide-react-native';
import { authService, usersService, City } from '../../services/api';
import { COLORS } from '../../styles/colors';
import { isValidRealName, formatErrorMessage } from '../../utils/validation';
import CitySelectorModal from '../../components/CitySelectorModal';
import { ensureAbsoluteUrl } from '../../utils/url';

export default function EditProfile() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    age: '',
    gender: '' as 'MALE' | 'FEMALE' | 'OTHER' | '',
    governorate: '' as City | '',
    avatarUrl: '',
    userType: 'CONSUMER' as 'CONSUMER' | 'MERCHANT',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = await usersService.getMe();
      setIsAdmin(user.isAdmin);
      setFormData({
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        age: user.age?.toString() || '',
        gender: user.gender || '',
        governorate: user.governorate || '',
        avatarUrl: user.avatarUrl || '',
        userType: (user.userType as 'CONSUMER' | 'MERCHANT') || 'CONSUMER',
      });
    } catch (error) {
      Alert.alert(t('common.error'), t('profile.error_loading'));
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      handleAvatarUpload(result.assets[0].uri);
    }
  };

  const handleAvatarUpload = async (uri: string) => {
    setSaving(true);
    try {
      const { url } = await usersService.uploadAvatar(uri);
      setFormData(prev => ({ ...prev, avatarUrl: url }));
    } catch (error: any) {
      Alert.alert(t('common.error'), t('profile.upload_error') || 'فشل رفع الصورة');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    const fName = formData.firstName.trim();
    const lName = formData.lastName.trim();

    if (!isValidRealName(fName) || !isValidRealName(lName)) {
      Alert.alert(t('common.error'), t('auth.real_name_error'));
      return;
    }

    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        Alert.alert(t('common.error'), t('auth.invalid_email'));
        return;
      }
    }

    if (formData.age) {
      const ageVal = parseInt(formData.age);
      if (isNaN(ageVal) || ageVal < 18 || ageVal > 95) {
        Alert.alert(t('common.error'), t('auth.age_error'));
        return;
      }
    }

    setSaving(true);
    try {
      const payload: any = {
        username: formData.username.trim() || undefined,
        firstName: fName,
        lastName: lName,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender || undefined,
        governorate: formData.governorate || undefined,
        avatarUrl: formData.avatarUrl || undefined,
        userType: formData.userType,
      };
      if (formData.email) payload.email = formData.email;

      await usersService.updateProfile('', payload);
      Alert.alert(t('common.success'), t('common.success'));
      router.back();
    } catch (error: any) {
      const msg = formatErrorMessage(error);
      Alert.alert(t('common.error'), msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowRight size={24} color={COLORS.primary} style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.edit_profile')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
            {formData.avatarUrl ? (
              <Image source={{ uri: ensureAbsoluteUrl(formData.avatarUrl) ? `${ensureAbsoluteUrl(formData.avatarUrl)}?t=${new Date().getTime()}` : undefined }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={40} color={COLORS.primary} />
              </View>
            )}
            <View style={styles.cameraIconContainer}>
              <Camera size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>{t('profile.tap_to_change_avatar') || 'اضغط لتغيير الصورة الشخصية'}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('profile.account_type') || 'نوع الحساب'}
          </Text>
          <View style={[styles.segmentRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                formData.userType === 'CONSUMER' && styles.segmentBtnActive,
              ]}
              onPress={() => setFormData({ ...formData, userType: 'CONSUMER' })}
              activeOpacity={0.8}
            >
              <UserCheck
                size={18}
                color={formData.userType === 'CONSUMER' ? '#fff' : COLORS.primary}
              />
              <Text
                style={[
                  styles.segmentText,
                  formData.userType === 'CONSUMER' && styles.segmentTextActive,
                ]}
              >
                {t('profile.account_individual') || 'فرد'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                formData.userType === 'MERCHANT' && styles.segmentBtnActive,
              ]}
              onPress={() => setFormData({ ...formData, userType: 'MERCHANT' })}
              activeOpacity={0.8}
            >
              <Store
                size={18}
                color={formData.userType === 'MERCHANT' ? '#fff' : COLORS.primary}
              />
              <Text
                style={[
                  styles.segmentText,
                  formData.userType === 'MERCHANT' && styles.segmentTextActive,
                ]}
              >
                {t('profile.account_merchant') || 'تاجر'}
              </Text>
            </TouchableOpacity>
          </View>
          {formData.userType === 'MERCHANT' && (
            <Text style={[styles.hint, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('profile.merchant_hint') ||
                'ستظهر إعلاناتك بشارة "تاجر". يمكنك إعداد اسم المتجر من شاشة "إعدادات التاجر".'}
            </Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>اسم المستخدم</Text>
          <View style={[styles.inputWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <AtSign size={20} color={COLORS.primary} />
            <TextInput
              style={[styles.input, { textAlign: 'left', writingDirection: 'ltr' }]}
              value={formData.username}
              onChangeText={(text) => setFormData({ ...formData, username: text.replace(/\s/g, '').toLowerCase() })}
              placeholder="user_xxxxxxx"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
              textContentType="none"
              keyboardType="visible-password"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('profile.first_name')}</Text>
          <View style={[styles.inputWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <User size={20} color={COLORS.primary} />
            <TextInput
              style={[styles.input, { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}
              value={formData.firstName}
              onChangeText={(text) => setFormData({ ...formData, firstName: text })}
              placeholder={t('profile.first_name')}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('profile.last_name')}</Text>
          <View style={[styles.inputWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <User size={20} color={COLORS.primary} />
            <TextInput
              style={[styles.input, { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}
              value={formData.lastName}
              onChangeText={(text) => setFormData({ ...formData, lastName: text })}
              placeholder={t('profile.last_name')}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.email_label')}</Text>
          <View style={[styles.inputWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Mail size={20} color={COLORS.primary} />
            <TextInput
              style={[styles.input, { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder={t('auth.email_placeholder')}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.location')}</Text>
          <TouchableOpacity
            style={[styles.inputWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            onPress={() => setShowCityModal(true)}
          >
            <MapPin size={20} color={COLORS.primary} />
            <Text style={[styles.input, { textAlign: isRTL ? 'right' : 'left', lineHeight: 44 }]}>
              {formData.governorate ? t(`cities.${formData.governorate.toLowerCase()}`) : t('common.select_city')}
            </Text>
            <ChevronDown size={20} color={COLORS.darkGray} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.age_label')}</Text>
          <View style={[styles.inputWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TextInput
              style={[styles.input, { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}
              value={formData.age}
              onChangeText={(text) => setFormData({ ...formData, age: text })}
              placeholder={t('auth.age_placeholder')}
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
              <Text style={styles.saveBtnText}>{t('common.save')}</Text>
              <Save size={20} color="#fff" style={{ [isRTL ? 'marginRight' : 'marginLeft']: 10 }} />
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      <CitySelectorModal
        visible={showCityModal}
        selectedCity={formData.governorate || 'ALL'}
        onClose={() => setShowCityModal(false)}
        onSelect={(city) => setFormData({ ...formData, governorate: city === 'ALL' ? '' : city })}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.accent,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(6, 78, 59, 0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputWrapper: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(6, 78, 59, 0.08)',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLORS.secondary,
    fontWeight: '600',
    paddingHorizontal: 12,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
  },
  hint: {
    fontSize: 11,
    color: COLORS.darkGray,
    marginTop: 6,
    fontWeight: '500',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(6, 78, 59, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarHint: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.darkGray,
    fontWeight: '700',
  },
  segmentRow: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(6, 78, 59, 0.08)',
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.primary,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  segmentTextActive: {
    color: '#fff',
  },
});
