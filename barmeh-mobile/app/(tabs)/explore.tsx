import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  StatusBar,
  Alert
} from 'react-native';
import { Search, MapPin, Filter, ChevronRight, TrendingUp, History } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../styles/colors';

const { width } = Dimensions.get('window');

export default function ExploreScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const initialPopularSearches = [t('explore.popular.apartments'), t('explore.popular.toyota'), t('explore.popular.iphone'), t('explore.popular.table'), t('explore.popular.jobs')];
  const initialRecentSearches = [t('explore.recent.mercedes'), t('explore.recent.shop'), t('explore.recent.ps5')];

  const [search, setSearch] = useState('');
  const [recent, setRecent] = useState(initialRecentSearches);
  const router = useRouter();

  const handleSearch = (term: string) => {
    setSearch(term);
    Alert.alert(t('explore.title'), t('explore.alerts.searching', { term }));
  };

  const clearRecent = () => {
    Alert.alert(
      t('explore.alerts.clear_confirm_title'),
      t('explore.alerts.clear_confirm_msg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.success'), onPress: () => setRecent([]) }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.accent }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={{ paddingTop: 60, paddingBottom: 25, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(196, 160, 82, 0.3)' }}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.accent, textAlign: isRTL ? 'right' : 'left', marginBottom: 15, letterSpacing: -0.5 }}>{t('explore.title')}</Text>
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.12)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(196, 160, 82, 0.4)' }}>
          <TouchableOpacity onPress={() => handleSearch(search)}>
             <Search size={20} color={COLORS.gold} />
          </TouchableOpacity>
          <TextInput
            placeholder={t('explore.search_placeholder')}
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            style={{ flex: 1, marginHorizontal: 12, textAlign: isRTL ? 'right' : 'left', fontWeight: '700', color: COLORS.accent, padding: 0, textAlignVertical: 'center', includeFontPadding: false, fontSize: 15 }}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => handleSearch(search)}
          />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.recentSection}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <TouchableOpacity onPress={clearRecent}>
               <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 12 }}>{t('explore.clear_all')}</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.secondary, [isRTL ? 'marginRight' : 'marginLeft']: 8 }}>{t('explore.recent_searches')}</Text>
              <History size={18} color={COLORS.gold} />
            </View>
          </View>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', justifyContent: isRTL ? 'flex-start' : 'flex-end' }}>
            {recent.length > 0 ? recent.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleSearch(item)}
                style={{ backgroundColor: COLORS.lightGray, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, [isRTL ? 'marginLeft' : 'marginRight']: 8, marginBottom: 8 }}
              >
                <Text style={{ color: COLORS.darkGray, fontWeight: '600', fontSize: 13 }}>{item}</Text>
              </TouchableOpacity>
            )) : (
              <Text style={{ color: COLORS.darkGray, fontSize: 12, fontWeight: '600', textAlign: isRTL ? 'right' : 'left', width: '100%' }}>{t('explore.empty_recent')}</Text>
            )}
          </View>
        </View>

        <View style={{ paddingHorizontal: 24 }}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: isRTL ? 'flex-start' : 'flex-end', alignItems: 'center', marginBottom: 15 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.secondary, [isRTL ? 'marginRight' : 'marginLeft']: 8 }}>{t('explore.popular_searches')}</Text>
            <TrendingUp size={18} color={COLORS.gold} />
          </View>
          {initialPopularSearches.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleSearch(item)}
              style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray }}
            >
              <ChevronRight size={18} color={COLORS.gold} style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
              <Text style={{ color: COLORS.secondary, fontWeight: '600', fontSize: 15, textAlign: isRTL ? 'right' : 'left' }}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => router.push('/map')}
          style={{
            margin: 24,
            backgroundColor: COLORS.primary,
            borderRadius: 24,
            padding: 24,
            flexDirection: isRTL ? 'row-reverse' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: COLORS.gold,
            shadowColor: COLORS.primary,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 15,
            elevation: 8
          }}
        >
          <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 15 }}>
             <MapPin size={24} color={COLORS.gold} />
          </View>
          <View>
            <Text style={{ color: COLORS.accent, fontSize: 18, fontWeight: '900', textAlign: isRTL ? 'right' : 'left' }}>{t('explore.search_via_map')}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', textAlign: isRTL ? 'right' : 'left', marginTop: 4 }}>{t('explore.map_desc')}</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
const styles = {
  recentSection: { padding: 24 }
};
