import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Send, MapPin, Paperclip, PhoneCall, ShieldAlert, CheckCircle2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { supportService } from '../services/api';
import { COLORS } from '../styles/colors';
import { formatErrorMessage } from '../utils/validation';
import * as DocumentPicker from 'expo-document-picker';

export default function SupportScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<{ fileUrl: string; fileType: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const CITIES = useMemo(() => [
    { label: t('cities.damascus'), value: 'DAMASCUS' },
    { label: t('cities.rural_damascus'), value: 'RURAL_DAMASCUS' },
    { label: t('cities.aleppo'), value: 'ALEPPO' },
    { label: t('cities.homs'), value: 'HOMS' },
    { label: t('cities.hama'), value: 'HAMA' },
    { label: t('cities.latakia'), value: 'LATAKIA' },
    { label: t('cities.tartus'), value: 'TARTUS' },
    { label: t('cities.idlib'), value: 'IDLIB' },
    { label: t('cities.deir_ez_zor'), value: 'DEIR_EZ_ZOR' },
    { label: t('cities.raqqa'), value: 'RAQQA' },
    { label: t('cities.hasakah'), value: 'HASAKAH' },
    { label: t('cities.daraa'), value: 'DARAA' },
    { label: t('cities.suwayda'), value: 'SUWAYDA' },
    { label: t('cities.quneitra'), value: 'QUNEITRA' },
    { label: t('cities.qamishli'), value: 'QAMISHLI' },
  ], [t]);

  const handleAttachFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setAttachments((prev) => [
        ...prev,
        { fileUrl: file.uri, fileType: file.mimeType || 'unknown', name: file.name },
      ]);
    } catch (err) {
      Alert.alert(t('common.error'), t('support.alerts.attach_error'));
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert(t('common.error'), t('support.alerts.fill_fields'));
      return;
    }

    setIsLoading(true);
    try {
      await supportService.createTicket({
        subject: subject.trim(),
        description: description.trim(),
        city: city as any,
        attachments: attachments.map(a => ({ fileUrl: a.fileUrl, fileType: a.fileType })),
      });
      
      Alert.alert(t('support.success_title'), t('support.success_msg'), [
        { text: t('details.done'), onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert(t('common.error'), formatErrorMessage(error, t('support.alerts.send_error')));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={COLORS.secondary} style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{t('support.title')}</Text>
          <View style={[styles.secureBadge, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.secureText}>{t('support.secure')}</Text>
            <CheckCircle2 size={12} color="#10b981" />
          </View>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.heroSection}>
           <View style={styles.iconCircle}>
              <ShieldAlert size={40} color={COLORS.primary} />
           </View>
           <Text style={styles.heroTitle}>{t('support.hero_title')}</Text>
           <Text style={styles.heroSub}>{t('support.hero_sub')}</Text>
        </View>

        <TouchableOpacity 
          style={styles.emergencyCard} 
          onPress={() => Linking.openURL('tel:112')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#ef4444', '#b91c1c']}
            style={[styles.emergencyGradient, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.emergencyIconBox}>
              <PhoneCall size={24} color="#fff" />
            </View>
            <View style={[styles.emergencyTextContainer, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={styles.emergencyTitle}>{t('support.emergency_title')}</Text>
              <Text style={styles.emergencySubtitle}>{t('support.emergency_sub')}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.formCard}>
          <Text style={[styles.sectionLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{t('support.form_title')}</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('support.subject_label')}</Text>
            <TextInput
              style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={t('support.subject_placeholder')}
              value={subject}
              onChangeText={setSubject}
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('support.desc_label')}</Text>
            <TextInput
              style={[styles.input, styles.textArea, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={t('support.desc_placeholder')}
              value={description}
              onChangeText={setDescription}
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('support.city_label')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.citiesScroll}>
              {CITIES.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.cityChip, { [isRTL ? 'marginLeft' : 'marginRight']: 10 }, city === c.value && styles.cityChipActive]}
                  onPress={() => setCity(city === c.value ? null : c.value)}
                >
                  <Text style={[styles.cityChipText, city === c.value && styles.cityChipTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('support.attach_label')}</Text>
            <TouchableOpacity style={[styles.attachBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={handleAttachFile}>
              <Paperclip size={20} color={COLORS.primary} />
              <Text style={styles.attachBtnText}>{t('support.attach_btn')}</Text>
            </TouchableOpacity>

            {attachments.length > 0 && (
              <View style={styles.filesList}>
                {attachments.map((file, idx) => (
                  <View key={idx} style={[styles.fileItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Text style={[styles.fileName, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{file.name}</Text>
                    <TouchableOpacity onPress={() => handleRemoveAttachment(idx)} style={styles.removeFile}>
                       <Text style={styles.removeText}>{t('common.delete')}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={[styles.submitGradient, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.submitText}>{t('support.submit')}</Text>
                  <Send size={20} color="#fff" style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.footerNote}>
           <Text style={styles.footerText}>{t('support.footer')}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.accent },
  header: {
    flexDirection: 'row',
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
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.secondary, fontFamily: 'Outfit_Bold' },
  secureBadge: { alignItems: 'center', gap: 4, marginTop: 2 },
  secureText: { fontSize: 10, color: '#10b981', fontWeight: '800' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  heroSection: { alignItems: 'center', marginBottom: 30 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(6, 78, 59, 0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: COLORS.secondary, textAlign: 'center', marginBottom: 8 },
  heroSub: { fontSize: 13, color: COLORS.darkGray, textAlign: 'center', paddingHorizontal: 30, lineHeight: 20, fontWeight: '600' },
  emergencyCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 30, elevation: 5, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20 },
  emergencyGradient: { padding: 20, alignItems: 'center', gap: 15 },
  emergencyIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  emergencyTextContainer: { flex: 1 },
  emergencyTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  emergencySubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', marginTop: 2 },
  formCard: { backgroundColor: '#fff', borderRadius: 30, padding: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.02, shadowRadius: 20, elevation: 2 },
  sectionLabel: { fontSize: 16, fontWeight: '900', color: COLORS.secondary, marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '800', color: COLORS.darkGray, marginBottom: 8, marginHorizontal: 4 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 0, height: 54, fontSize: 15, color: COLORS.secondary, fontWeight: '600', textAlignVertical: 'center', includeFontPadding: false },
  textArea: { height: 120, paddingTop: 14, textAlignVertical: 'top' },
  citiesScroll: { marginTop: 4 },
  cityChip: { paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#f8fafc', borderRadius: 14, marginLeft: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  cityChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  cityChipText: { fontSize: 13, fontWeight: '700', color: COLORS.darkGray },
  cityChipTextActive: { color: '#fff' },
  attachBtn: { alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(6, 78, 59, 0.03)', padding: 16, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.primary },
  attachBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: '800' },
  filesList: { marginTop: 12, gap: 8 },
  fileItem: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  fileName: { flex: 1, fontSize: 13, color: COLORS.secondary, fontWeight: '600' },
  removeFile: { paddingHorizontal: 10 },
  removeText: { color: '#ef4444', fontSize: 12, fontWeight: '800' },
  submitBtn: { marginTop: 10, borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
  submitGradient: { paddingVertical: 18, justifyContent: 'center', alignItems: 'center', gap: 12 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  footerNote: { marginTop: 25, alignItems: 'center' },
  footerText: { fontSize: 12, color: COLORS.darkGray, fontWeight: '700', opacity: 0.6 },
});
