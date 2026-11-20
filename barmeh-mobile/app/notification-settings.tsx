import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Bell, MessageCircle, Tag, Package, ShieldCheck } from 'lucide-react-native';
import { COLORS } from '../styles/colors';
import { notificationService } from '../services/api';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [prefs, setPrefs] = useState({
    messages: true,
    newListings: true,
    priceUpdates: true,
    system: true,
  });

  useEffect(() => {
    fetchPrefs();
  }, []);

  const fetchPrefs = async () => {
    try {
      const data = await notificationService.getPreferences();
      if (data) {
        setPrefs({
          messages: data.messages ?? true,
          newListings: data.newListings ?? true,
          priceUpdates: data.priceUpdates ?? true,
          system: data.system ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSwitch = (key: keyof typeof prefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await notificationService.updatePreferences(prefs);
      Alert.alert(isRTL ? 'نجاح' : 'Success', isRTL ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'فشل حفظ الإعدادات' : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const renderSetting = (icon: any, title: string, subtitle: string, value: boolean, onToggle: () => void) => (
    <View style={[styles.settingRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={[styles.iconContainer, { [isRTL ? 'marginLeft' : 'marginRight']: 16 }]}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
        <Text style={[styles.settingSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>{subtitle}</Text>
      </View>
      <Switch
        trackColor={{ false: '#e2e8f0', true: COLORS.primary }}
        thumbColor="#fff"
        ios_backgroundColor="#e2e8f0"
        onValueChange={onToggle}
        value={value}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowRight size={24} color="#fff" style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isRTL ? 'إعدادات التنبيهات' : 'Notification Settings'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'تنبيهات النشاط' : 'Activity Notifications'}
          </Text>
          
          {renderSetting(
            <MessageCircle size={22} color={COLORS.primary} />,
            isRTL ? 'الرسائل الخاصة' : 'Private Messages',
            isRTL ? 'تنبيهات عند استلام رسائل جديدة من المستخدمين' : 'Notifications for new messages from users',
            prefs.messages,
            () => toggleSwitch('messages')
          )}

          {renderSetting(
            <Package size={22} color={COLORS.primary} />,
            isRTL ? 'تحديثات الإعلانات' : 'Listing Updates',
            isRTL ? 'تنبيهات حول إعلاناتك أو إعلانات تهمك' : 'Updates about your listings or watched items',
            prefs.newListings,
            () => toggleSwitch('newListings')
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'تنبيهات النظام' : 'System Notifications'}
          </Text>

          {renderSetting(
            <Tag size={22} color={COLORS.primary} />,
            isRTL ? 'العروض والترويج' : 'Promos & Offers',
            isRTL ? 'إعلانات عن ميزات جديدة أو عروض خاصة' : 'New features or special promotional offers',
            prefs.priceUpdates,
            () => toggleSwitch('priceUpdates')
          )}

          {renderSetting(
            <ShieldCheck size={22} color={COLORS.primary} />,
            isRTL ? 'تنبيهات الأمان' : 'Security & System',
            isRTL ? 'تنبيهات حول الحساب والنظام والأمان' : 'Account security and system status updates',
            prefs.system,
            () => toggleSwitch('system')
          )}
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
          onPress={saveSettings}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>{isRTL ? 'حفظ التغييرات' : 'Save Changes'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  backBtn: { padding: 8 },
  scroll: { padding: 20 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 20,
    opacity: 0.8,
  },
  settingRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(6, 78, 59, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  settingSubtitle: { fontSize: 12, color: '#64748b' },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
