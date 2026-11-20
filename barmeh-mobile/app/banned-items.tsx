import React from 'react';
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
import {
  ChevronLeft,
  AlertOctagon,
  XCircle,
  ShieldOff,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../styles/colors';

type Category = {
  titleAr: string;
  titleEn: string;
  itemsAr: string[];
  itemsEn: string[];
};

const CATEGORIES: Category[] = [
  {
    titleAr: 'أسلحة وذخائر',
    titleEn: 'Weapons & Ammunition',
    itemsAr: [
      'الأسلحة النارية بجميع أنواعها',
      'الذخائر، القنابل، المتفجرات',
      'الأسلحة البيضاء (سكاكين قتالية)',
      'المسدسات الصوتية والكهربائية',
    ],
    itemsEn: [
      'Firearms of all kinds',
      'Ammunition, bombs, explosives',
      'Combat knives and bladed weapons',
      'Stun guns and electric weapons',
    ],
  },
  {
    titleAr: 'مخدرات ومواد ممنوعة',
    titleEn: 'Drugs & Banned Substances',
    itemsAr: [
      'جميع أنواع المخدرات (طبيعية أو صناعية)',
      'أدوية تستلزم وصفة طبية بدون ترخيص',
      'مواد كيميائية خطرة',
      'تبغ وسجائر لمن هم دون 18 عاماً',
    ],
    itemsEn: [
      'All types of drugs (natural or synthetic)',
      'Prescription medications without license',
      'Hazardous chemicals',
      'Tobacco/cigarettes to minors',
    ],
  },
  {
    titleAr: 'محتوى غير قانوني أو مسيء',
    titleEn: 'Illegal or Offensive Content',
    itemsAr: [
      'المحتوى الإباحي بجميع أشكاله',
      'المواد التي تحض على الكراهية أو العنف',
      'الرموز الإرهابية',
      'محتوى ينتهك خصوصية الآخرين',
    ],
    itemsEn: [
      'Pornographic content in any form',
      'Hate speech or violence-inciting material',
      'Terrorist symbols',
      'Content violating others\' privacy',
    ],
  },
  {
    titleAr: 'منتجات مقلَّدة أو مسروقة',
    titleEn: 'Counterfeit or Stolen Goods',
    itemsAr: [
      'منتجات تقليد ماركات عالمية',
      'هواتف أو سيارات بدون أوراق رسمية',
      'وثائق رسمية مزوَّرة',
      'بطاقات هوية أو رخص قيادة',
    ],
    itemsEn: [
      'Counterfeit branded products',
      'Phones or cars without official papers',
      'Forged official documents',
      'ID cards or driving licenses',
    ],
  },
  {
    titleAr: 'حيوانات وآثار',
    titleEn: 'Animals & Antiquities',
    itemsAr: [
      'الحيوانات المهددة بالانقراض',
      'منتجات من العاج أو القرون',
      'الآثار والقطع التاريخية',
      'الحيوانات البرية الخطرة',
    ],
    itemsEn: [
      'Endangered animals',
      'Ivory or horn products',
      'Antiques and historical artifacts',
      'Dangerous wild animals',
    ],
  },
  {
    titleAr: 'خدمات مالية مشبوهة',
    titleEn: 'Suspicious Financial Services',
    itemsAr: [
      'قروض ربوية أو غير مرخَّصة',
      'العملات المزوَّرة',
      'مخططات هرمية أو احتيالية',
      'خدمات غسيل الأموال',
    ],
    itemsEn: [
      'Unlicensed or usurious loans',
      'Counterfeit currency',
      'Pyramid schemes or scams',
      'Money laundering services',
    ],
  },
];

export default function BannedItemsScreen() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={COLORS.secondary} style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isRTL ? 'الممنوعات' : 'Banned Items'}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.warningCard}>
          <View style={[styles.warningHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.warningIconBox}>
              <AlertOctagon size={28} color={COLORS.error} strokeWidth={2} />
            </View>
            <View style={[styles.warningTextContainer, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.warningTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'ممنوع النشر' : 'Forbidden to post'}
              </Text>
              <Text style={[styles.warningSub, { textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL
                  ? 'مخالفة هذه القواعد تؤدي لحذف الإعلان وقد تصل لحظر الحساب نهائياً.'
                  : 'Violating these rules results in listing removal and possibly permanent ban.'}
              </Text>
            </View>
          </View>
        </View>

        {CATEGORIES.map((cat, idx) => (
          <View key={idx} style={styles.catCard}>
            <View style={[styles.catHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <ShieldOff size={18} color={COLORS.error} strokeWidth={2} />
              <Text style={[styles.catTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? cat.titleAr : cat.titleEn}
              </Text>
            </View>
            {(isRTL ? cat.itemsAr : cat.itemsEn).map((item, j) => (
              <View key={j} style={[styles.itemRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <XCircle size={14} color={COLORS.error} strokeWidth={2.25} />
                <Text style={[styles.itemText, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.footerNote}>
          <Text style={[styles.footerText, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL
              ? 'إذا رأيت إعلاناً يخالف هذه القواعد، يرجى الإبلاغ عنه فوراً عبر أيقونة "الإبلاغ" بصفحة الإعلان. فريقنا يراجع كل التبليغات خلال 24 ساعة.'
              : 'If you see a listing violating these rules, please report it immediately via the "Report" icon on the listing page. Our team reviews all reports within 24 hours.'}
          </Text>
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
  warningCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.18)',
  },
  warningHeader: { alignItems: 'flex-start', gap: 14 },
  warningIconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningTextContainer: { flex: 1 },
  warningTitle: { fontSize: 16, fontWeight: '900', color: COLORS.error, marginBottom: 4 },
  warningSub: { fontSize: 12.5, color: COLORS.darkGray, fontWeight: '600', lineHeight: 20 },
  catCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  catHeader: { alignItems: 'center', gap: 10, marginBottom: 12 },
  catTitle: { flex: 1, fontSize: 15, fontWeight: '900', color: COLORS.secondary },
  itemRow: { alignItems: 'flex-start', gap: 10, paddingVertical: 5 },
  itemText: { flex: 1, fontSize: 13.5, color: COLORS.darkGray, fontWeight: '600', lineHeight: 20 },
  footerNote: {
    marginTop: 14,
    padding: 16,
    backgroundColor: 'rgba(6, 78, 59, 0.04)',
    borderRadius: 16,
  },
  footerText: { fontSize: 12.5, color: COLORS.darkGray, fontWeight: '600', lineHeight: 20 },
});
