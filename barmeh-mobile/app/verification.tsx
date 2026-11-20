import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Camera,
  Send,
  Star,
  TrendingUp,
  MessageCircle,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../styles/colors';
import { authService } from '../services/api';

type StoredUser = {
  id: string;
  trustLevel?: string;
  trustScore?: number;
};

export default function VerificationScreen() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    authService.getCurrentUser().then((u) => setUser(u as StoredUser | null)).catch(() => {});
  }, []);

  const isVerified = user?.trustLevel === 'VERIFIED' || user?.trustLevel === 'TRUSTED';

  const handleStart = () => {
    Alert.alert(
      isRTL ? 'قريباً' : 'Coming soon',
      isRTL
        ? 'خدمة التوثيق ستكون متاحة قريباً. ستتمكن من رفع صورة هويتك وأخذ selfie مباشرة من التطبيق.'
        : 'Verification will be available soon. You\'ll upload an ID photo and take a selfie inside the app.',
    );
  };

  const benefits = [
    {
      Icon: Star,
      titleAr: 'شارة ذهبية',
      titleEn: 'Gold badge',
      bodyAr: 'إعلاناتك تظهر مع شارة "موثَّق" تزيد ثقة المشترين.',
      bodyEn: 'Your listings display a "Verified" gold badge that increases buyer trust.',
    },
    {
      Icon: TrendingUp,
      titleAr: 'ظهور أفضل',
      titleEn: 'Better visibility',
      bodyAr: 'إعلانات الحسابات الموثَّقة تظهر بأولوية في نتائج البحث.',
      bodyEn: 'Verified accounts get priority in search results.',
    },
    {
      Icon: MessageCircle,
      titleAr: 'محادثات أكثر',
      titleEn: 'More inquiries',
      bodyAr: 'متوسط 3× محادثات أكثر مقارنةً بالحسابات غير الموثَّقة.',
      bodyEn: 'Average 3× more inquiries vs. unverified accounts.',
    },
  ];

  const steps = [
    {
      Icon: CreditCard,
      titleAr: '1. صورة الهوية',
      titleEn: '1. ID photo',
      bodyAr: 'هوية شخصية أو جواز سفر — الوجهان واضحان.',
      bodyEn: 'National ID or passport — both sides clear.',
    },
    {
      Icon: Camera,
      titleAr: '2. صورة selfie',
      titleEn: '2. Selfie photo',
      bodyAr: 'سيلفي مباشر للتأكد من تطابق الوجه مع الهوية.',
      bodyEn: 'Live selfie to match face with ID.',
    },
    {
      Icon: Send,
      titleAr: '3. إرسال للمراجعة',
      titleEn: '3. Submit for review',
      bodyAr: 'فريقنا يراجع طلبك خلال 24-48 ساعة.',
      bodyEn: 'Our team reviews within 24-48 hours.',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={COLORS.secondary} style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isRTL ? 'توثيق الحساب' : 'Verify Account'}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.heroCard}
        >
          <View style={styles.heroIconBox}>
            <ShieldCheck size={42} color={COLORS.gold} strokeWidth={2} />
          </View>
          <Text style={styles.heroTitle}>
            {isVerified
              ? (isRTL ? 'حسابك موثَّق ✓' : 'Account verified ✓')
              : (isRTL ? 'وثِّق حسابك' : 'Verify your account')}
          </Text>
          <Text style={styles.heroSub}>
            {isVerified
              ? (isRTL ? 'تمتع بكامل مزايا الحساب الموثَّق.' : 'Enjoy all verified account benefits.')
              : (isRTL ? 'احصل على شارة "موثَّق" وزِد ثقة المشترين بك.' : 'Get the "Verified" badge and boost buyer trust.')}
          </Text>
        </LinearGradient>

        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? 'لماذا التوثيق؟' : 'Why verify?'}
        </Text>
        {benefits.map((b, idx) => (
          <View key={idx} style={[styles.benefitCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.benefitIconBox}>
              <b.Icon size={20} color={COLORS.gold} strokeWidth={1.85} />
            </View>
            <View style={[styles.benefitContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.benefitTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? b.titleAr : b.titleEn}
              </Text>
              <Text style={[styles.benefitBody, { textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? b.bodyAr : b.bodyEn}
              </Text>
            </View>
          </View>
        ))}

        {!isVerified && (
          <>
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'الخطوات' : 'Steps'}
            </Text>
            {steps.map((s, idx) => (
              <View key={idx} style={[styles.stepCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.stepIconBox}>
                  <s.Icon size={20} color={COLORS.primary} strokeWidth={1.85} />
                </View>
                <View style={[styles.stepContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <Text style={[styles.stepTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? s.titleAr : s.titleEn}
                  </Text>
                  <Text style={[styles.stepBody, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? s.bodyAr : s.bodyEn}
                  </Text>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.9}>
              <LinearGradient
                colors={[COLORS.gold, '#9a7008']}
                style={[styles.startBtnGradient, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              >
                <ShieldCheck size={22} color="#fff" strokeWidth={2.25} />
                <Text style={styles.startBtnText}>
                  {isRTL ? 'ابدأ التوثيق' : 'Start verification'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {isVerified && (
          <View style={[styles.verifiedBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <CheckCircle2 size={24} color={COLORS.success} strokeWidth={2.25} />
            <Text style={[styles.verifiedText, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'حسابك موثَّق وحاصل على كل المزايا.' : 'Your account is verified with all benefits unlocked.'}
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.accent },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: COLORS.accent,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backBtn: { padding: 10, backgroundColor: 'rgba(6, 78, 59, 0.05)', borderRadius: 14 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.secondary, fontFamily: 'Outfit_Bold' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  heroCard: {
    borderRadius: 24,
    padding: 26,
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(184, 134, 11, 0.18)',
    borderWidth: 2,
    borderColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroTitle: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 8, textAlign: 'center' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', fontWeight: '600', lineHeight: 20, paddingHorizontal: 10 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.secondary,
    marginTop: 8,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  benefitCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    alignItems: 'flex-start',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.1)',
  },
  benefitIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(184, 134, 11, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitContent: { flex: 1 },
  benefitTitle: { fontSize: 14.5, fontWeight: '900', color: COLORS.secondary, marginBottom: 4 },
  benefitBody: { fontSize: 13, color: COLORS.darkGray, fontWeight: '600', lineHeight: 19 },
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    alignItems: 'flex-start',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  stepIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(6, 78, 59, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 14.5, fontWeight: '900', color: COLORS.secondary, marginBottom: 4 },
  stepBody: { fontSize: 13, color: COLORS.darkGray, fontWeight: '600', lineHeight: 19 },
  startBtn: {
    marginTop: 18,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  startBtnGradient: {
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  verifiedBox: {
    marginTop: 18,
    padding: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 18,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  verifiedText: { flex: 1, fontSize: 13.5, color: COLORS.success, fontWeight: '800', lineHeight: 20 },
});
