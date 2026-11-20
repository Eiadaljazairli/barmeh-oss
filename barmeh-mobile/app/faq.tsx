import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../styles/colors';

const FAQ_ITEMS_AR = [
  {
    q: 'كيف أنشر إعلاناً جديداً؟',
    a: 'اضغط على زر "نشر" في الشريط السفلي، اختر القسم المناسب، أضف الصور والوصف والسعر، ثم اضغط "نشر الإعلان". سيظهر إعلانك مباشرة بعد المراجعة (عادة خلال دقائق).',
  },
  {
    q: 'هل النشر مجاني؟',
    a: 'نعم، النشر مجاني تماماً. يمكنك ترقية إعلانك (Bump أو Featured) مقابل رسوم اختيارية لزيادة الظهور.',
  },
  {
    q: 'كيف أحمي نفسي من الاحتيال؟',
    a: 'لا تدفع مقدماً، التق بالبائع في مكان عام، افحص المنتج قبل الدفع، وتجنب التحويلات المالية لأشخاص لا تعرفهم. راجع "مركز الأمان" لمزيد من النصائح.',
  },
  {
    q: 'كم مدة ظهور الإعلان؟',
    a: 'الإعلانات تبقى نشطة لمدة 60 يوماً. يمكنك تجديدها مجاناً من قائمة "إعلاناتي".',
  },
  {
    q: 'كيف أحفظ بحثاً وأحصل على تنبيهات؟',
    a: 'بعد إجراء بحث بالفلاتر التي تريدها، اضغط على أيقونة الإشارة المرجعية بجانب البحث. سنرسل لك إشعاراً كلما توفر إعلان جديد يطابق بحثك.',
  },
  {
    q: 'كيف أحذف إعلاناً؟',
    a: 'من قائمة "إعلاناتي" في صفحة الملف الشخصي، اضغط على الإعلان ثم اختر "حذف". يمكنك أيضاً تعطيله مؤقتاً بدلاً من الحذف.',
  },
  {
    q: 'كيف أبلِّغ عن إعلان مخالف؟',
    a: 'افتح صفحة الإعلان، اضغط على الثلاث نقاط في الأعلى، ثم "تبليغ". سيراجع فريقنا التبليغ خلال 24 ساعة.',
  },
  {
    q: 'كيف أوثِّق حسابي؟',
    a: 'من قائمة الجانب → "توثيق الحساب". يتطلب التوثيق صورة هوية + صورة شخصية. الحسابات الموثَّقة تظهر بشارة ذهبية وتحصل على ثقة أكبر من المشترين.',
  },
];

const FAQ_ITEMS_EN = [
  {
    q: 'How do I post a new listing?',
    a: 'Tap the "Post" button in the bottom bar, choose a category, add photos/description/price, then tap "Publish". Your listing appears after a short review (usually minutes).',
  },
  {
    q: 'Is posting free?',
    a: 'Yes, posting is completely free. Optional paid promotions (Bump, Featured) increase visibility.',
  },
  {
    q: 'How do I protect myself from scams?',
    a: "Don't pay in advance, meet sellers in public places, inspect items before paying, and avoid money transfers to strangers. See Safety Center for more.",
  },
  {
    q: 'How long does a listing stay active?',
    a: 'Listings stay active for 60 days. You can renew them for free from "My Listings".',
  },
  {
    q: 'How do I save a search and get alerts?',
    a: 'After searching with filters, tap the bookmark icon next to the search. We\'ll notify you when matching new listings are posted.',
  },
  {
    q: 'How do I delete a listing?',
    a: 'From "My Listings" in your profile, tap a listing, then "Delete". You can also pause it instead.',
  },
  {
    q: 'How do I report a violating listing?',
    a: 'Open the listing, tap the three dots, then "Report". Our team reviews reports within 24 hours.',
  },
  {
    q: 'How do I verify my account?',
    a: 'Side menu → "Verify account". Requires an ID photo + selfie. Verified accounts get a gold badge and higher buyer trust.',
  },
];

export default function FaqScreen() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const items = isRTL ? FAQ_ITEMS_AR : FAQ_ITEMS_EN;
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={COLORS.secondary} style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isRTL ? 'الأسئلة الشائعة' : 'FAQ'}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <HelpCircle size={36} color={COLORS.primary} strokeWidth={1.85} />
          </View>
          <Text style={styles.heroTitle}>
            {isRTL ? 'كيف يمكننا مساعدتك؟' : 'How can we help?'}
          </Text>
          <Text style={styles.heroSub}>
            {isRTL ? 'إجابات سريعة لأكثر الأسئلة شيوعاً.' : 'Quick answers to the most common questions.'}
          </Text>
        </View>

        {items.map((item, idx) => {
          const isOpen = openIdx === idx;
          const ToggleIcon = isOpen ? ChevronUp : ChevronDown;
          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.85}
              style={styles.card}
              onPress={() => setOpenIdx(isOpen ? null : idx)}
            >
              <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.q, { textAlign: isRTL ? 'right' : 'left' }]}>{item.q}</Text>
                <ToggleIcon size={20} color={COLORS.primary} />
              </View>
              {isOpen && (
                <Text style={[styles.a, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {item.a}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}

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
  scrollContent: { padding: 22, paddingBottom: 100 },
  heroSection: { alignItems: 'center', marginBottom: 24 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(6, 78, 59, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroTitle: { fontSize: 20, fontWeight: '900', color: COLORS.secondary, marginBottom: 6 },
  heroSub: { fontSize: 13, color: COLORS.darkGray, textAlign: 'center', paddingHorizontal: 24, lineHeight: 20, fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: { alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  q: { flex: 1, fontSize: 14.5, fontWeight: '800', color: COLORS.secondary, lineHeight: 22 },
  a: { fontSize: 13.5, color: COLORS.darkGray, lineHeight: 22, marginTop: 12, fontWeight: '600' },
});
