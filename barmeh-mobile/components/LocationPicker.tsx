import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { Search, MapPin, ChevronLeft, X, Check, Navigation } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../styles/colors';
import { SYRIAN_LOCATIONS, Governorate } from '../constants/locations';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { height, width } = Dimensions.get('window');

const GOV_CENTROIDS: { gov: Governorate; lat: number; lng: number }[] = [
  { gov: 'DAMASCUS', lat: 33.5138, lng: 36.2765 },
  { gov: 'RURAL_DAMASCUS', lat: 33.5167, lng: 36.5167 },
  { gov: 'ALEPPO', lat: 36.2021, lng: 37.1343 },
  { gov: 'HOMS', lat: 34.7324, lng: 36.7137 },
  { gov: 'HAMA', lat: 35.1318, lng: 36.7578 },
  { gov: 'LATAKIA', lat: 35.5331, lng: 35.7822 },
  { gov: 'TARTUS', lat: 34.8956, lng: 35.8867 },
  { gov: 'IDLIB', lat: 35.9306, lng: 36.6339 },
  { gov: 'DEIR_EZ_ZOR', lat: 35.3360, lng: 40.1467 },
  { gov: 'RAQQA', lat: 35.9494, lng: 39.0095 },
  { gov: 'HASAKAH', lat: 36.5024, lng: 40.7477 },
  { gov: 'DARAA', lat: 32.6189, lng: 36.1021 },
  { gov: 'SUWAYDA', lat: 32.7094, lng: 36.5694 },
  { gov: 'QUNEITRA', lat: 33.1256, lng: 35.8244 },
  { gov: 'QAMISHLI', lat: 37.0522, lng: 41.2317 },
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function findNearestGovernorate(lat: number, lng: number): Governorate {
  let best = GOV_CENTROIDS[0];
  let bestDist = Infinity;
  for (const c of GOV_CENTROIDS) {
    const d = haversineKm(lat, lng, c.lat, c.lng);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best.gov;
}

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (governorate: Governorate, city: string) => void;
  onLocationSelect?: (lat: number, lng: number) => void;
  onSelectAll?: () => void;
  initialGovernorate?: Governorate;
  initialCity?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  visible,
  onClose,
  onSelect,
  onLocationSelect,
  onSelectAll,
  initialGovernorate,
  initialCity,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [step, setStep] = useState<'governorate' | 'city'>('governorate');
  const [selectedGov, setSelectedGov] = useState<Governorate | null>(initialGovernorate || null);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    if (visible) {
      if (initialGovernorate) {
        setSelectedGov(initialGovernorate);
        setStep('city');
      } else {
        setSelectedGov(null);
        setStep('governorate');
      }
      setSearchQuery('');
    }
  }, [visible, initialGovernorate]);

  const filteredGovernorates = useMemo(() => {
    return SYRIAN_LOCATIONS.filter((loc) => {
      const name = t(`cities.${loc.governorate.toLowerCase()}`);
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [searchQuery, t]);

  const filteredCities = useMemo(() => {
    if (!selectedGov) return [];
    const govData = SYRIAN_LOCATIONS.find((l) => l.governorate === selectedGov);
    if (!govData) return [];
    return govData.cities.filter((c) => {
      const name = isRTL ? c.nameAr : c.nameEn;
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [selectedGov, searchQuery, isRTL]);

  const handleGovSelect = (gov: Governorate) => {
    setSelectedGov(gov);
    setStep('city');
    setSearchQuery('');
  };

  const handleCitySelect = (cityName: string) => {
    if (selectedGov) {
      onSelect(selectedGov, cityName);
      onClose();
      setTimeout(() => {
        setStep('governorate');
        setSearchQuery('');
      }, 300);
    }
  };

  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const handleCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('auth_steps.gps_alert_title'), t('auth_steps.gps_alert_msg'));
        setIsLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      if (onLocationSelect) {
        onLocationSelect(latitude, longitude);
      }

      const normalize = (s: string) =>
        (s || '')
          .toLowerCase()
          .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
          .replace(/\bal[- ]/g, '')
          .replace(/[-_]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

      let selectedGovernorate: Governorate | null = null;
      let selectedCityName: string | null = null;
      try {
        const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (address) {
          const region = normalize((address.region || address.city || address.subregion || '').replace(/governorate/i, ''));
          const matched = SYRIAN_LOCATIONS.find((l) => {
            const enName = normalize(l.governorate.replace('_', ' '));
            const arName = normalize(t(`cities.${l.governorate.toLowerCase()}`));
            if (!region) return false;
            return (
              enName === region ||
              arName === region ||
              region.includes(enName) ||
              (!!arName && region.includes(arName))
            );
          });
          if (matched) {
            selectedGovernorate = matched.governorate;
            const osCity = normalize(
              address.district || address.city || address.subregion || (address as any).name || ''
            );
            if (osCity) {
              const cityMatch = matched.cities.find((c) => {
                const ar = normalize(c.nameAr);
                const en = normalize(c.nameEn);
                return (
                  ar === osCity ||
                  en === osCity ||
                  ar.includes(osCity) ||
                  osCity.includes(ar) ||
                  en.includes(osCity) ||
                  osCity.includes(en)
                );
              });
              if (cityMatch) selectedCityName = cityMatch.nameAr;
            }
          }
        }
      } catch {
      }

      if (!selectedGovernorate) {
        selectedGovernorate = findNearestGovernorate(latitude, longitude);
      }

      if (selectedGovernorate && selectedCityName) {
        onSelect(selectedGovernorate, selectedCityName);
        onClose();
      } else if (selectedGovernorate) {
        setSelectedGov(selectedGovernorate);
        setStep('city');
        setSearchQuery('');
      } else {
        onClose();
      }
    } catch (error: any) {
      console.error('Error getting location:', error);
      Alert.alert(t('common.error'), t('auth_steps.gps_alert_msg'));
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleBack = () => {
    if (step === 'city') {
      setStep('governorate');
      setSearchQuery('');
    } else {
      onClose();
    }
  };

  const renderGovItem = ({ item }: { item: typeof SYRIAN_LOCATIONS[0] }) => {
    const isSelected = selectedGov === item.governorate;
    return (
      <TouchableOpacity
        style={[styles.item, isSelected && styles.selectedItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        onPress={() => handleGovSelect(item.governorate)}
      >
        <View style={styles.itemIcon}>
          <MapPin size={18} color={isSelected ? COLORS.accent : COLORS.primary} />
        </View>
        <Text style={[styles.itemText, isSelected && styles.selectedItemText]}>
          {t(`cities.${item.governorate.toLowerCase()}`)}
        </Text>
        {isSelected && <Check size={18} color={COLORS.accent} />}
      </TouchableOpacity>
    );
  };

  const renderCityItem = ({ item }: { item: { id: string; nameAr: string; nameEn: string } }) => {
    const cityName = isRTL ? item.nameAr : item.nameEn;
    const isSelected = initialCity === cityName && selectedGov === initialGovernorate;
    return (
      <TouchableOpacity
        style={[styles.item, isSelected && styles.selectedItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        onPress={() => handleCitySelect(cityName)}
      >
        <View style={styles.itemIcon}>
          <MapPin size={18} color={isSelected ? COLORS.accent : COLORS.gold} />
        </View>
        <Text style={[styles.itemText, isSelected && styles.selectedItemText]}>
          {cityName}
        </Text>
        {isSelected && <Check size={18} color={COLORS.accent} />}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleBack}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />

        <View style={styles.container}>
          <LinearGradient
            colors={[COLORS.accent, '#f8fafc']}
            style={styles.gradientBg}
          >
            <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                {step === 'city' ? (
                  <ChevronLeft size={24} color={COLORS.secondary} style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
                ) : (
                  <X size={24} color={COLORS.secondary} />
                )}
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                {step === 'governorate' ? t('auth.governorate') : t(`cities.${selectedGov?.toLowerCase()}`)}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.searchSection}>
              <View style={[styles.searchBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Search size={20} color={COLORS.gold} />
                <TextInput
                  placeholder={step === 'governorate' ? t('common.search_gov') : t('common.search_city')}
                  style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left' }]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor={COLORS.darkGray}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={18} color={COLORS.darkGray} />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={[styles.currentLocationBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }, isLoadingLocation && { opacity: 0.7 }]}
                onPress={handleCurrentLocation}
                disabled={isLoadingLocation}
              >
                <Navigation size={18} color={COLORS.primary} />
                <Text style={[styles.currentLocationText, { [isRTL ? 'marginRight' : 'marginLeft']: 12 }]}>
                  {isLoadingLocation ? t('common.loading') : t('home.current_location')}
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={(step === 'governorate' ? filteredGovernorates : filteredCities) as any}
              keyExtractor={(item) => step === 'governorate' ? (item as any).governorate : (item as any).id}
              renderItem={step === 'governorate' ? renderGovItem as any : renderCityItem as any}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                step === 'governorate' && onSelectAll && searchQuery.length === 0 ? (
                  <TouchableOpacity
                    style={[styles.item, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                    onPress={() => {
                      onSelectAll();
                      setTimeout(() => {
                        setStep('governorate');
                        setSearchQuery('');
                      }, 300);
                    }}
                  >
                    <View style={styles.itemIcon}>
                      <MapPin size={18} color={COLORS.primary} />
                    </View>
                    <Text style={styles.itemText}>
                      {t('common.all_syria')}
                    </Text>
                  </TouchableOpacity>
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>{t('home.empty')}</Text>
                </View>
              }
            />
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 78, 59, 0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    height: height * 0.85,
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    backgroundColor: COLORS.accent,
  },
  gradientBg: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  searchSection: {
    padding: 20,
  },
  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 56,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 78, 59, 0.08)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  item: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  selectedItem: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(196, 160, 82, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  selectedItemText: {
    color: COLORS.accent,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.darkGray,
    fontWeight: '600',
    fontSize: 14,
  },
  currentLocationBtn: {
    marginTop: 15,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 78, 59, 0.08)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  currentLocationText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
