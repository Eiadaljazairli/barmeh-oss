import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
  Animated,
  I18nManager,
} from 'react-native';
import { Camera, X, MapPin, Package, DollarSign, Image as ImageIcon, Tag, ChevronDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { listingService, authService, City } from '../../services/api';
import { LocationPicker } from '../../components/LocationPicker';
import { CATEGORY_SCHEMAS } from '../../constants/categorySchemas';
import DynamicAttributesForm from '../../components/DynamicAttributesForm';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../styles/colors';
import { FormDropdown } from '../../components/FormDropdown';
import { ensureAbsoluteUrl } from '../../utils/url';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGES = 8;

export default function PostScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = I18nManager.isRTL || i18n.language === 'ar';

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
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState<City | null>(null);
  const [selectedCityName, setSelectedCityName] = useState<string | null>(null);
  const [attributes, setAttributes] = useState<{ [key: string]: any }>({});

  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [priceStatus, setPriceStatus] = useState<'negotiable' | 'fixed' | 'free'>('fixed');
  const [parentCategories, setParentCategories] = useState<{ id: string; label: string; slug: string; icon: string; order: number }[]>([]);
  const [subCategories, setSubCategories] = useState<{ id: string; label: string; slug: string; parentId: string; icon: string; order: number }[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [categoriesError, setCategoriesError] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [discount, setDiscount] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState('');

  const { editId } = useLocalSearchParams();

  const WIZARD_STEPS = 4;
  const [step, setStep] = useState(1);
  const isWizardMode = !editId;

  const selectedCategorySlug = useMemo(() => {
    const currentCat = [...parentCategories, ...subCategories].find(c => c.id === categoryId);
    if (!currentCat) return null;

    if (CATEGORY_SCHEMAS[currentCat.slug]) return currentCat.slug;

    if ('parentId' in currentCat && currentCat.parentId) {
      const parent = parentCategories.find(p => p.id === (currentCat as any).parentId);
      if (parent && CATEGORY_SCHEMAS[parent.slug]) return parent.slug;
    }

    return null;
  }, [categoryId, parentCategories, subCategories]);

  useEffect(() => {
    if (categoryId && !editId) {
      setAttributes({});
    }
  }, [selectedCategorySlug, editId]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (editId) {
      loadListingForEdit(editId as string);
    } else {
      resetForm();
    }
  }, [editId]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setCity(null);
    setSelectedCityName(null);
    setAttributes({});
    setImages([]);
    setDiscount(false);
    setDiscountPercentage('');
    setPriceStatus('fixed');
    if (parentCategories.length > 0) {
      setSelectedParentId(parentCategories[0].id);
      setCategoryId(parentCategories[0].id);
    }
  };

  const loadListingForEdit = async (id: string) => {
    try {
      setIsLoading(true);
      const listing = await listingService.getListingDetails(id);
      setTitle(listing.title);
      setDescription(listing.description);
      setPrice(listing.price.toString());
      setCity(listing.city);
      setCategoryId(listing.categoryId || '');

      const loadedImages = (listing.images || []).map((img: any) =>
        ensureAbsoluteUrl(img.mediumUrl || img.thumbUrl)
      ).filter(Boolean) as string[];

      setImages(loadedImages);
      setDiscount(!!listing.discount);
      if (listing.discountPercentage) setDiscountPercentage(listing.discountPercentage.toString());
      if (listing.priceStatus) setPriceStatus(listing.priceStatus);
      if (listing.attributes) setAttributes(listing.attributes);
    } catch (error: any) {
      console.error('Error loading listing for edit:', error);
      Alert.alert(t('common.error'), t('details.error_loading'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    Alert.alert(
      t('common.cancel'),
      t('post.cancel_edit_confirm') || 'هل أنت متأكد من إلغاء التعديل؟',
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          onPress: () => {
            router.setParams({ editId: undefined });
            resetForm();
            router.push('/(tabs)/profile');
          }
        }
      ]
    );
  };

  const getCategoryEmoji = (nameAr: string) => {
    const name = nameAr.toLowerCase();
    if (name.includes('إلكترون') || name.includes('موبايل') || name.includes('هاتف')) return '📱';
    if (name.includes('أثاث') || name.includes('منزل') || name.includes('ديكور')) return '🛋️';
    if (name.includes('ملابس') || name.includes('ملبوسات') || name.includes('أزياء') || name.includes('ثياب')) return '👕';
    if (name.includes('سيارات') || name.includes('مركبات') || name.includes('آليات')) return '🚗';
    if (name.includes('عقارات') || name.includes('بيوت') || name.includes('شقق')) return '🏠';
    if (name.includes('خدمات') || name.includes('صيانة')) return '🛠️';
    if (name.includes('وظائف') || name.includes('عمل') || name.includes('توظيف')) return '💼';
    if (name.includes('حيوانات')) return '🐕';
    if (name.includes('ألعاب') || name.includes('ترفيه') || name.includes('هوايات')) return '🎮';
    if (name.includes('مطاعم') || name.includes('طعام')) return '🍕';
    if (name.includes('صحة') || name.includes('جمال')) return '✨';
    if (name.includes('رياضة')) return '⚽';
    return '📦';
  };

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError(false);
    try {
      const cats = await listingService.getCategories();

      const parents = cats
        .filter(c => !c.parentId)
        .map(c => ({
          id: c.id,
          label: i18n.language === 'ar' ? c.nameAr : (c.nameEn || c.nameAr),
          slug: c.slug,
          icon: c.icon || getCategoryEmoji(c.nameAr),
          order: c.order
        }))
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      const subs = cats
        .filter(c => !!c.parentId)
        .map(c => ({
          id: c.id,
          label: i18n.language === 'ar' ? c.nameAr : (c.nameEn || c.nameAr),
          slug: c.slug,
          parentId: c.parentId!,
          icon: c.icon || getCategoryEmoji(c.nameAr),
          order: c.order
        }))
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      setParentCategories(parents);
      setSubCategories(subs);

      if (parents.length > 0 && !editId) {
        setSelectedParentId(parents[0].id);
        setCategoryId(parents[0].id);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategoriesError(true);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const filterAssetsBySize = (
    assets: ImagePicker.ImagePickerAsset[],
  ): { ok: string[]; rejected: number } => {
    const ok: string[] = [];
    let rejected = 0;
    for (const a of assets) {
      const size = a.fileSize;
      if (size != null && size > MAX_IMAGE_BYTES) {
        rejected++;
      } else {
        ok.push(a.uri);
      }
    }
    return { ok, rejected };
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), t('post.alerts.photo_permission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: MAX_IMAGES,
    });

    if (result.canceled) return;

    const { ok, rejected } = filterAssetsBySize(result.assets);
    if (rejected > 0) {
      Alert.alert(
        t('common.error'),
        t('post.alerts.photo_size_warning', { count: rejected }),
      );
    }
    if (ok.length > 0) {
      setImages((prev) => [...prev, ...ok].slice(0, MAX_IMAGES));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!(await authService.isAuthenticated())) {
      Alert.alert(t('common.error'), t('post.alerts.need_login'), [
        { text: t('common.success'), onPress: () => router.push('/(tabs)/profile') },
      ]);
      return;
    }

    if (!title.trim() || title.trim().length < 3) {
      Alert.alert(t('common.error'), t('post.alerts.title_min'));
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      Alert.alert(t('common.error'), t('post.alerts.desc_min'));
      return;
    }
    const priceNum = parseFloat(price);
    if (!priceNum && priceStatus !== 'free') {
      Alert.alert(t('common.error'), t('post.alerts.invalid_price'));
      return;
    }
    if (categoriesLoading) {
      Alert.alert(
        t('common.error'),
        t('post.alerts.categories_loading'),
      );
      return;
    }
    if (categoriesError || parentCategories.length === 0) {
      Alert.alert(
        t('common.error'),
        t('post.alerts.no_categories'),
      );
      return;
    }
    if (!categoryId) {
      Alert.alert(
        t('common.error'),
        t('post.alerts.select_category'),
      );
      return;
    }
    if (images.length === 0) {
      Alert.alert(t('common.error'), t('post.alerts.no_images'));
      return;
    }

    setIsLoading(true);
    try {
      let listingId = editId as string;

      const payload = {
          title: title.trim(),
          description: description.trim(),
          price: priceStatus === 'free' ? 0 : priceNum,
          city: city as City,
          categoryId,
          priceStatus,
          attributes: attributes,
        };

      if (editId) {
        await listingService.updateListing(listingId, payload);
      } else {
        const created = await listingService.createListing(payload);
        listingId = created.id;
      }

      const newImages = images.filter(uri => uri.startsWith('file') || uri.startsWith('content'));

      if (newImages.length > 0) {
        const uploadResults = await Promise.allSettled(
          newImages.map((uri) => listingService.uploadImage(listingId, uri)),
        );
        const failedCount = uploadResults.filter((r) => r.status === 'rejected').length;

        if (failedCount > 0) {
          Alert.alert(
            t('common.success'),
            t('post.alerts.upload_warning', { count: failedCount }),
            [{ text: t('common.success'), onPress: () => router.replace(`/listing/${listingId}` as any) }],
          );
        } else {
          Alert.alert(t('common.success'), editId ? t('common.success') : t('post.alerts.success'), [
            { text: t('common.back'), onPress: () => router.replace(`/listing/${listingId}` as any) },
          ]);
        }
      } else {
        Alert.alert(t('common.success'), editId ? t('common.success') : t('post.alerts.success'), [
          { text: t('common.back'), onPress: () => router.replace(`/listing/${listingId}` as any) },
        ]);
      }

      if (!editId) {
        setTitle('');
        setDescription('');
        setPrice('');
        setImages([]);
        setAttributes({});
        setPriceStatus('negotiable');
        setStep(1);
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message ??
        t('common.error');
      Alert.alert(t('common.error'), Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setIsLoading(false);
    }
  };

  const progress = useMemo(() => {
    let filled = 0;
    if (images.length > 0) filled++;
    if (title.trim().length > 0) filled++;
    if (description.trim().length > 0) filled++;
    if (price) filled++;
    if (categoryId) filled++;
    if (city) filled++;
    return (filled / 6) * 100;
  }, [images, title, description, price, categoryId, city]);

  const canProceedFromStep = (s: number): { ok: boolean; reason?: string } => {
    if (s === 1) {
      if (categoriesLoading) return { ok: false, reason: t('post.alerts.categories_loading') };
      if (categoriesError || parentCategories.length === 0) {
        return { ok: false, reason: t('post.alerts.no_categories') };
      }
      if (!categoryId) return { ok: false, reason: t('post.alerts.select_category') };
      return { ok: true };
    }
    if (s === 2) {
      if (!city) return { ok: false, reason: t('common.select_city') };
      return { ok: true };
    }
    if (s === 3) {
      if (images.length === 0) return { ok: false, reason: t('post.alerts.no_images') };
      return { ok: true };
    }
    return { ok: true };
  };

  const goNext = () => {
    const check = canProceedFromStep(step);
    if (!check.ok) {
      Alert.alert(t('common.error'), check.reason || '');
      return;
    }
    if (step < WIZARD_STEPS) setStep(step + 1);
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const stepLabels = [
    t('post.step_category') || 'الفئة',
    t('post.step_location') || 'الموقع',
    t('post.step_photos') || 'الصور',
    t('post.step_details') || 'التفاصيل',
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <View style={{ width: '100%', alignItems: 'center', position: 'relative', marginBottom: 8 }}>
          <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
            {editId ? t('post.edit_title') : t('post.title')}
          </Text>
          {editId && (
            <TouchableOpacity onPress={handleCancelEdit} style={[styles.cancelBtn, { position: 'absolute', [isRTL ? 'left' : 'right']: 0, top: -2 }]}>
              <X size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.headerSubtitle}>{editId ? t('post.edit_subtitle') : t('post.subtitle')}</Text>
      </LinearGradient>

      {isWizardMode ? (
        <View style={styles.progressContainer}>
          <View style={[styles.stepBarRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {Array.from({ length: WIZARD_STEPS }).map((_, i) => {
              const filled = i + 1 <= step;
              return (
                <View
                  key={i}
                  style={[
                    styles.stepSegment,
                    filled ? styles.stepSegmentFilled : styles.stepSegmentEmpty,
                  ]}
                />
              );
            })}
          </View>
          <Text style={styles.progressText}>
            {t('common.step') || 'الخطوة'} {step} / {WIZARD_STEPS} · {stepLabels[step - 1]}
          </Text>
        </View>
      ) : (
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}% {t('common.complete')}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {(!isWizardMode || step === 1) && (
          <View style={styles.sectionWrapper}>
            <LinearGradient
              colors={['rgba(196, 160, 82, 0.08)', 'rgba(196, 160, 82, 0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionGradient}
            >
              <View style={styles.sectionHeader}>
                <Package size={24} color={COLORS.gold} strokeWidth={1.5} />
                <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {t('post.step_category') || 'الفئة'}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('post.main_category')}</Text>
                {categoriesLoading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : categoriesError ? (
                  <TouchableOpacity style={styles.retryBtn} onPress={fetchCategories}>
                    <Text style={styles.retryText}>{t('post.retry_categories')}</Text>
                  </TouchableOpacity>
                ) : parentCategories.length === 0 ? (
                  <TouchableOpacity style={styles.retryBtn} onPress={fetchCategories}>
                    <Text style={styles.retryText}>{t('post.retry_categories')}</Text>
                  </TouchableOpacity>
                ) : (
                  <FormDropdown
                    label=""
                    value={selectedParentId}
                    options={parentCategories.map(c => ({
                      label: c.icon && !c.icon.startsWith('http') ? `${c.icon} ${c.label}` : c.label,
                      value: c.id
                    }))}
                    onSelect={(val) => {
                      setSelectedParentId(val);
                      setCategoryId(val);
                    }}
                    isRTL={isRTL}
                    placeholder={t('post.select_category')}
                  />
                )}
              </View>

              {selectedParentId && subCategories.filter(s => s.parentId === selectedParentId).length > 0 && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('post.subcategory')}</Text>
                  <FormDropdown
                    label=""
                    value={categoryId === selectedParentId ? null : categoryId}
                    options={subCategories
                      .filter(s => s.parentId === selectedParentId)
                      .map(c => ({
                        label: c.label,
                        value: c.id
                      }))
                    }
                    onSelect={(val) => setCategoryId(val)}
                    isRTL={isRTL}
                    placeholder={t('post.select_subcategory')}
                  />
                </View>
              )}

              {selectedCategorySlug && CATEGORY_SCHEMAS[selectedCategorySlug] && (
                <View style={styles.inputGroup}>
                  <DynamicAttributesForm
                    categorySlug={selectedCategorySlug}
                    values={attributes}
                    onChange={(key, val) => setAttributes(prev => ({ ...prev, [key]: val }))}
                    isRTL={isRTL}
                  />
                </View>
              )}
            </LinearGradient>
          </View>
        )}

        {(!isWizardMode || step === 2) && (
          <View style={styles.sectionWrapper}>
            <LinearGradient
              colors={['rgba(196, 160, 82, 0.08)', 'rgba(196, 160, 82, 0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionGradient}
            >
              <View style={styles.sectionHeader}>
                <MapPin size={24} color={COLORS.gold} strokeWidth={1.5} />
                <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {t('post.step_location') || 'الموقع'}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('post.city')}</Text>
                <TouchableOpacity
                  style={[styles.cityButton, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                  onPress={() => setCityModalVisible(true)}
                >
                  <MapPin size={20} color={COLORS.primary} />
                  <Text style={[styles.cityButtonText, { marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }]}>
                    {selectedCityName || city || t('common.select_city')}
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        )}

        <LocationPicker
          visible={cityModalVisible}
          onClose={() => setCityModalVisible(false)}
          onSelect={(gov, cityName) => {
            setCity(gov as City);
            setSelectedCityName(cityName);
            setCityModalVisible(false);
          }}
          onLocationSelect={(_lat, _lng) => {
            setCityModalVisible(false);
          }}
          initialGovernorate={city || undefined}
          initialCity={selectedCityName || undefined}
        />

        {(!isWizardMode || step === 3) && (
          <View style={styles.sectionWrapper}>
            <LinearGradient
              colors={['rgba(196, 160, 82, 0.08)', 'rgba(196, 160, 82, 0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionGradient}
            >
              <View style={styles.sectionHeader}>
                <ImageIcon size={24} color={COLORS.gold} strokeWidth={1.5} />
                <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('post.photos')}</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imageScroll}
                contentContainerStyle={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 }}
              >
                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                  <Camera size={32} color={COLORS.primary} />
                  <Text style={styles.uploadText}>{t('post.add_photos')}</Text>
                </TouchableOpacity>

                {images.map((uri, index) => (
                  <View key={`${uri}-${index}`} style={styles.imageContainer}>
                    <Image source={{ uri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => removeImage(index)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <X size={18} color={COLORS.accent} strokeWidth={3} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </LinearGradient>
          </View>
        )}

        {(!isWizardMode || step === 4) && (
          <View style={styles.sectionWrapper}>
            <LinearGradient
              colors={['rgba(196, 160, 82, 0.08)', 'rgba(196, 160, 82, 0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionGradient}
            >
              <View style={styles.sectionHeader}>
                <Tag size={24} color={COLORS.gold} strokeWidth={1.5} />
                <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('post.listing_details')}</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('post.listing_title')}</Text>
                <TextInput
                  placeholder={t('post.title_placeholder')}
                  style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  placeholderTextColor={COLORS.gold}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={120}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('post.description')}</Text>
                <TextInput
                  placeholder={t('post.description_placeholder')}
                  style={[styles.input, styles.textArea, { textAlign: isRTL ? 'right' : 'left' }]}
                  multiline
                  numberOfLines={6}
                  placeholderTextColor={COLORS.gold}
                  textAlignVertical="top"
                  value={description}
                  onChangeText={setDescription}
                  maxLength={2000}
                />
              </View>

              {priceStatus !== 'free' && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('post.price')}</Text>
                  <TextInput
                    placeholder="0"
                    style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.gold}
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>
              )}

              <View style={[styles.inputGroup, { backgroundColor: COLORS.lightGray, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#f1f5f9' }]}>
                <Text style={[styles.label, { marginBottom: 12, textAlign: isRTL ? 'right' : 'left' }]}>{t('post.price_status')}</Text>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 10 }}>
                  {[
                    { id: 'negotiable', label: t('post.price_negotiable') },
                    { id: 'fixed', label: t('post.price_fixed') },
                    { id: 'free', label: t('post.price_free') }
                  ].map((status) => (
                    <TouchableOpacity
                      key={status.id}
                      onPress={() => setPriceStatus(status.id as any)}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        borderRadius: 12,
                        backgroundColor: priceStatus === status.id ? COLORS.primary : '#fff',
                        borderWidth: 1,
                        borderColor: priceStatus === status.id ? COLORS.primary : 'rgba(0,0,0,0.05)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        elevation: priceStatus === status.id ? 4 : 0,
                      }}
                    >
                      <Text style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: priceStatus === status.id ? COLORS.accent : COLORS.secondary,
                      }}>
                        {status.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={{ fontSize: 12, color: COLORS.darkGray, textAlign: isRTL ? 'right' : 'left', marginTop: 10, fontWeight: '600' }}>
                  {priceStatus === 'negotiable' && t('post.status_desc_negotiable')}
                  {priceStatus === 'fixed' && t('post.status_desc_fixed')}
                  {priceStatus === 'free' && t('post.status_desc_free')}
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {isWizardMode && step < WIZARD_STEPS ? (
          <View style={[styles.wizardNav, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {step > 1 ? (
              <TouchableOpacity
                onPress={goBack}
                activeOpacity={0.85}
                style={styles.wizardBackBtn}
              >
                <Text style={styles.wizardBackText}>{t('common.back') || 'السابق'}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.wizardBackBtnPlaceholder} />
            )}
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.wizardNextBtn}
            >
              <TouchableOpacity
                onPress={goNext}
                activeOpacity={0.9}
                style={{ width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
              >
                <Text style={styles.submitBtnText}>{t('common.next') || 'التالي'}</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        ) : (
          <View style={[styles.wizardNav, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {isWizardMode && step > 1 ? (
              <TouchableOpacity
                onPress={goBack}
                activeOpacity={0.85}
                style={styles.wizardBackBtn}
              >
                <Text style={styles.wizardBackText}>{t('common.back') || 'السابق'}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.wizardBackBtnPlaceholder} />
            )}
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.wizardNextBtn, isLoading && styles.disabledBtn]}
            >
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading}
                style={{ width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.accent} size="large" />
                ) : (
                  <Text style={styles.submitBtnText}>✨ {t('post.submit')}</Text>
                )}
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.accent,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  cancelBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12 },
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(6, 78, 59, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  stepBarRow: {
    gap: 6,
    marginBottom: 10,
  },
  stepSegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  stepSegmentFilled: {
    backgroundColor: COLORS.gold,
  },
  stepSegmentEmpty: {
    backgroundColor: 'rgba(6, 78, 59, 0.12)',
  },
  wizardNav: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    gap: 12,
    alignItems: 'center',
  },
  wizardBackBtn: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    borderWidth: 1.5,
    borderColor: 'rgba(6, 78, 59, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
  },
  wizardBackBtnPlaceholder: {
    width: 0,
  },
  wizardBackText: {
    color: COLORS.secondary,
    fontSize: 15,
    fontWeight: '800',
  },
  wizardNextBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 12,
  },
  sectionWrapper: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.accent,
    borderWidth: 1,
    borderColor: 'rgba(6, 78, 59, 0.08)',
  },
  sectionGradient: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.secondary,
    flex: 1,
  },
  imageScroll: { flexDirection: 'row', gap: 12 },
  uploadBtn: {
    width: 120,
    height: 120,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.gold,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(196, 160, 82, 0.08)',
  },
  uploadText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  imageContainer: {
    position: 'relative',
    overflow: 'visible',
    borderRadius: 16,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  removeBtn: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#ef4444',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.accent,
    zIndex: 10,
    elevation: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  form: {
    paddingHorizontal: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: 12,
    letterSpacing: 0.3,
    alignSelf: 'stretch',
    width: '100%',
  },
  input: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: 'rgba(6, 78, 59, 0.1)',
    fontWeight: '600',
    includeFontPadding: false,
    textAlignVertical: 'center',
    paddingVertical: 0,
  },
  textArea: {
    height: 140,
    paddingTop: 14,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    marginLeft: 8,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(6, 78, 59, 0.12)',
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  chipTextActive: {
    color: COLORS.accent,
    fontWeight: '800',
  },
  cityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(6, 78, 59, 0.1)',
    gap: 12,
  },
  cityButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  submitBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 20,
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  disabledBtn: {
    opacity: 0.6
  },
  submitBtnText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  retryBtn: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  retryText: {
    color: '#b91c1c',
    fontWeight: '800',
    fontSize: 14,
  },
});
