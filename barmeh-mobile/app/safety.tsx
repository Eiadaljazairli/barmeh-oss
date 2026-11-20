import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ShieldCheck,
  AlertTriangle,
  Eye,
  MapPin,
  CreditCard,
  Users,
  Camera,
  MessageSquare,
  PhoneCall,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../styles/colors';

type Tip = {
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
};

const BUYER_TIPS: Tip[] = [
  {
    Icon: MapPin,
    titleAr: 'التق في مكان عام',
    titleEn: 'Meet in public',
    bodyAr: 'اختر مكاناً عاماً ومزدحماً (مقهى، محطة وقود) ويفضَّل في النهار. تجنب المنازل الخاصة.',
    bodyEn: 'Choose a busy public place (café, fuel station), preferably in daylight. Avoid private homes.',
  },
  {
    Icon: Eye,
    titleAr: 'افحص قبل أن تدفع',
    titleEn: 'Inspect before paying',
    bodyAr: 'اطلب رؤية المنتج وفحصه بنفسك. تأكد من السلامة والوصف المطابق قبل تسليم أي مبلغ.',
    bodyEn: 'See and inspect the item yourself. Make sure it matches the description before handing over money.',
  },
  {
    Icon: CreditCard,
    titleAr: 'لا تدفع مقدماً',
    titleEn: "Don't pay in advance",
    bodyAr: 'لا تحوِّل أي مبلغ قبل استلام المنتج. التحويلات البنكية أو الـ Western Union للأشخاص الغرباء = خطر.',
    bodyEn: 'Never transfer money before receiving the item. Bank/Western Union transfers to strangers = high risk.',
  },
  {
    Icon: Users,
    titleAr: 'اصطحب شخصاً معك',
    titleEn: 'Bring someone with you',
    bodyAr: 'للصفقات الكبيرة (سيارات، عقارات، إلكترونيات غالية)، اصطحب صديقاً أو فرداً من العائلة.',
    bodyEn: 'For big deals (cars, real estate, expensive electronics), bring a friend or family member.',
  },
];

const SELLER_TIPS: Tip[] = [
  {
    Icon: Camera,
    titleAr: 'صور حقيقية وواضحة',
    titleEn: 'Real, clear photos',
    bodyAr: 'استخدم صورك الخاصة بإضاءة جيدة. الصور المنسوخة من الإنترنت تُحذف وتُخفض ثقتك.',
    bodyEn: 'Use your own well-lit photos. Stolen internet images get removed and lower your trust score.',
  },
  {
    Icon: MessageSquare,
    titleAr: 'تواصل داخل التطبيق',
    titleEn: 'Chat inside the app',
    bodyAr: 'لا تشارك معلومات بنكية أو هوية بالشات. التواصل داخل التطبيق محمي ومسجَّل.',
    bodyEn: "Don't share banking info or ID in chat. In-app communication is protected and logged.",
  },
  {
    Icon: ShieldCheck,
    titleAr: 'وثِّق حسابك',
    titleEn: 'Verify your account',
    bodyAr: 'الحسابات الموثَّقة (شارة ذهبية) تبيع أسرع وبثقة أعلى من المشترين.',
    bodyEn: 'Verified accounts (gold badge) sell faster with higher buyer trust.',
  },
];

const RED_FLAGS_AR = [
  'يطلب منك التحويل قبل أن يراك المنتج',
  'سعر منخفض جداً مقارنةً بالسوق',
  'يرفض اللقاء وجهاً لوجه ويصرّ على الشحن',
  'يستخدم أرقام هواتف خارج سوريا',
  'يطلب رمز التحقق (OTP) — هذا احتيال أكيد',
];

const RED_FLAGS_EN = [
  'Asks you to transfer money before seeing the item',
  'Price suspiciously low vs. market',
  'Refuses face-to-face meeting, insists on shipping',
  'Uses phone numbers outside Syria',
  'Asks for OTP verification code — this is always a scam',
];

export default function SafetyScreen() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const renderTip = (tip: Tip, idx: number) => (
    <View key={idx} style={[styles.tipCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={styles.tipIconBox}>
        <tip.Icon size={22} color={COLORS.primary} strokeWidth={1.85} />
      </View>
      <View style={[styles.tipContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.tipTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? tip.titleAr : tip.titleEn}
        </Text>
        <Text style={[styles.tipBody, { textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? tip.bodyAr : tip.bodyEn}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={COLORS.secondary} style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isRTL ? 'مركز الأمان' : 'Safety Center'}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.heroCard}
        >
          <View style={styles.heroIconBox}>
            <ShieldCheck size={36} color={COLORS.gold} strokeWidth={2} />
          </View>
          <Text style={styles.heroTitle}>
            {isRTL ? 'أمانك أولوية' : 'Your safety first'}
          </Text>
          <Text style={styles.heroSub}>
            {isRTL
              ? 'دليلك للتعامل الآمن — اقرأها قبل أول صفقة.'
              : 'Your guide to safe trading — read before your first deal.'}
          </Text>
        </LinearGradient>

        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? 'نصائح للمشتري' : 'For buyers'}
        </Text>
        {BUYER_TIPS.map(renderTip)}

        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? 'نصائح للبائع' : 'For sellers'}
        </Text>
        {SELLER_TIPS.map(renderTip)}

        <View style={styles.redFlagsCard}>
          <View style={[styles.redFlagsHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <AlertTriangle size={22} color={COLORS.error} strokeWidth={2.25} />
            <Text style={[styles.redFlagsTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'علامات تحذيرية — احذر منها' : 'Red flags — be careful'}
            </Text>
          </View>
          {(isRTL ? RED_FLAGS_AR : RED_FLAGS_EN).map((flag, idx) => (
            <View key={idx} style={[styles.redFlagItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={styles.redFlagDot}>•</Text>
              <Text style={[styles.redFlagText, { textAlign: isRTL ? 'right' : 'left' }]}>
                {flag}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.ctaRow}>
          <TouchableOpacity
            style={[styles.ctaBtn, styles.ctaPrimary]}
            onPress={() => router.push('/support' as any)}
            activeOpacity={0.9}
          >
            <MessageSquare size={18} color="#fff" />
            <Text style={styles.ctaBtnText}>{isRTL ? 'تواصل مع الدعم' : 'Contact support'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ctaBtn, styles.ctaDanger]}
            onPress={() => Linking.openURL('tel:112')}
            activeOpacity={0.9}
          >
            <PhoneCall size={18} color="#fff" />
            <Text style={styles.ctaBtnText}>{isRTL ? 'طوارئ 112' : 'Emergency 112'}</Text>
          </TouchableOpacity>
        </View>

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
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(184, 134, 11, 0.18)',
    borderWidth: 2,
    borderColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: { fontSize: 19, fontWeight: '900', color: '#fff', marginBottom: 6 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', fontWeight: '600', lineHeight: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.secondary,
    marginTop: 8,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    alignItems: 'flex-start',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  tipIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(6, 78, 59, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipContent: { flex: 1 },
  tipTitle: { fontSize: 14.5, fontWeight: '900', color: COLORS.secondary, marginBottom: 4 },
  tipBody: { fontSize: 13, color: COLORS.darkGray, fontWeight: '600', lineHeight: 20 },
  redFlagsCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
    borderRadius: 20,
    padding: 18,
    marginTop: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  redFlagsHeader: { alignItems: 'center', gap: 10, marginBottom: 12 },
  redFlagsTitle: { flex: 1, fontSize: 15, fontWeight: '900', color: COLORS.error },
  redFlagItem: { alignItems: 'flex-start', gap: 8, paddingVertical: 4 },
  redFlagDot: { fontSize: 16, color: COLORS.error, fontWeight: '900' },
  redFlagText: { flex: 1, fontSize: 13.5, color: COLORS.darkGray, fontWeight: '600', lineHeight: 20 },
  ctaRow: { gap: 10, marginTop: 12 },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 16,
  },
  ctaPrimary: { backgroundColor: COLORS.primary },
  ctaDanger: { backgroundColor: COLORS.error },
  ctaBtnText: { color: '#fff', fontSize: 14.5, fontWeight: '900' },
});
