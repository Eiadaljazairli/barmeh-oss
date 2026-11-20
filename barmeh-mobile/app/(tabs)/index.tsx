import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Dimensions,
  Alert,
  StyleSheet,
  Platform,
  Modal,
  Image as RNImage,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  Search, MapPin, Bell, BellPlus, Navigation, SlidersHorizontal, Check, X, LayoutGrid, ChevronDown,
  Smartphone, Armchair, Shirt, CarFront, Home as HomeIcon, Wrench, Briefcase, Dog,
  Gamepad2, Pizza, Sparkles, Trophy, Recycle, Store, Package, Clock, Bike
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { listingService, City, ListingSummary, notificationService, savedSearchService } from '../../services/api';
import { LocationPicker } from '../../components/LocationPicker';
import { COLORS } from '../../styles/colors';
import { ListingCard } from '../../components/ListingCard';
import { ensureAbsoluteUrl } from '../../utils/url';
import { SkeletonListingCard } from '../../components/SkeletonListingCard';

import { CategoryCarousel } from '../../components/CategoryCarousel';
import { DynamicCategoryFilters, AttributeFilters } from '../../components/DynamicCategoryFilters';
import { CATEGORY_SCHEMAS } from '../../constants/categorySchemas';
import { RecentlyViewedSection } from '../../components/RecentlyViewedSection';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Redirect } from 'expo-router';

const { width } = Dimensions.get('window');

const QUICK_BRANDS: Record<string, { key: string, options: { labelAr: string, labelEn: string, value: string, image?: string }[] }> = {
  cars: {
    key: 'make',
    options: [
      { labelAr: 'هيونداي', labelEn: 'Hyundai', value: 'هيونداي'    , image: 'https://www.google.com/s2/favicons?domain=hyundai.com&sz=128' },
      { labelAr: 'كيا', labelEn: 'Kia', value: 'كيا'    , image: 'https://www.google.com/s2/favicons?domain=kia.com&sz=128' },
      { labelAr: 'تويوتا', labelEn: 'Toyota', value: 'تويوتا'    , image: 'https://www.google.com/s2/favicons?domain=toyota.com&sz=128' },
      { labelAr: 'مازدا', labelEn: 'Mazda', value: 'مازدا'    , image: 'https://www.google.com/s2/favicons?domain=mazda.com&sz=128' },
      { labelAr: 'بي واي دي', labelEn: 'BYD', value: 'بي واي دي'    , image: 'https://www.google.com/s2/favicons?domain=byd.com&sz=128' },
      { labelAr: 'سوزوكي', labelEn: 'Suzuki', value: 'سوزوكي'    , image: 'https://www.google.com/s2/favicons?domain=suzuki.com&sz=128' },
      { labelAr: 'شيفروليه', labelEn: 'Chevrolet', value: 'شيفروليه'    , image: 'https://www.google.com/s2/favicons?domain=chevrolet.com&sz=128' },
      { labelAr: 'بيجو', labelEn: 'Peugeot', value: 'بيجو'    , image: 'https://www.google.com/s2/favicons?domain=peugeot.com&sz=128' },
      { labelAr: 'ميتسوبيشي', labelEn: 'Mitsubishi', value: 'ميتسوبيشي'    , image: 'https://www.google.com/s2/favicons?domain=mitsubishicars.com&sz=128' },
      { labelAr: 'نيسان', labelEn: 'Nissan', value: 'نيسان'    , image: 'https://www.google.com/s2/favicons?domain=nissan.com&sz=128' },
      { labelAr: 'هوندا', labelEn: 'Honda', value: 'هوندا'    , image: 'https://www.google.com/s2/favicons?domain=honda.com&sz=128' },
      { labelAr: 'فولكس فاجن', labelEn: 'Volkswagen', value: 'فولكس فاجن'    , image: 'https://www.google.com/s2/favicons?domain=vw.com&sz=128' },
      { labelAr: 'رينو', labelEn: 'Renault', value: 'رينو'    , image: 'https://www.google.com/s2/favicons?domain=renault.com&sz=128' },
      { labelAr: 'شانجان', labelEn: 'Changan', value: 'شانجان'    , image: 'https://www.google.com/s2/favicons?domain=globalchangan.com&sz=128' },
      { labelAr: 'جيلي', labelEn: 'Geely', value: 'جيلي'    , image: 'https://www.google.com/s2/favicons?domain=global.geely.com&sz=128' },
      { labelAr: 'شيري', labelEn: 'Chery', value: 'شيري'    , image: 'https://icon.horse/icon/cheryinternational.com' },
      { labelAr: 'إم جي', labelEn: 'MG', value: 'ام جي'    , image: 'https://www.google.com/s2/favicons?domain=mg.co.uk&sz=128' },
      { labelAr: 'مرسيدس', labelEn: 'Mercedes', value: 'مرسيدس'    , image: 'https://www.google.com/s2/favicons?domain=mercedes-benz.com&sz=128' },
      { labelAr: 'بي إم دبليو', labelEn: 'BMW', value: 'بي ام دبليو'    , image: 'https://www.google.com/s2/favicons?domain=bmw.com&sz=128' },
      { labelAr: 'أودي', labelEn: 'Audi', value: 'اودي'    , image: 'https://www.google.com/s2/favicons?domain=audi.com&sz=128' },
      { labelAr: 'لكزس', labelEn: 'Lexus', value: 'لكزس'    , image: 'https://www.google.com/s2/favicons?domain=lexus.com&sz=128' },
      { labelAr: 'فورد', labelEn: 'Ford', value: 'فورد'    , image: 'https://www.google.com/s2/favicons?domain=ford.com&sz=128' },
      { labelAr: 'جيب', labelEn: 'Jeep', value: 'جيب'    , image: 'https://www.google.com/s2/favicons?domain=jeep.com&sz=128' },
      { labelAr: 'لاند روفر', labelEn: 'Land Rover', value: 'لاند روفر'    , image: 'https://www.google.com/s2/favicons?domain=landrover.com&sz=128' },
      { labelAr: 'جي إم سي', labelEn: 'GMC', value: 'جي ام سي'    , image: 'https://www.google.com/s2/favicons?domain=gmc.com&sz=128' },
      { labelAr: 'دودج', labelEn: 'Dodge', value: 'دودج'    , image: 'https://www.google.com/s2/favicons?domain=dodge.com&sz=128' },
      { labelAr: 'فيات', labelEn: 'Fiat', value: 'فيات'    , image: 'https://www.google.com/s2/favicons?domain=fiat.com&sz=128' },
      { labelAr: 'ألفا روميو', labelEn: 'Alfa Romeo', value: 'الفا روميو'    , image: 'https://www.google.com/s2/favicons?domain=alfaromeo.com&sz=128' },
      { labelAr: 'ميني', labelEn: 'Mini', value: 'ميني'    , image: 'https://www.google.com/s2/favicons?domain=miniusa.com&sz=128' },
      { labelAr: 'كاديلاك', labelEn: 'Cadillac', value: 'كاديلاك'    , image: 'https://www.google.com/s2/favicons?domain=cadillacarabia.com&sz=128' },
      { labelAr: 'لينكولن', labelEn: 'Lincoln', value: 'لينكولن'    , image: 'https://www.google.com/s2/favicons?domain=lincoln.com&sz=128' },
      { labelAr: 'إنفينيتي', labelEn: 'Infiniti', value: 'انفينيتي'    , image: 'https://www.google.com/s2/favicons?domain=infiniti.com&sz=128' },
      { labelAr: 'أكورا', labelEn: 'Acura', value: 'اكورا'    , image: 'https://www.google.com/s2/favicons?domain=acura.com&sz=128' },
      { labelAr: 'تسلا', labelEn: 'Tesla', value: 'تسلا'    , image: 'https://www.google.com/s2/favicons?domain=tesla.com&sz=128' },
      { labelAr: 'بورش', labelEn: 'Porsche', value: 'بورش'    , image: 'https://www.google.com/s2/favicons?domain=porsche.com&sz=128' },
      { labelAr: 'فيراري', labelEn: 'Ferrari', value: 'فيراري'    , image: 'https://www.google.com/s2/favicons?domain=ferrari.com&sz=128' },
      { labelAr: 'لامبورغيني', labelEn: 'Lamborghini', value: 'لامبورغيني'    , image: 'https://www.google.com/s2/favicons?domain=lamborghini.com&sz=128' },
      { labelAr: 'مازيراتي', labelEn: 'Maserati', value: 'مازيراتي'    , image: 'https://www.google.com/s2/favicons?domain=maserati.com&sz=128' },
      { labelAr: 'أستون مارتن', labelEn: 'Aston Martin', value: 'استون مارتن'    , image: 'https://www.google.com/s2/favicons?domain=astonmartin.com&sz=128' },
      { labelAr: 'بنتلي', labelEn: 'Bentley', value: 'بنتلي'    , image: 'https://www.google.com/s2/favicons?domain=bentleymotors.com&sz=128' },
      { labelAr: 'رولز رويس', labelEn: 'Rolls Royce', value: 'رولز رويس'    , image: 'https://www.google.com/s2/favicons?domain=rolls-roycemotorcars.com&sz=128' }
    ]
  },
  'cars-parts': {
    key: 'condition',
    options: [
      { labelAr: 'جديدة', labelEn: 'New', value: 'new' },
      { labelAr: 'أصلية', labelEn: 'Original', value: 'original' },
      { labelAr: 'مستعملة', labelEn: 'Used', value: 'used' },
      { labelAr: 'تجارية', labelEn: 'Aftermarket', value: 'aftermarket' },
      { labelAr: 'سكراب', labelEn: 'Scrap', value: 'scrap' }
    ]
  },
  'cars-maintenance': {
    key: 'service_type',
    options: [
      { labelAr: 'غيار زيت', labelEn: 'Oil Change', value: 'غيار زيت' },
      { labelAr: 'فلاتر', labelEn: 'Filters', value: 'فلاتر' },
      { labelAr: 'ميكانيك', labelEn: 'Mechanic', value: 'ميكانيك' },
      { labelAr: 'كهرباء', labelEn: 'Electrical', value: 'كهرباء' },
      { labelAr: 'تكييف', labelEn: 'AC', value: 'تكييف' },
      { labelAr: 'دوزان', labelEn: 'Alignment', value: 'دوزان' },
      { labelAr: 'ميزان', labelEn: 'Wheel Balance', value: 'ميزان' },
      { labelAr: 'بخ', labelEn: 'Paint', value: 'بخ' },
      { labelAr: 'حدادة', labelEn: 'Body', value: 'حدادة' },
      { labelAr: 'غسيل', labelEn: 'Wash', value: 'غسيل' },
      { labelAr: 'بوليش', labelEn: 'Polish', value: 'بوليش' },
      { labelAr: 'فحص كمبيوتر', labelEn: 'Diagnostics', value: 'فحص كمبيوتر' }
    ]
  },
  'cars-tires': {
    key: 'brand',
    options: [
      { labelAr: 'ميشلان', labelEn: 'Michelin', value: 'ميشلان'    , image: 'https://www.google.com/s2/favicons?domain=michelin.com&sz=128' },
      { labelAr: 'بريدجستون', labelEn: 'Bridgestone', value: 'بريدجستون'    , image: 'https://www.google.com/s2/favicons?domain=bridgestonetire.com&sz=128' },
      { labelAr: 'هانكوك', labelEn: 'Hankook', value: 'هانكوك'    , image: 'https://www.google.com/s2/favicons?domain=hankooktire.com&sz=128' },
      { labelAr: 'غوديير', labelEn: 'Goodyear', value: 'غوديير'    , image: 'https://www.google.com/s2/favicons?domain=goodyear.com&sz=128' },
      { labelAr: 'كونتيننتال', labelEn: 'Continental', value: 'كونتيننتال'    , image: 'https://www.google.com/s2/favicons?domain=continental.com&sz=128' },
      { labelAr: 'بيريلي', labelEn: 'Pirelli', value: 'بيريلي'    , image: 'https://www.google.com/s2/favicons?domain=pirelli.com&sz=128' },
      { labelAr: 'يوكوهاما', labelEn: 'Yokohama', value: 'يوكوهاما'    , image: 'https://www.google.com/s2/favicons?domain=yokohamatire.com&sz=128' },
      { labelAr: 'دانلوب', labelEn: 'Dunlop', value: 'دانلوب'    , image: 'https://www.google.com/s2/favicons?domain=dunloptires.com&sz=128' },
      { labelAr: 'تويو', labelEn: 'Toyo', value: 'تويو'    , image: 'https://www.google.com/s2/favicons?domain=toyotires.com&sz=128' },
      { labelAr: 'كومهو', labelEn: 'Kumho', value: 'كومهو'    , image: 'https://www.google.com/s2/favicons?domain=kumhotire.com&sz=128' },
      { labelAr: 'ماكسيس', labelEn: 'Maxxis', value: 'ماكسيس'    , image: 'https://www.google.com/s2/favicons?domain=maxxis.com&sz=128' },
      { labelAr: 'نكسن', labelEn: 'Nexen', value: 'نكسن'    , image: 'https://www.google.com/s2/favicons?domain=nexentire.com&sz=128' },
      { labelAr: 'فالكن', labelEn: 'Falken', value: 'فالكن'    , image: 'https://www.google.com/s2/favicons?domain=falkentire.com&sz=128' },
      { labelAr: 'كوبر', labelEn: 'Cooper', value: 'كوبر'    , image: 'https://www.google.com/s2/favicons?domain=us.coopertire.com&sz=128' }
    ]
  },
  'cars-bikes': {
    key: 'make',
    options: [
      { labelAr: 'هوندا', labelEn: 'Honda', value: 'هوندا'    , image: 'https://www.google.com/s2/favicons?domain=honda.com&sz=128' },
      { labelAr: 'ياماها', labelEn: 'Yamaha', value: 'ياماها'    , image: 'https://www.google.com/s2/favicons?domain=yamahamotorsports.com&sz=128' },
      { labelAr: 'سوزوكي', labelEn: 'Suzuki', value: 'سوزوكي'    , image: 'https://www.google.com/s2/favicons?domain=suzuki.com&sz=128' },
      { labelAr: 'كاواساكي', labelEn: 'Kawasaki', value: 'كاواساكي'    , image: 'https://www.google.com/s2/favicons?domain=kawasaki.com&sz=128' },
      { labelAr: 'بي إم دبليو', labelEn: 'BMW', value: 'بي ام دبليو'    , image: 'https://www.google.com/s2/favicons?domain=bmw.com&sz=128' },
      { labelAr: 'دوكاتي', labelEn: 'Ducati', value: 'دوكاتي'    , image: 'https://www.google.com/s2/favicons?domain=ducati.com&sz=128' },
      { labelAr: 'هارلي ديفيدسون', labelEn: 'Harley-Davidson', value: 'هارلي'    , image: 'https://www.google.com/s2/favicons?domain=harley-davidson.com&sz=128' },
      { labelAr: 'كي تي إم', labelEn: 'KTM', value: 'كي تي ام'    , image: 'https://www.google.com/s2/favicons?domain=ktm.com&sz=128' },
      { labelAr: 'أبريليا', labelEn: 'Aprilia', value: 'ابريليا'    , image: 'https://www.google.com/s2/favicons?domain=aprilia.com&sz=128' },
      { labelAr: 'فيسبا', labelEn: 'Vespa', value: 'فيسبا'    , image: 'https://www.google.com/s2/favicons?domain=vespa.com&sz=128' },
      { labelAr: 'سيم', labelEn: 'SYM', value: 'سيم'    , image: 'https://www.google.com/s2/favicons?domain=sym-global.com&sz=128' },
      { labelAr: 'بياجيو', labelEn: 'Piaggio', value: 'بياجيو'    , image: 'https://www.google.com/s2/favicons?domain=piaggio.com&sz=128' },
      { labelAr: 'كيواي', labelEn: 'Keeway', value: 'كيواي'    , image: 'https://www.google.com/s2/favicons?domain=keeway.com&sz=128' },
      { labelAr: 'باجاج', labelEn: 'Bajaj', value: 'باجاج'    , image: 'https://www.google.com/s2/favicons?domain=bajajauto.com&sz=128' },
      { labelAr: 'بينلي', labelEn: 'Benelli', value: 'بينلي'    , image: 'https://www.google.com/s2/favicons?domain=benelli.com&sz=128' }
    ]
  },
  mobiles: {
    key: 'brand',
    options: [
      { labelAr: 'سامسونج', labelEn: 'Samsung', value: 'سامسونج'    , image: 'https://www.google.com/s2/favicons?domain=samsung.com&sz=128' },
      { labelAr: 'شاومي', labelEn: 'Xiaomi', value: 'شاومي'    , image: 'https://www.google.com/s2/favicons?domain=mi.com&sz=128' },
      { labelAr: 'إنفينيكس', labelEn: 'Infinix', value: 'انفينيكس'    , image: 'https://www.google.com/s2/favicons?domain=infinixmobility.com&sz=128' },
      { labelAr: 'تكنو', labelEn: 'Tecno', value: 'تكنو'    , image: 'https://www.google.com/s2/favicons?domain=tecno-mobile.com&sz=128' },
      { labelAr: 'آبل', labelEn: 'Apple', value: 'آبل'    , image: 'https://www.google.com/s2/favicons?domain=apple.com&sz=128' },
      { labelAr: 'هواوي', labelEn: 'Huawei', value: 'هواوي'    , image: 'https://www.google.com/s2/favicons?domain=huawei.com&sz=128' },
      { labelAr: 'ريلمي', labelEn: 'Realme', value: 'ريلمي'    , image: 'https://www.google.com/s2/favicons?domain=realme.com&sz=128' },
      { labelAr: 'هونر', labelEn: 'Honor', value: 'هونر'    , image: 'https://www.google.com/s2/favicons?domain=hihonor.com&sz=128' },
      { labelAr: 'بوكو', labelEn: 'Poco', value: 'بوكو'    , image: 'https://www.google.com/s2/favicons?domain=po.co&sz=128' },
      { labelAr: 'أوبو', labelEn: 'Oppo', value: 'اوبو'    , image: 'https://www.google.com/s2/favicons?domain=oppo.com&sz=128' },
      { labelAr: 'فيفو', labelEn: 'Vivo', value: 'فيفو'    , image: 'https://www.google.com/s2/favicons?domain=vivo.com&sz=128' },
      { labelAr: 'ون بلس', labelEn: 'OnePlus', value: 'ون بلس'    , image: 'https://www.google.com/s2/favicons?domain=oneplus.com&sz=128' },
      { labelAr: 'نوكيا', labelEn: 'Nokia', value: 'نوكيا'    , image: 'https://www.google.com/s2/favicons?domain=nokia.com&sz=128' },
      { labelAr: 'جوجل', labelEn: 'Google', value: 'جوجل'    , image: 'https://www.google.com/s2/favicons?domain=google.com&sz=128' },
      { labelAr: 'موتورولا', labelEn: 'Motorola', value: 'موتورولا'    , image: 'https://www.google.com/s2/favicons?domain=motorola.com&sz=128' },
      { labelAr: 'سوني', labelEn: 'Sony', value: 'سوني'    , image: 'https://www.google.com/s2/favicons?domain=sony.com&sz=128' },
      { labelAr: 'أسوس', labelEn: 'Asus', value: 'اسوس'    , image: 'https://www.google.com/s2/favicons?domain=asus.com&sz=128' },
      { labelAr: 'لينوفو', labelEn: 'Lenovo', value: 'لينوفو'    , image: 'https://www.google.com/s2/favicons?domain=lenovo.com&sz=128' },
      { labelAr: 'زد تي إي', labelEn: 'ZTE', value: 'زد تي اي'    , image: 'https://www.google.com/s2/favicons?domain=ztedevices.com&sz=128' },
      { labelAr: 'بلاك بيري', labelEn: 'BlackBerry', value: 'بلاك بيري'    , image: 'https://www.google.com/s2/favicons?domain=blackberry.com&sz=128' },
      { labelAr: 'ألكاتيل', labelEn: 'Alcatel', value: 'الكاتيل'    , image: 'https://www.google.com/s2/favicons?domain=alcatelmobile.com&sz=128' }
    ]
  },
  'mobiles-accessories': {
    key: 'type',
    options: [
      { labelAr: 'شاحن', labelEn: 'Charger', value: 'شاحن' },
      { labelAr: 'كبل', labelEn: 'Cable', value: 'كبل' },
      { labelAr: 'سماعات', labelEn: 'Headphones', value: 'سماعات' },
      { labelAr: 'غطاء', labelEn: 'Cover', value: 'غطاء' },
      { labelAr: 'كفر', labelEn: 'Case', value: 'كفر' },
      { labelAr: 'حماية شاشة', labelEn: 'Screen Protector', value: 'حماية' },
      { labelAr: 'ساعة ذكية', labelEn: 'Smart Watch', value: 'ساعة' },
      { labelAr: 'باور بانك', labelEn: 'Power Bank', value: 'باور بانك' },
      { labelAr: 'قاعدة سيارة', labelEn: 'Car Mount', value: 'قاعدة' },
      { labelAr: 'مسكة موبايل', labelEn: 'Phone Grip', value: 'مسكة' },
      { labelAr: 'ذاكرة', labelEn: 'Memory', value: 'ذاكرة' },
      { labelAr: 'بطارية', labelEn: 'Battery', value: 'بطارية' },
      { labelAr: 'فلاشة', labelEn: 'Flash Drive', value: 'فلاشة' }
    ]
  },
  electronics: {
    key: 'brand',
    options: [
      { labelAr: 'سامسونج', labelEn: 'Samsung', value: 'سامسونج'    , image: 'https://www.google.com/s2/favicons?domain=samsung.com&sz=128' },
      { labelAr: 'إل جي', labelEn: 'LG', value: 'ال جي'    , image: 'https://www.google.com/s2/favicons?domain=lg.com&sz=128' },
      { labelAr: 'سوني', labelEn: 'Sony', value: 'سوني'    , image: 'https://www.google.com/s2/favicons?domain=sony.com&sz=128' },
      { labelAr: 'باناسونيك', labelEn: 'Panasonic', value: 'باناسونيك'    , image: 'https://www.google.com/s2/favicons?domain=panasonic.com&sz=128' },
      { labelAr: 'توشيبا', labelEn: 'Toshiba', value: 'توشيبا'    , image: 'https://www.google.com/s2/favicons?domain=toshiba.com&sz=128' },
      { labelAr: 'شارب', labelEn: 'Sharp', value: 'شارب'    , image: 'https://www.google.com/s2/favicons?domain=sharp.com&sz=128' },
      { labelAr: 'آبل', labelEn: 'Apple', value: 'آبل'    , image: 'https://www.google.com/s2/favicons?domain=apple.com&sz=128' },
      { labelAr: 'هواوي', labelEn: 'Huawei', value: 'هواوي'    , image: 'https://www.google.com/s2/favicons?domain=huawei.com&sz=128' },
      { labelAr: 'هايسنس', labelEn: 'Hisense', value: 'هايسنس'    , image: 'https://www.google.com/s2/favicons?domain=hisense.com&sz=128' },
      { labelAr: 'تي سي إل', labelEn: 'TCL', value: 'تي سي ال'    , image: 'https://www.google.com/s2/favicons?domain=tcl.com&sz=128' },
      { labelAr: 'فيليبس', labelEn: 'Philips', value: 'فيليبس'    , image: 'https://www.google.com/s2/favicons?domain=philips.com&sz=128' },
      { labelAr: 'بوس', labelEn: 'Bose', value: 'بوس'    , image: 'https://www.google.com/s2/favicons?domain=bose.com&sz=128' },
      { labelAr: 'جي بي إل', labelEn: 'JBL', value: 'جي بي ال'    , image: 'https://www.google.com/s2/favicons?domain=jbl.com&sz=128' },
      { labelAr: 'ياماها', labelEn: 'Yamaha', value: 'ياماها'    , image: 'https://www.google.com/s2/favicons?domain=yamahamotorsports.com&sz=128' },
      { labelAr: 'بايونير', labelEn: 'Pioneer', value: 'بايونير'    , image: 'https://www.google.com/s2/favicons?domain=pioneer.com&sz=128' },
      { labelAr: 'كينوود', labelEn: 'Kenwood', value: 'كينوود'    , image: 'https://www.google.com/s2/favicons?domain=kenwood.com&sz=128' },
      { labelAr: 'نيكاي', labelEn: 'Nikai', value: 'نيكاي'  },
      { labelAr: 'دانسات', labelEn: 'Dansat', value: 'دانسات'  }
    ]
  },
  'electronics-laptops': {
    key: 'brand',
    options: [
      { labelAr: 'آبل', labelEn: 'Apple', value: 'آبل'    , image: 'https://www.google.com/s2/favicons?domain=apple.com&sz=128' },
      { labelAr: 'إتش بي', labelEn: 'HP', value: 'اتش بي' },
      { labelAr: 'ديل', labelEn: 'Dell', value: 'ديل'    , image: 'https://www.google.com/s2/favicons?domain=dell.com&sz=128' },
      { labelAr: 'لينوفو', labelEn: 'Lenovo', value: 'لينوفو'    , image: 'https://www.google.com/s2/favicons?domain=lenovo.com&sz=128' },
      { labelAr: 'أسوس', labelEn: 'Asus', value: 'اسوس'    , image: 'https://www.google.com/s2/favicons?domain=asus.com&sz=128' },
      { labelAr: 'أيسر', labelEn: 'Acer', value: 'ايسر'    , image: 'https://www.google.com/s2/favicons?domain=acer.com&sz=128' },
      { labelAr: 'إم إس آي', labelEn: 'MSI', value: 'ام اس اي'    , image: 'https://www.google.com/s2/favicons?domain=msi.com&sz=128' },
      { labelAr: 'هواوي', labelEn: 'Huawei', value: 'هواوي'    , image: 'https://www.google.com/s2/favicons?domain=huawei.com&sz=128' },
      { labelAr: 'مايكروسوفت', labelEn: 'Microsoft', value: 'مايكروسوفت'    , image: 'https://www.google.com/s2/favicons?domain=microsoft.com&sz=128' },
      { labelAr: 'سامسونج', labelEn: 'Samsung', value: 'سامسونج'    , image: 'https://www.google.com/s2/favicons?domain=samsung.com&sz=128' },
      { labelAr: 'توشيبا', labelEn: 'Toshiba', value: 'توشيبا'    , image: 'https://www.google.com/s2/favicons?domain=toshiba.com&sz=128' },
      { labelAr: 'سوني', labelEn: 'Sony', value: 'سوني'    , image: 'https://www.google.com/s2/favicons?domain=sony.com&sz=128' },
      { labelAr: 'ريزر', labelEn: 'Razer', value: 'ريزر'    , image: 'https://www.google.com/s2/favicons?domain=razer.com&sz=128' },
      { labelAr: 'ألين وير', labelEn: 'Alienware', value: 'الين وير'    , image: 'https://www.google.com/s2/favicons?domain=alienware.com&sz=128' }
    ]
  },
  'electronics-tablets': {
    key: 'brand',
    options: [
      { labelAr: 'آيباد', labelEn: 'iPad', value: 'آبل'    , image: 'https://www.google.com/s2/favicons?domain=apple.com&sz=128' },
      { labelAr: 'سامسونج', labelEn: 'Samsung', value: 'سامسونج'    , image: 'https://www.google.com/s2/favicons?domain=samsung.com&sz=128' },
      { labelAr: 'لينوفو', labelEn: 'Lenovo', value: 'لينوفو'    , image: 'https://www.google.com/s2/favicons?domain=lenovo.com&sz=128' },
      { labelAr: 'هواوي', labelEn: 'Huawei', value: 'هواوي'    , image: 'https://www.google.com/s2/favicons?domain=huawei.com&sz=128' },
      { labelAr: 'شاومي', labelEn: 'Xiaomi', value: 'شاومي'    , image: 'https://www.google.com/s2/favicons?domain=mi.com&sz=128' },
      { labelAr: 'مايكروسوفت', labelEn: 'Microsoft', value: 'مايكروسوفت'    , image: 'https://www.google.com/s2/favicons?domain=microsoft.com&sz=128' },
      { labelAr: 'أمازون', labelEn: 'Amazon', value: 'امازون'    , image: 'https://www.google.com/s2/favicons?domain=amazon.com&sz=128' },
      { labelAr: 'ألكاتيل', labelEn: 'Alcatel', value: 'الكاتيل'    , image: 'https://www.google.com/s2/favicons?domain=alcatelmobile.com&sz=128' },
      { labelAr: 'أسوس', labelEn: 'Asus', value: 'اسوس'    , image: 'https://www.google.com/s2/favicons?domain=asus.com&sz=128' },
      { labelAr: 'تيكلاست', labelEn: 'Teclast', value: 'تيكلاست'    , image: 'https://www.google.com/s2/favicons?domain=teclast.com&sz=128' }
    ]
  },
  realestate: {
    key: 'property_type',
    options: [
      { labelAr: 'شقة', labelEn: 'Apartment', value: 'apartment' },
      { labelAr: 'فيلا', labelEn: 'Villa', value: 'villa' },
      { labelAr: 'قصر', labelEn: 'Palace', value: 'palace' },
      { labelAr: 'منزل مستقل', labelEn: 'Independent House', value: 'independent' },
      { labelAr: 'مكتب', labelEn: 'Office', value: 'office' },
      { labelAr: 'محل تجاري', labelEn: 'Shop', value: 'shop' },
      { labelAr: 'أرض', labelEn: 'Land', value: 'land' },
      { labelAr: 'شاليه', labelEn: 'Chalet', value: 'chalet' },
      { labelAr: 'مصيف', labelEn: 'Summer House', value: 'summer_house' },
      { labelAr: 'مستودع', labelEn: 'Warehouse', value: 'warehouse' },
      { labelAr: 'مزرعة', labelEn: 'Farm', value: 'farm' },
      { labelAr: 'استديو', labelEn: 'Studio', value: 'studio' },
      { labelAr: 'عمارة', labelEn: 'Building', value: 'building' },
      { labelAr: 'بناء كامل', labelEn: 'Whole Building', value: 'whole_building' }
    ]
  },
  'realestate-land': {
    key: 'land_type',
    options: [
      { labelAr: 'زراعية', labelEn: 'Agricultural', value: 'agricultural' },
      { labelAr: 'سكنية', labelEn: 'Residential', value: 'residential' },
      { labelAr: 'تجارية', labelEn: 'Commercial', value: 'commercial' },
      { labelAr: 'صناعية', labelEn: 'Industrial', value: 'industrial' },
      { labelAr: 'استثمارية', labelEn: 'Investment', value: 'investment' }
    ]
  },
  furniture: {
    key: 'type',
    options: [
      { labelAr: 'غرف نوم', labelEn: 'Bedrooms', value: 'غرف نوم' },
      { labelAr: 'طقم كنب', labelEn: 'Sofas', value: 'طقم كنب' },
      { labelAr: 'طاولات', labelEn: 'Tables', value: 'طاولات' },
      { labelAr: 'كراسي', labelEn: 'Chairs', value: 'كراسي' },
      { labelAr: 'سجاد', labelEn: 'Rugs', value: 'سجاد' },
      { labelAr: 'موكيت', labelEn: 'Carpets', value: 'موكيت' },
      { labelAr: 'ستائر', labelEn: 'Curtains', value: 'ستائر' },
      { labelAr: 'مكاتب', labelEn: 'Desks', value: 'مكاتب' },
      { labelAr: 'ديكور', labelEn: 'Decor', value: 'ديكور' },
      { labelAr: 'إنارة', labelEn: 'Lighting', value: 'إنارة' },
      { labelAr: 'تحف', labelEn: 'Antiques', value: 'تحف' },
      { labelAr: 'خزائن', labelEn: 'Cabinets', value: 'خزائن' },
      { labelAr: 'أسرة', labelEn: 'Beds', value: 'أسرة' },
      { labelAr: 'مرايا', labelEn: 'Mirrors', value: 'مرايا' }
    ]
  },
  'furniture-appliances': {
    key: 'brand',
    options: [
      { labelAr: 'سامسونج', labelEn: 'Samsung', value: 'سامسونج'    , image: 'https://www.google.com/s2/favicons?domain=samsung.com&sz=128' },
      { labelAr: 'إل جي', labelEn: 'LG', value: 'ال جي'    , image: 'https://www.google.com/s2/favicons?domain=lg.com&sz=128' },
      { labelAr: 'بوش', labelEn: 'Bosch', value: 'بوش'    , image: 'https://www.google.com/s2/favicons?domain=bosch.com&sz=128' },
      { labelAr: 'بيكو', labelEn: 'Beko', value: 'بيكو'    , image: 'https://www.google.com/s2/favicons?domain=beko.com&sz=128' },
      { labelAr: 'ويرلبول', labelEn: 'Whirlpool', value: 'ويرلبول'    , image: 'https://www.google.com/s2/favicons?domain=whirlpool.com&sz=128' },
      { labelAr: 'هاير', labelEn: 'Haier', value: 'هاير'    , image: 'https://www.google.com/s2/favicons?domain=haier.com&sz=128' },
      { labelAr: 'ميديا', labelEn: 'Midea', value: 'ميديا'    , image: 'https://www.google.com/s2/favicons?domain=midea.com&sz=128' },
      { labelAr: 'الكترولوكس', labelEn: 'Electrolux', value: 'الكترولوكس'    , image: 'https://www.google.com/s2/favicons?domain=electrolux.com&sz=128' },
      { labelAr: 'سيمنز', labelEn: 'Siemens', value: 'سيمنز'    , image: 'https://www.google.com/s2/favicons?domain=siemens.com&sz=128' },
      { labelAr: 'باناسونيك', labelEn: 'Panasonic', value: 'باناسونيك'    , image: 'https://www.google.com/s2/favicons?domain=panasonic.com&sz=128' },
      { labelAr: 'أريستون', labelEn: 'Ariston', value: 'اريستون'    , image: 'https://www.google.com/s2/favicons?domain=ariston.com&sz=128' },
      { labelAr: 'توشيبا', labelEn: 'Toshiba', value: 'توشيبا'    , image: 'https://www.google.com/s2/favicons?domain=toshiba.com&sz=128' },
      { labelAr: 'دايو', labelEn: 'Daewoo', value: 'دايو'    , image: 'https://www.google.com/s2/favicons?domain=daewoo.com&sz=128' },
      { labelAr: 'هوماكس', labelEn: 'Humax', value: 'هوماكس'    , image: 'https://www.google.com/s2/favicons?domain=humaxdigital.com&sz=128' },
      { labelAr: 'فريجيدير', labelEn: 'Frigidaire', value: 'فريجيدير'    , image: 'https://www.google.com/s2/favicons?domain=frigidaire.com&sz=128' },
      { labelAr: 'جنرال إلكتريك', labelEn: 'GE', value: 'جنرال'    , image: 'https://www.google.com/s2/favicons?domain=geappliances.com&sz=128' },
      { labelAr: 'كلفينيتور', labelEn: 'Kelvinator', value: 'كلفينيتور'    , image: 'https://www.google.com/s2/favicons?domain=kelvinator.com&sz=128' }
    ]
  },
  clothing: {
    key: 'brand',
    options: [
      { labelAr: 'إل سي وايكيكي', labelEn: 'LC Waikiki', value: 'ال سي وايكيكي'    , image: 'https://www.google.com/s2/favicons?domain=lcwaikiki.com&sz=128' },
      { labelAr: 'شي إن', labelEn: 'Shein', value: 'شي ان'    , image: 'https://www.google.com/s2/favicons?domain=shein.com&sz=128' },
      { labelAr: 'نايك', labelEn: 'Nike', value: 'نايك'    , image: 'https://www.google.com/s2/favicons?domain=nike.com&sz=128' },
      { labelAr: 'أديداس', labelEn: 'Adidas', value: 'اديداس'    , image: 'https://www.google.com/s2/favicons?domain=adidas.com&sz=128' },
      { labelAr: 'بوما', labelEn: 'Puma', value: 'بوما'    , image: 'https://www.google.com/s2/favicons?domain=puma.com&sz=128' },
      { labelAr: 'زارا', labelEn: 'Zara', value: 'زارا'    , image: 'https://www.google.com/s2/favicons?domain=zara.com&sz=128' },
      { labelAr: 'إتش آند إم', labelEn: 'H&M', value: 'اتش اند ام'    , image: 'https://www.google.com/s2/favicons?domain=hm.com&sz=128' },
      { labelAr: 'مانجو', labelEn: 'Mango', value: 'مانجو'    , image: 'https://www.google.com/s2/favicons?domain=mango.com&sz=128' },
      { labelAr: 'كالفن كلاين', labelEn: 'Calvin Klein', value: 'كالفن كلاين'    , image: 'https://www.google.com/s2/favicons?domain=calvinklein.com&sz=128' },
      { labelAr: 'تومي هيلفيغر', labelEn: 'Tommy Hilfiger', value: 'تومي'    , image: 'https://www.google.com/s2/favicons?domain=tommy.com&sz=128' },
      { labelAr: 'بولو رالف لورين', labelEn: 'Polo', value: 'بولو'    , image: 'https://www.google.com/s2/favicons?domain=ralphlauren.com&sz=128' },
      { labelAr: 'نكست', labelEn: 'Next', value: 'نكست'    , image: 'https://www.google.com/s2/favicons?domain=next.co.uk&sz=128' },
      { labelAr: 'أولد نافي', labelEn: 'Old Navy', value: 'اولد نافي'    , image: 'https://www.google.com/s2/favicons?domain=oldnavy.com&sz=128' },
      { labelAr: 'ريبوك', labelEn: 'Reebok', value: 'ريبوك'    , image: 'https://www.google.com/s2/favicons?domain=reebok.com&sz=128' },
      { labelAr: 'غوتشي', labelEn: 'Gucci', value: 'غوتشي'    , image: 'https://www.google.com/s2/favicons?domain=gucci.com&sz=128' },
      { labelAr: 'ديور', labelEn: 'Dior', value: 'ديور'    , image: 'https://www.google.com/s2/favicons?domain=dior.com&sz=128' },
      { labelAr: 'شانيل', labelEn: 'Chanel', value: 'شانيل'    , image: 'https://www.google.com/s2/favicons?domain=chanel.com&sz=128' },
      { labelAr: 'لويس فيتون', labelEn: 'Louis Vuitton', value: 'لويس فيتون'    , image: 'https://www.google.com/s2/favicons?domain=louisvuitton.com&sz=128' },
      { labelAr: 'فالنتينو', labelEn: 'Valentino', value: 'فالنتينو'    , image: 'https://www.google.com/s2/favicons?domain=valentino.com&sz=128' },
      { labelAr: 'برادا', labelEn: 'Prada', value: 'برادا'    , image: 'https://www.google.com/s2/favicons?domain=prada.com&sz=128' },
      { labelAr: 'فيكتوريا سيكريت', labelEn: 'Victoria Secret', value: 'فيكتوريا'    , image: 'https://www.google.com/s2/favicons?domain=victoriassecret.com&sz=128' }
    ]
  },
  jobs: {
    key: 'job_type',
    options: [
      { labelAr: 'دوام كامل', labelEn: 'Full-time', value: 'full_time' },
      { labelAr: 'دوام جزئي', labelEn: 'Part-time', value: 'part_time' },
      { labelAr: 'عمل عن بعد', labelEn: 'Remote', value: 'remote' },
      { labelAr: 'عمل حر', labelEn: 'Freelance', value: 'freelance' },
      { labelAr: 'تدريب', labelEn: 'Internship', value: 'internship' },
      { labelAr: 'عقد مؤقت', labelEn: 'Temporary', value: 'temporary' },
      { labelAr: 'موسمي', labelEn: 'Seasonal', value: 'seasonal' }
    ]
  },
  services: {
    key: 'service_type',
    options: [
      { labelAr: 'صيانة', labelEn: 'Maintenance', value: 'صيانة' },
      { labelAr: 'تصليح', labelEn: 'Repair', value: 'تصليح' },
      { labelAr: 'تنظيف', labelEn: 'Cleaning', value: 'تنظيف' },
      { labelAr: 'مكافحة حشرات', labelEn: 'Pest Control', value: 'مكافحة' },
      { labelAr: 'نقل عفش', labelEn: 'Moving', value: 'نقل' },
      { labelAr: 'تركيب', labelEn: 'Installation', value: 'تركيب' },
      { labelAr: 'مقاولات', labelEn: 'Contracting', value: 'مقاولات' },
      { labelAr: 'بناء', labelEn: 'Construction', value: 'بناء' },
      { labelAr: 'دروس', labelEn: 'Tutoring', value: 'دروس' },
      { labelAr: 'تعليم', labelEn: 'Education', value: 'تعليم' },
      { labelAr: 'تصميم', labelEn: 'Design', value: 'تصميم' },
      { labelAr: 'برمجة', labelEn: 'Programming', value: 'برمجة' },
      { labelAr: 'قانون', labelEn: 'Law', value: 'قانون' },
      { labelAr: 'محاماة', labelEn: 'Legal', value: 'محاماة' },
      { labelAr: 'محاسبة', labelEn: 'Accounting', value: 'محاسبة' },
      { labelAr: 'مالية', labelEn: 'Financial', value: 'مالية' },
      { labelAr: 'سباكة', labelEn: 'Plumbing', value: 'سباكة' },
      { labelAr: 'كهرباء', labelEn: 'Electrical', value: 'كهرباء' },
      { labelAr: 'دهان', labelEn: 'Painting', value: 'دهان' },
      { labelAr: 'نجارة', labelEn: 'Carpentry', value: 'نجارة' },
      { labelAr: 'تكييف', labelEn: 'AC', value: 'تكييف' }
    ]
  }
};

interface CategoryWithChildren {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  slug?: string;
  parentSlug?: string;
  order?: number;
  categoryId?: string;
  count?: number;
  children?: CategoryWithChildren[];
}

export default function HomeScreen() {
  const { isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [listings, setListings] = useState<ListingSummary[]>([]);
  const listingsRef = useRef<ListingSummary[]>([]);
  useEffect(() => { listingsRef.current = listings; }, [listings]);
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedCity, setSelectedCity] = useState<City | 'ALL'>('ALL');
  const [selectedCityName, setSelectedCityName] = useState<string | null>(null);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);

  const selectedSubcategoryName = React.useMemo(() => {
    if (selectedCategory === expandedCategory || selectedCategory === 'ALL') {
      return isRTL ? 'كل الفئات الفرعية' : 'All Subcategories';
    }
    const parent = categories.find((c) => c.id === expandedCategory);
    const child = parent?.children?.find((c) => c.id === selectedCategory);
    return child ? child.name : (isRTL ? 'كل الفئات الفرعية' : 'All Subcategories');
  }, [selectedCategory, expandedCategory, categories, isRTL]);

  useEffect(() => {
    if (params.categoryId && typeof params.categoryId === 'string') {
      setSelectedCategory(params.categoryId);
      router.setParams({ categoryId: undefined });
    }
  }, [params.categoryId]);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    condition: 'ALL' as 'ALL' | 'NEW' | 'USED',
    sortBy: 'LATEST' as 'LATEST' | 'PRICE_ASC' | 'PRICE_DESC',
    priceStatus: 'ALL' as 'ALL' | 'FREE',
  });
  const [attributeFilters, setAttributeFilters] = useState<AttributeFilters>({});

  const activeCategorySchemaSlug = React.useMemo(() => {
    if (selectedCategory === 'ALL') return null;
    for (const parent of categories) {
      if (parent.id === selectedCategory) {
        return CATEGORY_SCHEMAS[parent.slug || ''] ? parent.slug! : null;
      }
      const child = parent.children?.find((c) => c.id === selectedCategory);
      if (child) {
        if (CATEGORY_SCHEMAS[child.slug || '']) return child.slug!;
        if (CATEGORY_SCHEMAS[child.parentSlug || '']) return child.parentSlug!;
        return null;
      }
    }
    return null;
  }, [selectedCategory, categories]);

  useEffect(() => {
    setAttributeFilters({});
  }, [selectedCategory]);

  const scrollRef = useRef<any>(null);

  const checkNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      const unread = data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (e) {
    }
  };

  useEffect(() => {
    if (isAuthenticated) checkNotifications();
  }, [isAuthenticated]);

  useEffect(() => {
    (async () => {
      try {
        const cachedListings = await AsyncStorage.getItem('@cached_listings');
        if (cachedListings) {
          setListings(JSON.parse(cachedListings));
          setLoading(false);
        }
        const cachedHistory = await AsyncStorage.getItem('@search_history');
        if (cachedHistory) {
          setSearchHistory(JSON.parse(cachedHistory));
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const getCategoryIcon = (nameAr: string) => {
          const name = nameAr.toLowerCase();
          if (name.includes('إلكترون') || name.includes('موبايل') || name.includes('هاتف')) return Smartphone;
          if (name.includes('أثاث') || name.includes('منزل') || name.includes('ديكور')) return Armchair;
          if (name.includes('ملابس') || name.includes('ملبوسات') || name.includes('أزياء') || name.includes('ثياب')) return Shirt;
          if (name.includes('دراج') || name.includes('موتوسيكل') || name.includes('بسكليت')) return Bike;
          if (name.includes('سيارات') || name.includes('مركبات') || name.includes('آليات')) return CarFront;
          if (name.includes('عقارات') || name.includes('بيوت') || name.includes('شقق')) return HomeIcon;
          if (name.includes('خدمات') || name.includes('صيانة')) return Wrench;
          if (name.includes('وظائف') || name.includes('عمل') || name.includes('توظيف')) return Briefcase;
          if (name.includes('حيوانات')) return Dog;
          if (name.includes('ألعاب') || name.includes('ترفيه') || name.includes('هوايات')) return Gamepad2;
          if (name.includes('مطاعم') || name.includes('طعام')) return Pizza;
          if (name.includes('صحة') || name.includes('جمال') || name.includes('مكياج') || name.includes('عناية') || name.includes('تجميل')) return Sparkles;
          if (name.includes('رياضة')) return Trophy;
          if (name.includes('مستعمل')) return Recycle;
          if (name.includes('متاجر')) return Store;
          return Package;
        };

        const cats = await listingService.getCategories();
        const parents = cats.filter((c) => !c.parentId);
        const parentSlugById: Record<string, string> = {};
        parents.forEach((p) => { parentSlugById[p.id] = p.slug; });
        const childrenByParent = cats
          .filter((c) => !!c.parentId)
          .reduce<Record<string, CategoryWithChildren[]>>((acc, c) => {
            const list = acc[c.parentId!] ?? [];
            list.push({
              id: c.id,
              name: i18n.language === 'ar' ? c.nameAr : (c.nameEn || c.nameAr),
              nameAr: c.nameAr,
              icon: c.icon || getCategoryIcon(c.nameAr),
              slug: c.slug,
              parentSlug: parentSlugById[c.parentId!],
              order: c.order,
              categoryId: c.id,
            });
            acc[c.parentId!] = list;
            return acc;
          }, {});

        const categoriesWithStats = parents
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((c) => {
            const absIcon = ensureAbsoluteUrl(c.icon);
            return {
              id: c.id,
              name: i18n.language === 'ar' ? c.nameAr : (c.nameEn || c.nameAr),
              nameAr: c.nameAr,
              icon: getCategoryIcon(c.nameAr) || absIcon || c.icon,
              slug: c.slug,
              categoryId: c.id,
              count: c._count?.listings || 0,
              children: (childrenByParent[c.id] ?? []).sort((a, b) => (a.order || 0) - (b.order || 0)).map(child => ({
                ...child,
                icon: getCategoryIcon(child.nameAr) || ensureAbsoluteUrl(child.icon) || child.icon,
              })),
            };
          });

        setCategories([
          { id: 'ALL', name: t('home.all'), nameAr: 'All', icon: LayoutGrid, count: 0 },
          ...categoriesWithStats,
        ]);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    })();
  }, [i18n.language, t]);
  const toggleCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setExpandedCategory((cur) => (cur === categoryId ? null : categoryId));
  };

  const fetchListings = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      const selected = categories.find((c) => c.id === selectedCategory);
      const page = await listingService.getListings({
        q: search.trim() || undefined,
        categoryId: selected?.categoryId,
        city: selectedCity !== 'ALL' ? (selectedCity as City) : undefined,
        lat: userLocation?.lat,
        lng: userLocation?.lng,
        distance: userLocation ? 50 : undefined,
        minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
        condition: filters.condition === 'ALL' ? undefined : filters.condition,
        sortBy: filters.sortBy,
        priceStatus: filters.priceStatus === 'ALL' ? undefined : filters.priceStatus as any,
        attributes: Object.keys(attributeFilters).length > 0 ? attributeFilters : undefined,
      });
      const isExplicitSort =
        filters.sortBy === 'PRICE_ASC' || filters.sortBy === 'PRICE_DESC';
      const ordered = isExplicitSort
        ? page.items
        : [...page.items].sort((a, b) => {
            const scoreA = (a.likesCount || 0) * 100 + (a.user?.trustScore || 0) * 10;
            const scoreB = (b.likesCount || 0) * 100 + (b.user?.trustScore || 0) * 10;
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return scoreB + timeB / 100000000 - (scoreA + timeA / 100000000);
          });

      setListings(ordered);

      if (selectedCategory === 'ALL' && selectedCity === 'ALL' && !search && filters.sortBy === 'LATEST') {
        AsyncStorage.setItem('@cached_listings', JSON.stringify(ordered.slice(0, 20))).catch(() => {});
      }
    } catch (error: any) {
      console.error('Error fetching listings:', error);
      if (listingsRef.current.length === 0) {
        Alert.alert(t('common.error'), t('common.load_error'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categories, selectedCategory, selectedCity, search, refreshing, t, userLocation]);

  useEffect(() => {
    fetchListings();
  }, [selectedCategory, selectedCity, filters, attributeFilters, userLocation]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchListings();
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

  const handleSearchSubmit = () => {
    if (!search.trim()) return;
    const newHistory = [search.trim(), ...searchHistory.filter(h => h !== search.trim())].slice(0, 10);
    setSearchHistory(newHistory);
    AsyncStorage.setItem('@search_history', JSON.stringify(newHistory)).catch(() => {});
    setShowSearchHistory(false);
    fetchListings();
  };

  const handleCardPress = useCallback((id: string) => {
    router.push(`/listing/${id}` as any);
  }, [router]);

  const handleSaveSearch = async () => {
    try {
      await savedSearchService.create({
        query: search,
        filters: {
          categoryId: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          city: selectedCity !== 'ALL' ? selectedCity : undefined,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          condition: filters.condition !== 'ALL' ? filters.condition : undefined,
        }
      });
      Alert.alert(
        isRTL ? 'تنبيهات البحث' : 'Search Alerts',
        isRTL ? 'تم حفظ البحث بنجاح! سنرسل لك تنبيهاً فور توفر إعلانات جديدة تطابق بحثك.' : 'Search saved! We will notify you as soon as new listings matching your search are available.'
      );
    } catch (e) {
      console.error(e);
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'فشل حفظ البحث' : 'Failed to save search');
    }
  };

  if (!isAuthenticated) {
    return <Redirect href="/(tabs)/profile" />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <View style={[styles.headerTop, { flexDirection: 'row' }]}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>{t('common.app_name')}</Text>
          </View>
          <View style={[styles.headerActions, { flexDirection: 'row' }]}>
            <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.notifBtn}>
              <Bell size={24} color={COLORS.accent} />
              {unreadCount > 0 && <View style={styles.notifBadge} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/categories')} style={styles.notifBtn}>
              <LayoutGrid size={24} color={COLORS.accent} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.quickFiltersContainer, { flexDirection: 'row' }]}>
          <TouchableOpacity style={styles.quickFilterBtn} onPress={() => setShowFilterModal(true)}>
            <SlidersHorizontal size={14} color={COLORS.accent} />
            <Text style={styles.quickFilterText}>بحث أسرع</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickFilterBtn} onPress={() => setCityModalVisible(true)}>
            <MapPin size={12} color={COLORS.accent} />
            <Text style={styles.quickFilterText}>{selectedCity === 'ALL' ? t('common.all_syria') : (selectedCityName || t(`cities.${selectedCity.toLowerCase()}`))}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
          <View style={[styles.searchBar, { flexDirection: 'row' }]}>
            <Search size={18} color="rgba(255, 255, 255, 0.7)" />
            <TextInput
              style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? "ابحث عن أي شيء..." : "Search for anything..."}
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={search}
              onChangeText={setSearch}
              onFocus={() => setShowSearchHistory(true)}
              onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
            {search.length > 0 && (
               <TouchableOpacity onPress={() => { setSearch(''); setTimeout(fetchListings, 100); }}>
                 <X size={16} color="rgba(255, 255, 255, 0.7)" />
               </TouchableOpacity>
            )}
          </View>
          {showSearchHistory && searchHistory.length > 0 && (
            <View style={[styles.searchHistoryDropdown, { [isRTL ? 'right' : 'left']: 20 }]}>
              {searchHistory.map((h, i) => (
                <TouchableOpacity key={i} style={[styles.historyItem, { flexDirection: 'row' }]} onPress={() => { setSearch(h); setTimeout(handleSearchSubmit, 50); }}>
                  <Clock size={14} color={COLORS.darkGray} />
                  <Text style={[styles.historyText, { textAlign: isRTL ? 'right' : 'left', flex: 1, [isRTL ? 'marginRight' : 'marginLeft']: 8 }]} numberOfLines={1}>{h}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {userLocation && (
          <View style={[styles.distanceInfo, { flexDirection: 'row' }]}>
            <View style={styles.distanceBadge}>
              <Navigation size={12} color={COLORS.gold} />
              <Text style={[styles.distanceText, { [isRTL ? 'marginRight' : 'marginLeft']: 6 }]}>
                {t('home.sorting_by_distance')}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setUserLocation(null)}>
              <Text style={styles.clearLocationText}>{t('common.clear')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      <LocationPicker
        visible={cityModalVisible}
        onClose={() => setCityModalVisible(false)}
        onSelect={(gov, city) => {
          setSelectedCity(gov as City);
          setSelectedCityName(city);
          setUserLocation(null);
          setCityModalVisible(false);
        }}
        onLocationSelect={(lat, lng) => {
          setUserLocation({ lat, lng });
          setSelectedCity('ALL');
          setSelectedCityName(t('home.near_me'));
          setCityModalVisible(false);
        }}
        onSelectAll={() => {
          setSelectedCity('ALL');
          setSelectedCityName(null);
          setUserLocation(null);
          setCityModalVisible(false);
        }}
        initialGovernorate={selectedCity !== 'ALL' ? (selectedCity as any) : undefined}
        initialCity={selectedCityName || undefined}
      />

      <Modal visible={showFilterModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.filterContainer}>
            <View style={[styles.filterHeader, { flexDirection: 'row' }]}>
              <Text style={styles.filterTitle}>{t('filter.title')}</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
              <Text style={[styles.filterSectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('filter.price_range')}</Text>
              <View style={[styles.priceInputs, { flexDirection: 'row' }]}>
                <TextInput
                  placeholder={t('filter.min_price')}
                  style={[styles.priceInput, { textAlign: isRTL ? 'right' : 'left' }]}
                  keyboardType="numeric"
                  value={filters.minPrice}
                  onChangeText={(v) => setFilters({...filters, minPrice: v})}
                />
                <View style={styles.priceDash} />
                <TextInput
                  placeholder={t('filter.max_price')}
                  style={[styles.priceInput, { textAlign: isRTL ? 'right' : 'left' }]}
                  keyboardType="numeric"
                  value={filters.maxPrice}
                  onChangeText={(v) => setFilters({...filters, maxPrice: v})}
                />
              </View>

              <Text style={[styles.filterSectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('filter.special_filters')}</Text>
              <TouchableOpacity
                style={[styles.sortItem, { flexDirection: 'row' }]}
                onPress={() => setFilters({...filters, priceStatus: filters.priceStatus === 'FREE' ? 'ALL' : 'FREE'})}
              >
                <Text style={[styles.sortText, filters.priceStatus === 'FREE' && styles.sortTextActive]}>
                  {t('filter.free_only')}
                </Text>
                <View style={[styles.toggleOuter, filters.priceStatus === 'FREE' && styles.toggleOuterActive]}>
                  <View style={[styles.toggleInner, { [isRTL ? 'right' : 'left']: filters.priceStatus === 'FREE' ? 22 : 2 }]} />
                </View>
              </TouchableOpacity>

              <Text style={[styles.filterSectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('filter.condition')}</Text>
              <View style={[styles.optionsGrid, { flexDirection: 'row' }]}>
                {['ALL', 'NEW', 'USED'].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.optionBtn, filters.condition === c && styles.optionBtnActive]}
                    onPress={() => setFilters({...filters, condition: c as any})}
                  >
                    <Text style={[styles.optionText, filters.condition === c && styles.optionTextActive]}>
                      {t(`filter.condition_${c.toLowerCase()}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.filterSectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('filter.sort_by')}</Text>
              {['LATEST', 'PRICE_ASC', 'PRICE_DESC'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.sortItem, { flexDirection: 'row' }]}
                  onPress={() => setFilters({...filters, sortBy: s as any})}
                >
                  <Text style={[styles.sortText, filters.sortBy === s && styles.sortTextActive]}>
                    {t(`filter.sort_${s.toLowerCase()}`)}
                  </Text>
                  {filters.sortBy === s && <Check size={18} color={COLORS.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={[styles.filterActions, { flexDirection: 'row' }]}>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => setFilters({ minPrice: '', maxPrice: '', condition: 'ALL', sortBy: 'LATEST', priceStatus: 'ALL' })}
              >
                <Text style={styles.resetBtnText}>{t('filter.reset')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setShowFilterModal(false)}
              >
                <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.applyGradient}>
                  <Text style={styles.applyBtnText}>{t('filter.apply')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showSubcategoryModal} animationType="slide" transparent>
        <TouchableOpacity style={styles.subcategoryModalOverlay} activeOpacity={1} onPress={() => setShowSubcategoryModal(false)}>
          <View style={styles.subcategoryModalContent}>
            <Text style={[styles.filterTitle, { marginBottom: 16, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('categories.select_subcategory') || 'اختر الفئة الفرعية'}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.subcategoryModalItem, selectedCategory === expandedCategory && styles.subcategoryModalItemActive, { flexDirection: 'row' }]}
                onPress={() => {
                  setSelectedCategory(expandedCategory!);
                  setShowSubcategoryModal(false);
                }}
              >
                <Text style={[styles.subcategoryModalText, selectedCategory === expandedCategory && styles.subcategoryModalTextActive]}>
                  {isRTL ? 'الكل' : 'All'}
                </Text>
                {selectedCategory === expandedCategory && <Check size={20} color={COLORS.primary} />}
              </TouchableOpacity>

              {expandedCategory && categories.find(c => c.id === expandedCategory)?.children?.map(child => {
                const isSelected = selectedCategory === child.id;
                return (
                  <TouchableOpacity
                    key={child.id}
                    style={[styles.subcategoryModalItem, isSelected && styles.subcategoryModalItemActive, { flexDirection: 'row' }]}
                    onPress={() => {
                      setSelectedCategory(child.id);
                      setShowSubcategoryModal(false);
                    }}
                  >
                    <Text style={[styles.subcategoryModalText, isSelected && styles.subcategoryModalTextActive]}>
                      {isRTL ? child.nameAr : (child.nameEn || child.nameAr)}
                    </Text>
                    {isSelected && <Check size={20} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <FlashList
        ref={scrollRef as any}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        data={loading ? ([1, 2, 3, 4] as any[]) : listings}
        estimatedItemSize={150}
        keyExtractor={(item, index) => loading ? `skel-${index}` : (item as ListingSummary).id}
        ListHeaderComponent={
          <>
            <View style={styles.carouselSection}>
              <CategoryCarousel
                categories={categories.slice(0, 8)}
                selectedId={selectedCategory}
                onSelect={(id) => {
                  if (id === 'ALL') {
                    setSelectedCategory('ALL');
                    setExpandedCategory(null);
                  } else {
                    setSelectedCategory(id);
                    setExpandedCategory((cur) => (cur === id ? null : id));
                  }
                }}
                isRTL={isRTL}
              />
              {categories.length > 8 && (
                <TouchableOpacity
                  style={styles.viewAllCategoriesBtn}
                  onPress={() => router.push('/categories')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllCategoriesText}>
                    {t('categories.see_all') || 'عرض كل الفئات'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {(() => {
              if (!expandedCategory || expandedCategory === 'ALL') return null;
              const activeCat = categories.find((c) => c.id === expandedCategory);
              if (!activeCat || !activeCat.slug) return null;

              const brandConfig = QUICK_BRANDS[activeCat.slug];
              if (!brandConfig) return null;

              const currentFilterValue = attributeFilters[brandConfig.key] || null;

              return (
                <View style={styles.subcategoryChipsContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[
                      styles.subcategoryChipsScroll,
                      { flexDirection: isRTL ? 'row-reverse' : 'row' },
                    ]}
                  >
                    <TouchableOpacity
                      style={[styles.subcategoryChip, !currentFilterValue && styles.subcategoryChipActive, { flexDirection: 'row', alignItems: 'center' }]}
                      onPress={() => {
                         const newAttrs = { ...attributeFilters };
                         delete newAttrs[brandConfig.key];
                         setAttributeFilters(newAttrs);
                      }}
                    >
                      <Text style={[styles.subcategoryChipText, !currentFilterValue && styles.subcategoryChipTextActive]}>
                        {isRTL ? 'الكل' : 'All'}
                      </Text>
                    </TouchableOpacity>

                    {brandConfig.options.map((opt) => {
                      const isSelected = currentFilterValue === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          style={[styles.subcategoryChip, isSelected && styles.subcategoryChipActive, { flexDirection: 'row', alignItems: 'center' }]}
                          onPress={() => {
                            const newAttrs = { ...attributeFilters, [brandConfig.key]: opt.value };
                            setAttributeFilters(newAttrs);
                          }}
                        >
                          {opt.image && (
                            <Image
                              source={{ uri: opt.image }}
                              style={{ width: 18, height: 18, marginRight: isRTL ? 0 : 6, marginLeft: isRTL ? 6 : 0, borderRadius: 9, backgroundColor: 'transparent' }}
                              contentFit="contain"
                            />
                          )}
                          <Text style={[styles.subcategoryChipText, isSelected && styles.subcategoryChipTextActive]}>
                            {isRTL ? opt.labelAr : opt.labelEn}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              );
            })()}

            <View style={styles.listingsSection}>
              <View style={[styles.sectionHeader, { direction: 'ltr', flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('home.sections.latest')}</Text>
                <View style={[styles.statusBadge, { direction: 'ltr', flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.statusDot, { [isRTL ? 'marginLeft' : 'marginRight']: 6 }]} />
                  <Text style={styles.statusText}>{t('home.sections.updated')}</Text>
                </View>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          !loading && listings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/7486/7486744.png' }}
                style={{ width: 80, height: 80, opacity: 0.5, marginBottom: 20 }}
              />
              <Text style={styles.emptyText}>{t('home.empty')}</Text>
              <Text style={styles.emptySub}>{t('home.empty_sub')}</Text>

              <View style={[styles.suggestions, { flexDirection: 'row' }]}>
                {['iphone', 'car', 'apartment', 'jobs'].map(tag => (
                  <TouchableOpacity key={tag} style={styles.tag} onPress={() => setSearch(t(`suggestions.${tag}`))}>
                    <Text style={styles.tagText}>#{t(`suggestions.${tag}`)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => {
          if (loading) {
            return (
              <View style={{ paddingHorizontal: 16 }}>
                <SkeletonListingCard />
              </View>
            );
          }
          return (
            <View style={{ paddingHorizontal: 16 }}>
              <ListingCard item={item as ListingSummary} index={index} onPress={handleCardPress} />
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.accent },
  scrollContent: { paddingBottom: 100 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 52 : 32,
    paddingBottom: 8,
  },
  carouselSection: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    marginVertical: 8,
  },
  viewAllCategoriesBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  viewAllCategoriesText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  headerTop: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 20,
  },
  headerActions: {
    gap: 12,
    alignItems: 'center',
  },
  logoContainer: { justifyContent: 'center' },
  logoText: { fontSize: 24, fontWeight: '900', color: COLORS.accent, fontFamily: 'Outfit_Bold', letterSpacing: 1 },
  notifBtn: { padding: 4, position: 'relative' },
  notifBadge: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', borderWidth: 1, borderColor: COLORS.primary },
  quickFiltersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    gap: 8,
    flexWrap: 'wrap',
  },
  quickFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  quickFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 16,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 21,
    paddingHorizontal: 16,
    height: 42,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(196, 160, 82, 0.4)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontWeight: '700',
    color: '#fff',
    fontSize: 14,
    marginHorizontal: 10,
    paddingVertical: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
    height: '100%',
  },
  searchHistoryDropdown: {
    position: 'absolute',
    top: 65,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    width: width - 40,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  historyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
  },
  historyText: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  subcategorySelectorContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  subcategorySelectorBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  subcategorySelectorText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  subcategoryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  subcategoryModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '60%',
  },
  subcategoryModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  subcategoryModalItemActive: {
    backgroundColor: 'rgba(6, 78, 59, 0.08)',
    borderColor: COLORS.primary,
  },
  subcategoryModalText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  subcategoryModalTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  subcategoryChipsContainer: {
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  subcategoryChipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  subcategoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  subcategoryChipActive: {
    backgroundColor: 'rgba(196, 160, 82, 0.1)',
    borderColor: COLORS.gold,
  },
  subcategoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  subcategoryChipTextActive: {
    color: COLORS.gold,
    fontWeight: '800',
  },
  sectionTitle: { color: COLORS.secondary, fontSize: 22, fontWeight: '900', paddingHorizontal: 24, marginBottom: 16 },
  promoBanner: { margin: 24, height: 120, borderRadius: 28, backgroundColor: COLORS.primary, borderWidth: 1, borderColor: COLORS.gold, overflow: 'hidden' },
  promoContent: { flex: 1, alignItems: 'center', paddingHorizontal: 25 },
  promoTextContainer: { flex: 1 },
  promoTitle: { color: COLORS.accent, fontSize: 20, fontWeight: '900' },
  promoSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
  promoIconContainer: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  listingsSection: { paddingHorizontal: 16 },
  sectionHeader: { justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, marginBottom: 16 },
  statusBadge: { alignItems: 'center', backgroundColor: 'rgba(196, 160, 82, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.gold },
  statusText: { color: COLORS.gold, fontWeight: '800', fontSize: 10 },
  grid: { flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 4 },
  emptyContainer: { flex: 1, alignItems: 'center', paddingVertical: 60, width: '100%' },
  emptyText: { color: COLORS.secondary, fontWeight: '900', fontSize: 18, marginBottom: 8 },
  emptySub: { color: COLORS.darkGray, fontWeight: '600', fontSize: 14, textAlign: 'center', paddingHorizontal: 40, marginBottom: 30 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  tag: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(196, 160, 82, 0.1)', borderWidth: 1, borderColor: 'rgba(196, 160, 82, 0.2)' },
  tagText: { color: COLORS.gold, fontWeight: '800', fontSize: 13 },
  distanceInfo: {
    marginTop: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(196, 160, 82, 0.3)',
  },
  distanceText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  clearLocationText: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  saveSearchChip: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  saveSearchText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  filterContainer: {
    backgroundColor: COLORS.accent,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    height: '80%',
    padding: 24,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  filterTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  filterContent: {
    flex: 1,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: 15,
    marginTop: 20,
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#fff',
    height: 50,
    borderRadius: 15,
    paddingHorizontal: 15,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  priceDash: {
    width: 10,
    height: 2,
    backgroundColor: COLORS.darkGray,
  },
  optionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  optionBtn: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  optionBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.gold,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  optionTextActive: {
    color: '#fff',
  },
  sortItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  sortText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  sortTextActive: {
    color: COLORS.primary,
    fontWeight: '900',
  },
  filterActions: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 15,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  resetBtn: {
    flex: 1,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  resetBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  applyBtn: {
    flex: 2,
    height: 55,
    borderRadius: 18,
    overflow: 'hidden',
  },
  applyGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  toggleOuter: {
    width: 48,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E5E7EB',
    padding: 2,
    justifyContent: 'center',
  },
  toggleOuterActive: {
    backgroundColor: COLORS.primary,
  },
  toggleInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'absolute',
  },
});
