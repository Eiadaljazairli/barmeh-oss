import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Lock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../styles/colors';

export default function PrivacyScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={styles.backBtn}>
          <ArrowRight size={24} color="#fff" style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('privacy.title')}</Text>
        <Lock size={28} color="#fff" />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.lastUpdated, { textAlign: isRTL ? 'right' : 'left' }]}>{t('privacy.last_updated')}</Text>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('privacy.s1_title')}</Text>
          <Text style={[styles.text, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('privacy.s1_text')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('privacy.s2_title')}</Text>
          <Text style={[styles.text, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('privacy.s2_text')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('privacy.s3_title')}</Text>
          <Text style={[styles.text, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('privacy.s3_text')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('privacy.s4_title')}</Text>
          <Text style={[styles.text, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('privacy.s4_text')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('privacy.s5_title')}</Text>
          <Text style={[styles.text, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('privacy.s5_text')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backBtn: { padding: 8 },
  title: { fontSize: 20, fontWeight: '900', color: '#fff', fontFamily: 'Outfit_Bold' },
  content: { padding: 25 },
  lastUpdated: { fontSize: 13, color: COLORS.darkGray, marginBottom: 20, textAlign: 'right' },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.primary, marginBottom: 10, textAlign: 'right' },
  text: { fontSize: 15, color: '#475569', lineHeight: 24, textAlign: 'right' },
});
