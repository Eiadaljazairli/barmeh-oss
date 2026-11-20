import React, { useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { X, MapPin, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { City } from '../services/api';
import { COLORS } from '../styles/colors';

const { height } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (city: City | 'ALL') => void;
  selectedCity: City | 'ALL';
}

export default function CitySelectorModal({ visible, onClose, onSelect, selectedCity }: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const CITIES = useMemo(() => [
    { label: t('cities.all'), value: 'ALL' },
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.title}>{t('common.select_city')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color="#0f172a" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list}>
            {CITIES.map((city) => (
              <TouchableOpacity
                key={city.value}
                style={[
                  styles.item,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                  selectedCity === city.value && styles.itemActive
                ]}
                onPress={() => {
                  onSelect(city.value as any);
                  onClose();
                }}
              >
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
                  <View style={[
                    styles.iconBox,
                    { [isRTL ? 'marginLeft' : 'marginRight']: 16 },
                    selectedCity === city.value && styles.iconBoxActive
                  ]}>
                    <MapPin size={20} color={selectedCity === city.value ? '#fff' : '#64748b'} />
                  </View>
                  <Text style={[
                    styles.itemLabel,
                    selectedCity === city.value && styles.itemLabelActive
                  ]}>
                    {city.label}
                  </Text>
                </View>
                {selectedCity === city.value && (
                  <Check size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    height: height * 0.6,
    paddingTop: 24,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  closeBtn: {
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 12,
  },
  list: {
    paddingHorizontal: 20,
  },
  item: {
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  itemActive: {
    backgroundColor: '#f0f7ff',
    borderColor: COLORS.gold,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBoxActive: {
    backgroundColor: COLORS.primary,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  itemLabelActive: {
    color: COLORS.secondary,
  },
});
