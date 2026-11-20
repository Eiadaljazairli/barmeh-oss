export type Governorate =
  | 'DAMASCUS'
  | 'RURAL_DAMASCUS'
  | 'ALEPPO'
  | 'HOMS'
  | 'HAMA'
  | 'LATAKIA'
  | 'TARTUS'
  | 'IDLIB'
  | 'DEIR_EZ_ZOR'
  | 'RAQQA'
  | 'HASAKAH'
  | 'DARAA'
  | 'SUWAYDA'
  | 'QUNEITRA'
  | 'QAMISHLI';

export interface LocationData {
  governorate: Governorate;
  cities: { id: string; nameAr: string; nameEn: string }[];
}

export const SYRIAN_LOCATIONS: LocationData[] = [
  {
    governorate: 'DAMASCUS',
    cities: [
      { id: 'DAM-01', nameAr: 'المزة', nameEn: 'Mezzeh' },
      { id: 'DAM-02', nameAr: 'كفرسوسة', nameEn: 'Kafar Souseh' },
      { id: 'DAM-03', nameAr: 'مشروع دمر', nameEn: 'Dummar Project' },
      { id: 'DAM-04', nameAr: 'الميدان', nameEn: 'Al-Midan' },
      { id: 'DAM-05', nameAr: 'التجارة', nameEn: 'Al-Tijarah' },
      { id: 'DAM-06', nameAr: 'المالكي', nameEn: 'Al-Malki' },
      { id: 'DAM-07', nameAr: 'أبو رمانة', nameEn: 'Abu Rummaneh' },
      { id: 'DAM-08', nameAr: 'البرامكة', nameEn: 'Al-Baramkeh' },
      { id: 'DAM-09', nameAr: 'القنوات', nameEn: 'Al-Qanawat' },
      { id: 'DAM-10', nameAr: 'الصالحية', nameEn: 'Al-Salihiyah' },
      { id: 'DAM-11', nameAr: 'الشعلان', nameEn: 'Al-Shaalan' },
      { id: 'DAM-12', nameAr: 'ركن الدين', nameEn: 'Rukn Al-Din' },
      { id: 'DAM-13', nameAr: 'المهاجرين', nameEn: 'Al-Muhajirin' },
      { id: 'DAM-14', nameAr: 'برزة', nameEn: 'Barzeh' },
      { id: 'DAM-15', nameAr: 'دمشق القديمة', nameEn: 'Old Damascus' },
      { id: 'DAM-16', nameAr: 'باب توما', nameEn: 'Bab Tuma' },
      { id: 'DAM-17', nameAr: 'باب شرقي', nameEn: 'Bab Sharqi' },
      { id: 'DAM-18', nameAr: 'القصاع', nameEn: 'Al-Qassa' },
      { id: 'DAM-19', nameAr: 'الزاهرة', nameEn: 'Al-Zahira' },
      { id: 'DAM-20', nameAr: 'التضامن', nameEn: 'Al-Tadamun' },
      { id: 'DAM-21', nameAr: 'نهر عيشة', nameEn: 'Nahr Aisha' },
      { id: 'DAM-22', nameAr: 'مساكن برزة', nameEn: 'Masaken Barzeh' },
      { id: 'DAM-23', nameAr: 'جوبر', nameEn: 'Jobar' },
      { id: 'DAM-24', nameAr: 'الفحامة', nameEn: 'Al-Fahama' },
      { id: 'DAM-25', nameAr: 'مخيم اليرموك', nameEn: 'Yarmouk Camp' },
    ]
  },
  {
    governorate: 'RURAL_DAMASCUS',
    cities: [
      { id: 'RD-01', nameAr: 'جرمانا', nameEn: 'Jaramana' },
      { id: 'RD-02', nameAr: 'صحنايا', nameEn: 'Sahnaya' },
      { id: 'RD-03', nameAr: 'أشرفية صحنايا', nameEn: 'Ashrafiyat Sahnaya' },
      { id: 'RD-04', nameAr: 'قدسيا', nameEn: 'Qudsaya' },
      { id: 'RD-05', nameAr: 'الهامة', nameEn: 'Al-Hamah' },
      { id: 'RD-06', nameAr: 'التل', nameEn: 'Al-Tall' },
      { id: 'RD-07', nameAr: 'دوما', nameEn: 'Douma' },
      { id: 'RD-08', nameAr: 'داريا', nameEn: 'Darayya' },
      { id: 'RD-09', nameAr: 'الكسوة', nameEn: 'Al-Kiswah' },
      { id: 'RD-10', nameAr: 'قطنا', nameEn: 'Qatana' },
      { id: 'RD-11', nameAr: 'صيدنايا', nameEn: 'Saydnaya' },
      { id: 'RD-12', nameAr: 'النبك', nameEn: 'Al-Nabek' },
      { id: 'RD-13', nameAr: 'يبرود', nameEn: 'Yabroud' },
      { id: 'RD-14', nameAr: 'الزبداني', nameEn: 'Al-Zabadani' },
      { id: 'RD-15', nameAr: 'قدسيا الضاحية', nameEn: 'Qudsaya Suburb' },
      { id: 'RD-16', nameAr: 'السيدة زينب', nameEn: 'Sayyidah Zaynab' },
      { id: 'RD-17', nameAr: 'ببيلا', nameEn: 'Babila' },
      { id: 'RD-18', nameAr: 'يلدا', nameEn: 'Yalda' },
      { id: 'RD-19', nameAr: 'بيت سحم', nameEn: 'Beit Sahem' },
      { id: 'RD-20', nameAr: 'معضمية الشام', nameEn: 'Muadamiyat al-Sham' },
      { id: 'RD-21', nameAr: 'جديدة عرطوز', nameEn: 'Judaydat Artouz' },
      { id: 'RD-22', nameAr: 'عرطوز', nameEn: 'Artouz' },
      { id: 'RD-23', nameAr: 'خان الشيح', nameEn: 'Khan al-Shih' },
      { id: 'RD-24', nameAr: 'دير عطية', nameEn: 'Deir Atiyah' },
      { id: 'RD-25', nameAr: 'مضايا', nameEn: 'Madaya' },
      { id: 'RD-26', nameAr: 'بقين', nameEn: 'Buqayn' },
      { id: 'RD-27', nameAr: 'الرحيبة', nameEn: 'Al-Ruhaybah' },
      { id: 'RD-28', nameAr: 'جيرود', nameEn: 'Jayroud' },
      { id: 'RD-29', nameAr: 'كفر بطنا', nameEn: 'Kafar Batna' },
      { id: 'RD-30', nameAr: 'سقبا', nameEn: 'Saqba' },
      { id: 'RD-31', nameAr: 'حرستا', nameEn: 'Harasta' },
      { id: 'RD-32', nameAr: 'عربين', nameEn: 'Arbin' },
    ]
  },
  {
    governorate: 'ALEPPO',
    cities: [
      { id: 'ALP-01', nameAr: 'مركز مدينة حلب', nameEn: 'Aleppo City Center' },
      { id: 'ALP-02', nameAr: 'الفرقان', nameEn: 'Al-Furqan' },
      { id: 'ALP-03', nameAr: 'الشهباء', nameEn: 'Al-Shahba' },
      { id: 'ALP-04', nameAr: 'حلب الجديدة', nameEn: 'New Aleppo' },
      { id: 'ALP-05', nameAr: 'الحمدانية', nameEn: 'Al-Hamadaniyah' },
      { id: 'ALP-06', nameAr: 'الموكامبو', nameEn: 'Al-Mocambo' },
      { id: 'ALP-07', nameAr: 'الأعظمية', nameEn: 'Al-Aazamiyah' },
      { id: 'ALP-08', nameAr: 'سيف الدولة', nameEn: 'Saif Al-Dawla' },
      { id: 'ALP-09', nameAr: 'صلاح الدين', nameEn: 'Salah Al-Din' },
      { id: 'ALP-10', nameAr: 'عزاز', nameEn: 'Azaz' },
      { id: 'ALP-11', nameAr: 'الباب', nameEn: 'Al-Bab' },
      { id: 'ALP-12', nameAr: 'منبج', nameEn: 'Manbij' },
      { id: 'ALP-13', nameAr: 'السفيرة', nameEn: 'Al-Safira' },
      { id: 'ALP-14', nameAr: 'عفرين', nameEn: 'Afrin' },
      { id: 'ALP-15', nameAr: 'جبل سمعان', nameEn: 'Jabal Saman' },
      { id: 'ALP-16', nameAr: 'السبيل', nameEn: 'Al-Sabil' },
      { id: 'ALP-17', nameAr: 'الميدان', nameEn: 'Al-Midan' },
      { id: 'ALP-18', nameAr: 'العزيزية', nameEn: 'Al-Aziziyah' },
      { id: 'ALP-19', nameAr: 'السليمانية', nameEn: 'Al-Sulaymaniyah' },
      { id: 'ALP-20', nameAr: 'أدونيس', nameEn: 'Adonis' },
    ]
  },
  {
    governorate: 'HOMS',
    cities: [
      { id: 'HMS-01', nameAr: 'مركز مدينة حمص', nameEn: 'Homs City Center' },
      { id: 'HMS-02', nameAr: 'حي الوعر', nameEn: 'Al-Waer' },
      { id: 'HMS-03', nameAr: 'كرم الشامي', nameEn: 'Karam Al-Shami' },
      { id: 'HMS-04', nameAr: 'حي المحطة', nameEn: 'Al-Mahatta' },
      { id: 'HMS-05', nameAr: 'الإنشاءات', nameEn: 'Al-Inshaat' },
      { id: 'HMS-06', nameAr: 'الغوطة', nameEn: 'Al-Ghouta' },
      { id: 'HMS-07', nameAr: 'الحمرا', nameEn: 'Al-Hamra' },
      { id: 'HMS-08', nameAr: 'جورة الشياح', nameEn: 'Jouret Al-Shayah' },
      { id: 'HMS-09', nameAr: 'الريف الشمالي', nameEn: 'Northern Countryside' },
      { id: 'HMS-10', nameAr: 'تلكلخ', nameEn: 'Talkalakh' },
      { id: 'HMS-11', nameAr: 'القصير', nameEn: 'Al-Qusayr' },
      { id: 'HMS-12', nameAr: 'الرستن', nameEn: 'Al-Rastan' },
      { id: 'HMS-13', nameAr: 'تدمر', nameEn: 'Palmyra' },
      { id: 'HMS-14', nameAr: 'المخرم', nameEn: 'Al-Mukharram' },
    ]
  },
  {
    governorate: 'HAMA',
    cities: [
      { id: 'HAM-01', nameAr: 'مركز مدينة حماة', nameEn: 'Hama City Center' },
      { id: 'HAM-02', nameAr: 'حي الأندلس', nameEn: 'Al-Andalus' },
      { id: 'HAM-03', nameAr: 'حي الشريعة', nameEn: 'Al-Sharia' },
      { id: 'HAM-04', nameAr: 'حي الصابونية', nameEn: 'Al-Sabouniya' },
      { id: 'HAM-05', nameAr: 'سلمية', nameEn: 'Salamiyah' },
      { id: 'HAM-06', nameAr: 'محردة', nameEn: 'Mhardeh' },
      { id: 'HAM-07', nameAr: 'مصياف', nameEn: 'Masyaf' },
      { id: 'HAM-08', nameAr: 'السقيلبية', nameEn: 'Suqaylabiyah' },
      { id: 'HAM-09', nameAr: 'طيبة الإمام', nameEn: 'Tayyibat al-Imam' },
    ]
  },
  {
    governorate: 'LATAKIA',
    cities: [
      { id: 'LAT-01', nameAr: 'مركز مدينة اللاذقية', nameEn: 'Latakia City Center' },
      { id: 'LAT-02', nameAr: 'المشروع السابع', nameEn: '7th Project' },
      { id: 'LAT-03', nameAr: 'المشروع العاشر', nameEn: '10th Project' },
      { id: 'LAT-04', nameAr: 'حي الزراعة', nameEn: 'Al-Ziraa' },
      { id: 'LAT-05', nameAr: 'حي الأوقاف', nameEn: 'Al-Awqaf' },
      { id: 'LAT-06', nameAr: 'جبلة', nameEn: 'Jableh' },
      { id: 'LAT-07', nameAr: 'القرداحة', nameEn: 'Al-Qardaha' },
      { id: 'LAT-08', nameAr: 'الحفة', nameEn: 'Al-Haffah' },
      { id: 'LAT-09', nameAr: 'صلنفة', nameEn: 'Slunfeh' },
      { id: 'LAT-10', nameAr: 'كسب', nameEn: 'Kessab' },
    ]
  },
  {
    governorate: 'TARTUS',
    cities: [
      { id: 'TAR-01', nameAr: 'مركز مدينة طرطوس', nameEn: 'Tartus City Center' },
      { id: 'TAR-02', nameAr: 'بانياس', nameEn: 'Baniyas' },
      { id: 'TAR-03', nameAr: 'صافيتا', nameEn: 'Safita' },
      { id: 'TAR-04', nameAr: 'الدريكيش', nameEn: 'Dreikish' },
      { id: 'TAR-05', nameAr: 'الشيخ بدر', nameEn: 'Sheikh Badr' },
      { id: 'TAR-06', nameAr: 'مشتى الحلو', nameEn: 'Mashta al-Helu' },
      { id: 'TAR-07', nameAr: 'طرطوس القديمة', nameEn: 'Old Tartus' },
      { id: 'TAR-08', nameAr: 'الصفصافة', nameEn: 'Al-Safsafah' },
    ]
  },
  {
    governorate: 'IDLIB',
    cities: [
      { id: 'IDB-01', nameAr: 'مركز مدينة إدلب', nameEn: 'Idlib City Center' },
      { id: 'IDB-02', nameAr: 'أريحا', nameEn: 'Ariha' },
      { id: 'IDB-03', nameAr: 'جسر الشغور', nameEn: 'Jisr al-Shughur' },
      { id: 'IDB-04', nameAr: 'معرة النعمان', nameEn: 'Maarat al-Numaan' },
      { id: 'IDB-05', nameAr: 'سرمدا', nameEn: 'Sarmada' },
      { id: 'IDB-06', nameAr: 'الدانا', nameEn: 'Al-Dana' },
      { id: 'IDB-07', nameAr: 'سلقين', nameEn: 'Salqin' },
      { id: 'IDB-08', nameAr: 'حارم', nameEn: 'Harem' },
    ]
  },
  {
    governorate: 'DEIR_EZ_ZOR',
    cities: [
      { id: 'DEZ-01', nameAr: 'مركز مدينة دير الزور', nameEn: 'Deir ez-Zor City Center' },
      { id: 'DEZ-02', nameAr: 'الميادين', nameEn: 'Mayadin' },
      { id: 'DEZ-03', nameAr: 'البوكمال', nameEn: 'Al-Bukamal' },
      { id: 'DEZ-04', nameAr: 'القورية', nameEn: 'Al-Quriyah' },
    ]
  },
  {
    governorate: 'RAQQA',
    cities: [
      { id: 'RAQ-01', nameAr: 'مركز مدينة الرقة', nameEn: 'Raqqa City Center' },
      { id: 'RAQ-02', nameAr: 'الطبقة', nameEn: 'Al-Thawrah' },
      { id: 'RAQ-03', nameAr: 'تل أبيض', nameEn: 'Tell Abyad' },
    ]
  },
  {
    governorate: 'HASAKAH',
    cities: [
      { id: 'HAS-01', nameAr: 'الحسكة', nameEn: 'Hasakah' },
      { id: 'HAS-02', nameAr: 'القامشلي', nameEn: 'Qamishli' },
      { id: 'HAS-03', nameAr: 'المالكية', nameEn: 'Al-Malikiyah' },
      { id: 'HAS-04', nameAr: 'رأس العين', nameEn: 'Ras al-Ayn' },
      { id: 'HAS-05', nameAr: 'عامودا', nameEn: 'Amuda' },
      { id: 'HAS-06', nameAr: 'الدرباسية', nameEn: 'Al-Darbasiyah' },
    ]
  },
  {
    governorate: 'DARAA',
    cities: [
      { id: 'DAR-01', nameAr: 'مركز مدينة درعا', nameEn: 'Daraa City Center' },
      { id: 'DAR-02', nameAr: 'نوى', nameEn: 'Nawa' },
      { id: 'DAR-03', nameAr: 'إزرع', nameEn: 'Izra' },
      { id: 'DAR-04', nameAr: 'بصرى الشام', nameEn: 'Bosra' },
      { id: 'DAR-05', nameAr: 'الصنمين', nameEn: 'Al-Sanamayn' },
      { id: 'DAR-06', nameAr: 'طفس', nameEn: 'Tafas' },
    ]
  },
  {
    governorate: 'SUWAYDA',
    cities: [
      { id: 'SUW-01', nameAr: 'مركز مدينة السويداء', nameEn: 'Suwayda City Center' },
      { id: 'SUW-02', nameAr: 'شهبا', nameEn: 'Shahba' },
      { id: 'SUW-03', nameAr: 'صلخد', nameEn: 'Salkhad' },
      { id: 'SUW-04', nameAr: 'القريا', nameEn: 'Al-Qurayya' },
    ]
  },
  {
    governorate: 'QUNEITRA',
    cities: [
      { id: 'QUN-01', nameAr: 'مدينة القنيطرة', nameEn: 'Quneitra City' },
      { id: 'QUN-02', nameAr: 'خان أرنبة', nameEn: 'Khan Arnabah' },
      { id: 'QUN-03', nameAr: 'البعث', nameEn: 'Madinat al-Baath' },
    ]
  }
];
