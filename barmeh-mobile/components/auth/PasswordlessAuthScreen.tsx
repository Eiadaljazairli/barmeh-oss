import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { signInWithGoogle } from '../../utils/googleAuth';
import { COLORS } from '../../styles/colors';

type Step = 'welcome' | 'signup_minimal';

export interface PasswordlessAuthScreenProps {
  onSuccess: () => void;
}

const COLOR_GOOGLE_BORDER = '#E5E7EB';
const COLOR_GRAY_TEXT = '#6B7280';
const COLOR_INPUT_BG = '#FFFFFF';
const COLOR_INPUT_BORDER = '#D1D5DB';
const COLOR_ORANGE = '#F97316';
const COLOR_BLUE_CTA = '#2563EB';
const COLOR_GOLD = '#C4A052';

export default function PasswordlessAuthScreen({ onSuccess }: PasswordlessAuthScreenProps) {
  const { t } = useTranslation();
  const { setIsAuthenticated } = useAuth();

  const [step, setStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [pendingGoogleEmail, setPendingGoogleEmail] = useState<string | null>(null);

  const submitSignup = async () => {
    if (fullName.trim().length < 2) {
      setError('يرجى إدخال الاسم الكامل.');
      return;
    }
    if (!pendingGoogleEmail) {
      setError('انتهت جلسة Google. حاول مجدداً.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const parts = fullName.trim().split(/\s+/);
      const firstName = parts.shift() || fullName.trim();
      const lastName = parts.join(' ');

      await api.post('/users/me', {
        firstName,
        ...(lastName ? { lastName } : {}),
        userType: 'CONSUMER',
      });
      if (avatarUri) await uploadAvatarBestEffort(avatarUri);
      setIsAuthenticated(true);
      onSuccess();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'تعذّر إنشاء الحساب.');
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatarBestEffort = async (uri: string) => {
    try {
      const { usersService } = require('../../services/api');
      await usersService.uploadAvatar(uri);
    } catch {
    }
  };

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      setAvatarUri(res.assets[0].uri);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result) {
        return;
      }
      const { data } = await api.post('/auth/google-login', {
        idToken: result.idToken,
      });
      const accessToken = data?.accessToken;
      const refreshToken = data?.refreshToken;
      const user = data?.user;
      if (!accessToken) throw new Error('Google login: no accessToken returned');

      const SecureStore = require('../../utils/storage');
      await SecureStore.setItemAsync('userToken', accessToken);
      if (refreshToken) await SecureStore.setItemAsync('userRefreshToken', refreshToken);
      if (user) await SecureStore.setItemAsync('userInfo', JSON.stringify(user));

      const needsCompletion = !user?.firstName || data?.isNewUser === true;
      if (needsCompletion) {
        setPendingGoogleEmail(result.email);
        if (result.name) setFullName(result.name);
        if (result.photo) setAvatarUri(result.photo);
        setStep('signup_minimal');
      } else {
        setIsAuthenticated(true);
        onSuccess();
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'تعذّر تسجيل الدخول عبر Google.';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0E251F', '#16382E']} style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoWrap}>
            <View style={styles.logoRing}>
              <Image
                source={require('../../assets/images/barmeh-logo.png')}
                style={styles.logo}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.brandName}>برمة</Text>
            <View style={styles.brandDivider} />
            <Text style={styles.brandTagline}>السوق المحلي السوري</Text>
          </View>

          {step === 'welcome' && (
            <WelcomeCard
              onGoogle={handleGoogle}
              loading={loading}
              error={error}
            />
          )}

          {step === 'signup_minimal' && (
            <SignupMinimalCard
              avatarUri={avatarUri}
              onPickAvatar={pickAvatar}
              fullName={fullName}
              setFullName={setFullName}
              onSubmit={submitSignup}
              loading={loading}
              error={error}
              onBack={() => {
                setError(null);
                setStep('welcome');
              }}
            />
          )}

          <Text style={styles.footer}>
            بمجرد تسجيلك للدخول، فإنك تؤكد اطلاعك وموافقتك الكاملة على شروط الاستخدام وسياسة الخصوصية.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function WelcomeCard(props: {
  onGoogle: () => void;
  loading: boolean;
  error: string | null;
}) {
  const { onGoogle, loading, error } = props;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>تسجيل الدخول او إنشاء حساب</Text>
      <Text style={styles.subtitle}>عن طريق حساب Google</Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        style={[styles.googleBtn, loading && styles.disabled]}
        onPress={onGoogle}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <>
            <GoogleG />
            <Text style={styles.googleBtnText}>التسجيل عن طريق Google</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

function SignupMinimalCard(props: {
  avatarUri: string | null;
  onPickAvatar: () => void;
  fullName: string;
  setFullName: (s: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
  onBack: () => void;
}) {
  const {
    avatarUri,
    onPickAvatar,
    fullName,
    setFullName,
    onSubmit,
    loading,
    error,
    onBack,
  } = props;

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={onBack}
        disabled={loading}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="arrow-forward" size={22} color="#374151" />
      </TouchableOpacity>
      <Text style={styles.title}>إنشاء حساب جديد</Text>

      <Text style={styles.sectionLabel}>إضافة صورة شخصية</Text>
      <TouchableOpacity style={styles.avatarWrap} onPress={onPickAvatar}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={48} color="#9CA3AF" />
          </View>
        )}
        <View style={styles.avatarCameraBadge}>
          <Ionicons name="camera" size={16} color="#FFF" />
        </View>
      </TouchableOpacity>

      <Text style={styles.label}>الاسم الكامل</Text>
      <TextInput
        style={styles.textInput}
        placeholder="الاسم الكامل"
        placeholderTextColor="#9CA3AF"
        value={fullName}
        onChangeText={setFullName}
        textAlign="right"
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        style={[styles.blueCta, loading && styles.disabled]}
        onPress={onSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.blueCtaText}>إنشاء حساب</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function GoogleG() {
  return (
    <View style={styles.googleG}>
      <Text style={styles.googleGText}>G</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 56,
    paddingBottom: 60,
    justifyContent: 'center',
  },
  logoWrap: { alignItems: 'center', marginBottom: 26 },
  logoRing: {
    width: 92,
    height: 92,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(196, 160, 82, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: { width: '100%', height: '100%' },
  brandName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#F5F1E8',
    letterSpacing: 0.5,
  },
  brandDivider: {
    width: 44,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLOR_GOLD,
    marginTop: 10,
    marginBottom: 10,
  },
  brandTagline: {
    fontSize: 13,
    color: COLOR_GOLD,
    letterSpacing: 0.4,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },

  backBtn: {
    alignSelf: 'flex-end',
    marginBottom: 4,
    padding: 2,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: COLOR_GRAY_TEXT,
    textAlign: 'center',
    marginBottom: 20,
  },

  label: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 8,
    textAlign: 'right',
  },
  sectionLabel: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 10,
    marginTop: 4,
    textAlign: 'right',
  },

  textInput: {
    borderWidth: 1,
    borderColor: COLOR_INPUT_BORDER,
    borderRadius: 10,
    backgroundColor: COLOR_INPUT_BG,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    marginBottom: 12,
  },

  blueCta: {
    backgroundColor: COLOR_BLUE_CTA,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  blueCtaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  disabled: { opacity: 0.6 },

  googleBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLOR_GOOGLE_BORDER,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 8,
  },
  googleBtnText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 15,
    marginRight: 8,
  },
  googleG: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleGText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4285F4',
  },

  errorText: {
    color: COLORS.error,
    fontSize: 13,
    textAlign: 'right',
    marginBottom: 8,
    marginTop: 2,
  },

  avatarWrap: {
    alignSelf: 'center',
    marginBottom: 14,
  },
  avatarImg: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLOR_ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  footer: {
    color: 'rgba(245, 241, 232, 0.55)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
});
