import React, { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
  Alert,
  FlatList,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from '../components/Common/MapView';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, Filter, Crosshair, MapPin } from 'lucide-react-native';
import { listingService } from '../services/api';
import { COLORS } from '../styles/colors';
import { Image } from 'expo-image';
import { ListingCard } from '../components/ListingCard';

const { width, height } = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export default function MapScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const params = useLocalSearchParams();

  const [region, setRegion] = useState({
    latitude: params.initialLat ? Number(params.initialLat) : 33.5138,
    longitude: params.initialLng ? Number(params.initialLng) : 36.2765,
    latitudeDelta: params.initialLat ? 0.01 : LATITUDE_DELTA,
    longitudeDelta: params.initialLat ? 0.01 * ASPECT_RATIO : LONGITUDE_DELTA,
  });

  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const manualScrollRef = useRef(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');

      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        setRegion({
          ...region,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }

      fetchListings();
    })();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const data = await listingService.getListings();
      const validListings = data.items.filter(l => l.latitude && l.longitude);
      setListings(validListings);
    } catch (error) {
      console.error('Error fetching listings for map:', error);
    } finally {
      setLoading(false);
    }
  };

  const centerOnUser = async () => {
    if (!locationPermission) {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      setLocationPermission(true);
    }

    let location = await Location.getCurrentPositionAsync({});
    mapRef.current?.animateToRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01 * ASPECT_RATIO,
    });
  };

  const onMarkerPress = (listing: any, index: number) => {
    setSelectedId(listing.id);
    manualScrollRef.current = true;
    flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });

    mapRef.current?.animateToRegion({
      latitude: Number(listing.latitude),
      longitude: Number(listing.longitude),
      latitudeDelta: 0.01,
      longitudeDelta: 0.01 * ASPECT_RATIO,
    });

    setTimeout(() => {
      manualScrollRef.current = false;
    }, 1000);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (manualScrollRef.current) return;

    if (viewableItems.length > 0) {
      const item = viewableItems[0].item;
      if (item.id !== selectedId) {
         setSelectedId(item.id);
         mapRef.current?.animateToRegion({
           latitude: Number(item.latitude),
           longitude: Number(item.longitude),
           latitudeDelta: 0.01,
           longitudeDelta: 0.01 * ASPECT_RATIO,
         });
      }
    }
  }).current;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {listings.map((listing, index) => (
          <Marker
            key={listing.id}
            coordinate={{
              latitude: Number(listing.latitude),
              longitude: Number(listing.longitude),
            }}
            title={listing.title}
            description={`${listing.price} ${t('common.currency')}`}
            onPress={() => onMarkerPress(listing, index)}
          >
            <View style={styles.markerContainer}>
              <View style={[styles.markerBubble, selectedId === listing.id && styles.markerBubbleSelected]}>
                <Text style={styles.markerPrice}>
                  {listing.price >= 1000000
                    ? `${(listing.price / 1000000).toFixed(1)} ${t('common.million')}`
                    : `${(listing.price / 1000).toFixed(0)} ${t('common.thousand')}`}
                </Text>
              </View>
              <View style={[styles.markerArrow, selectedId === listing.id && styles.markerArrowSelected]} />
            </View>

            <Callout
              onPress={() => router.push(`/listing/${listing.id}`)}
              tooltip
            >
              <View style={styles.calloutContainer}>
                <View style={styles.calloutContent}>
                  <Text style={styles.calloutTitle}>{listing.title}</Text>
                  <Text style={styles.calloutPrice}>{listing.price} {t('common.currency')}</Text>
                  <View style={styles.calloutBtn}>
                    <Text style={styles.calloutBtnText}>{t('common.view_details')}</Text>
                  </View>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={COLORS.secondary} style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Search size={18} color="#94a3b8" />
          <Text style={styles.searchPlaceholder}>{t('explore.search_placeholder')}</Text>
        </View>

        <TouchableOpacity style={styles.iconBtn}>
          <Filter size={20} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.fab} onPress={centerOnUser}>
          <Crosshair size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {listings.length > 0 && (
        <View style={styles.carouselContainer}>
          <FlatList
            ref={flatListRef}
            data={listings}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={width * 0.85 + 16}
            snapToAlignment="center"
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: width * 0.075 }}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            renderItem={({ item }) => (
              <View style={{ width: width * 0.85, marginRight: 16 }}>
                <ListingCard item={item} onPress={() => router.push(`/listing/${item.id}`)} />
              </View>
            )}
            getItemLayout={(data, index) => ({
              length: width * 0.85 + 16,
              offset: (width * 0.85 + 16) * index,
              index,
            })}
          />
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
    zIndex: 10,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  searchBar: {
    flex: 1,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  searchPlaceholder: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 230,
    right: 16,
    zIndex: 10,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerBubble: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerBubbleSelected: {
    backgroundColor: COLORS.gold,
    transform: [{ scale: 1.1 }],
  },
  markerPrice: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.primary,
    marginTop: -2,
  },
  markerArrowSelected: {
    borderTopColor: COLORS.gold,
  },
  calloutContainer: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  calloutContent: {
    padding: 12,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  calloutPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  calloutBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  calloutBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    height: 180,
  },
});
