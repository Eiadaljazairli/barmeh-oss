export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox';
  required: boolean;
  options?: { label: string; value: string | number }[];
  placeholder?: string;
}

export const CATEGORY_FIELDS: Record<string, FieldConfig[]> = {
  cars: [
    { key: 'brand', label: 'الماركة', type: 'text', required: true, placeholder: 'مثال: BMW, Mercedes' },
    { key: 'model', label: 'الموديل', type: 'text', required: true, placeholder: 'مثال: 320i, E-Class' },
    { key: 'year', label: 'سنة الصنع', type: 'number', required: true, placeholder: '2020' },
    { key: 'mileage', label: 'المسافة المقطوعة (km)', type: 'number', required: true, placeholder: '150000' },
    { key: 'condition', label: 'حالة السيارة', type: 'select', required: true, options: [
      { label: 'ممتازة', value: 'excellent' },
      { label: 'جيدة جداً', value: 'very_good' },
      { label: 'جيدة', value: 'good' },
      { label: 'تحتاج ترميم', value: 'needs_repair' },
    ]},
    { key: 'transmission', label: 'ناقل الحركة', type: 'select', required: true, options: [
      { label: 'أوتوماتيك', value: 'automatic' },
      { label: 'يدوي', value: 'manual' },
    ]},
    { key: 'fuelType', label: 'نوع الوقود', type: 'select', required: true, options: [
      { label: 'بنزين', value: 'petrol' },
      { label: 'ديزل', value: 'diesel' },
      { label: 'هجين', value: 'hybrid' },
      { label: 'كهربائي', value: 'electric' },
    ]},
    { key: 'color', label: 'اللون', type: 'text', required: false, placeholder: 'أسود، أبيض، إلخ' },
    { key: 'enginePower', label: 'قوة المحرك', type: 'text', required: false, placeholder: 'مثال: 2000cc، 150hp' },
    { key: 'previousOwners', label: 'عدد المالكين السابقين', type: 'select', required: false, options: [
      { label: 'لا يوجد', value: '0' },
      { label: 'مالك واحد', value: '1' },
      { label: 'مالكان', value: '2' },
      { label: 'ثلاثة مالكين أو أكثر', value: '3+' },
    ]},
  ],

  motorcycles: [
    { key: 'brand', label: 'الماركة', type: 'text', required: true },
    { key: 'model', label: 'الموديل', type: 'text', required: true },
    { key: 'year', label: 'سنة الصنع', type: 'number', required: true },
    { key: 'mileage', label: 'المسافة المقطوعة (km)', type: 'number', required: true },
    { key: 'condition', label: 'الحالة', type: 'select', required: true, options: [
      { label: 'ممتازة', value: 'excellent' },
      { label: 'جيدة', value: 'good' },
      { label: 'تحتاج ترميم', value: 'needs_repair' },
    ]},
    { key: 'engineCapacity', label: 'سعة المحرك (CC)', type: 'number', required: false },
  ],

  realestate: [
    { key: 'propertyType', label: 'نوع العقار', type: 'select', required: true, options: [
      { label: 'شقة', value: 'apartment' },
      { label: 'منزل', value: 'house' },
      { label: 'أرض', value: 'land' },
      { label: 'فيلا', value: 'villa' },
      { label: 'تاون هاوس', value: 'townhouse' },
    ]},
    { key: 'listingType', label: 'نوع العرض', type: 'select', required: true, options: [
      { label: 'بيع', value: 'sale' },
      { label: 'إيجار', value: 'rent' },
    ]},
    { key: 'area', label: 'المساحة (متر مربع)', type: 'number', required: true, placeholder: '150' },
    { key: 'rooms', label: 'عدد الغرف', type: 'select', required: false, options: [
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '4', value: '4' },
      { label: '5+', value: '5' },
    ]},
    { key: 'bathrooms', label: 'عدد الحمامات', type: 'select', required: false, options: [
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '4+', value: '4' },
    ]},
    { key: 'floor', label: 'الطابق', type: 'text', required: false, placeholder: 'أرضي، أول، ثاني، إلخ' },
    { key: 'furnished', label: 'مفروشة؟', type: 'checkbox', required: false },
    { key: 'yearBuilt', label: 'سنة البناء', type: 'number', required: false, placeholder: '2020' },
    { key: 'amenities', label: 'التجهيزات', type: 'text', required: false, placeholder: 'مصعد، موقف سيارة، إلخ' },
  ],

  'realestate-apartments-sell': [
    { key: 'propertyType', label: 'نوع العقار', type: 'select', required: true, options: [
      { label: 'شقة', value: 'apartment' },
      { label: 'فيلا', value: 'villa' },
    ]},
    { key: 'area', label: 'المساحة (متر مربع)', type: 'number', required: true, placeholder: '150' },
    { key: 'rooms', label: 'عدد الغرف', type: 'select', required: false, options: [
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '4', value: '4' },
      { label: '5+', value: '5' },
    ]},
    { key: 'bathrooms', label: 'عدد الحمامات', type: 'select', required: false, options: [
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '4+', value: '4' },
    ]},
    { key: 'floor', label: 'الطابق', type: 'text', required: false, placeholder: 'أرضي، أول، ثاني، إلخ' },
    { key: 'furnished', label: 'مفروشة؟', type: 'checkbox', required: false },
    { key: 'yearBuilt', label: 'سنة البناء', type: 'number', required: false, placeholder: '2020' },
    { key: 'amenities', label: 'التجهيزات', type: 'text', required: false, placeholder: 'مصعد، موقف سيارة، إلخ' },
  ],

  'realestate-apartments-rent': [
    { key: 'propertyType', label: 'نوع العقار', type: 'select', required: true, options: [
      { label: 'شقة', value: 'apartment' },
      { label: 'فيلا', value: 'villa' },
    ]},
    { key: 'area', label: 'المساحة (متر مربع)', type: 'number', required: true, placeholder: '150' },
    { key: 'rooms', label: 'عدد الغرف', type: 'select', required: false, options: [
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '4', value: '4' },
      { label: '5+', value: '5' },
    ]},
    { key: 'bathrooms', label: 'عدد الحمامات', type: 'select', required: false, options: [
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '4+', value: '4' },
    ]},
    { key: 'floor', label: 'الطابق', type: 'text', required: false, placeholder: 'أرصي، أول، ثاني، إلخ' },
    { key: 'furnished', label: 'مفروشة؟', type: 'checkbox', required: false },
    { key: 'amenities', label: 'التجهيزات', type: 'text', required: false, placeholder: 'مصعد، موقف سيارة، إلخ' },
  ],

  apartments: [
    { key: 'rooms', label: 'عدد الغرف', type: 'select', required: true, options: [
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '4', value: '4' },
      { label: '5+', value: '5' },
    ]},
    { key: 'bathrooms', label: 'عدد الحمامات', type: 'select', required: true, options: [
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '4+', value: '4' },
    ]},
    { key: 'area', label: 'المساحة (متر مربع)', type: 'number', required: true, placeholder: '120' },
    { key: 'floor', label: 'الطابق', type: 'text', required: false, placeholder: 'ارضي، أول، إلخ' },
    { key: 'furnished', label: 'مفروشة؟', type: 'checkbox', required: false },
    { key: 'amenities', label: 'التجهيزات', type: 'text', required: false, placeholder: 'مصعد، موقف سيارة، إلخ' },
  ],

  houses: [
    { key: 'rooms', label: 'عدد الغرف', type: 'select', required: true, options: [
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '4', value: '4' },
      { label: '5+', value: '5' },
    ]},
    { key: 'area', label: 'المساحة (متر مربع)', type: 'number', required: true },
    { key: 'hasGarden', label: 'فيها حديقة؟', type: 'checkbox', required: false },
    { key: 'condition', label: 'الحالة', type: 'select', required: true, options: [
      { label: 'جديدة', value: 'new' },
      { label: 'مستخدمة - ممتازة', value: 'excellent' },
      { label: 'مستخدمة - جيدة', value: 'good' },
      { label: 'تحتاج ترميم', value: 'needs_repair' },
    ]},
  ],

  land: [
    { key: 'area', label: 'المساحة (متر مربع)', type: 'number', required: true },
    { key: 'landType', label: 'نوع الأرض', type: 'select', required: true, options: [
      { label: 'سكنية', value: 'residential' },
      { label: 'تجارية', value: 'commercial' },
      { label: 'زراعية', value: 'agricultural' },
      { label: 'صناعية', value: 'industrial' },
    ]},
    { key: 'accessible', label: 'يمكن الوصول إليها؟', type: 'checkbox', required: false },
  ],

  clothing: [
    { key: 'size', label: 'الحجم', type: 'select', required: true, options: [
      { label: 'XS', value: 'xs' },
      { label: 'S', value: 's' },
      { label: 'M', value: 'm' },
      { label: 'L', value: 'l' },
      { label: 'XL', value: 'xl' },
      { label: 'XXL', value: 'xxl' },
    ]},
    { key: 'color', label: 'اللون', type: 'text', required: true, placeholder: 'أسود، أبيض، إلخ' },
    { key: 'brand', label: 'الماركة', type: 'text', required: false },
    { key: 'material', label: 'المادة', type: 'text', required: false, placeholder: 'قطن، صوف، إلخ' },
    { key: 'condition', label: 'الحالة', type: 'select', required: true, options: [
      { label: 'جديد - لم يلبس', value: 'new' },
      { label: 'مستخدم - ممتاز', value: 'excellent' },
      { label: 'مستخدم - جيد', value: 'good' },
      { label: 'مستخدم - متوسط', value: 'fair' },
    ]},
  ],

  shoes: [
    { key: 'size', label: 'المقاس', type: 'text', required: true, placeholder: '42' },
    { key: 'color', label: 'اللون', type: 'text', required: true },
    { key: 'brand', label: 'الماركة', type: 'text', required: false },
    { key: 'condition', label: 'الحالة', type: 'select', required: true, options: [
      { label: 'جديد', value: 'new' },
      { label: 'ممتاز', value: 'excellent' },
      { label: 'جيد', value: 'good' },
      { label: 'متوسط', value: 'fair' },
    ]},
  ],

  electronics: [
    { key: 'brand', label: 'الماركة', type: 'text', required: true },
    { key: 'model', label: 'الموديل', type: 'text', required: true },
    { key: 'condition', label: 'الحالة', type: 'select', required: true, options: [
      { label: 'جديد - لم يفتح', value: 'new' },
      { label: 'مستخدم - ممتاز', value: 'excellent' },
      { label: 'مستخدم - جيد', value: 'good' },
      { label: 'يحتاج إصلاح', value: 'needs_repair' },
    ]},
    { key: 'warranty', label: 'ضمان؟', type: 'text', required: false, placeholder: 'مثال: سنة واحدة' },
    { key: 'original', label: 'أصلي/تقليد؟', type: 'select', required: true, options: [
      { label: 'أصلي 100%', value: 'original' },
      { label: 'تقليد عالي الجودة', value: 'high_quality' },
    ]},
  ],

  mobiles: [
    { key: 'brand', label: 'الماركة', type: 'text', required: true },
    { key: 'model', label: 'الموديل', type: 'text', required: true },
    { key: 'storage', label: 'السعة التخزينية', type: 'text', required: true, placeholder: '128GB' },
    { key: 'condition', label: 'الحالة', type: 'select', required: true, options: [
      { label: 'جديد', value: 'new' },
      { label: 'ممتاز', value: 'excellent' },
      { label: 'جيد', value: 'good' },
      { label: 'متوسط', value: 'fair' },
    ]},
    { key: 'boxed', label: 'مع الصندوق والملحقات؟', type: 'checkbox', required: false },
  ],

  'mobiles-accessories': [
    { key: 'type', label: 'نوع الاكسسوار', type: 'text', required: true, placeholder: 'شاحن، حامل، إلخ' },
    { key: 'brand', label: 'الماركة', type: 'text', required: false },
    { key: 'condition', label: 'الحالة', type: 'select', required: true, options: [
      { label: 'جديد', value: 'new' },
      { label: 'ممتاز', value: 'excellent' },
      { label: 'جيد', value: 'good' },
    ]},
  ],

  'electronics-laptops': [
    { key: 'brand', label: 'الماركة', type: 'text', required: true },
    { key: 'model', label: 'الموديل', type: 'text', required: true },
    { key: 'processor', label: 'المعالج', type: 'text', required: false, placeholder: 'Intel i7, Ryzen 5' },
    { key: 'ram', label: 'الذاكرة RAM', type: 'text', required: false, placeholder: '8GB, 16GB' },
    { key: 'storage', label: 'التخزين', type: 'text', required: false, placeholder: 'SSD 256GB' },
    { key: 'condition', label: 'الحالة', type: 'select', required: true, options: [
      { label: 'جديد', value: 'new' },
      { label: 'ممتاز', value: 'excellent' },
      { label: 'جيد', value: 'good' },
      { label: 'يحتاج إصلاح', value: 'needs_repair' },
    ]},
  ],

  'electronics-tablets': [
    { key: 'brand', label: 'الماركة', type: 'text', required: true },
    { key: 'model', label: 'الموديل', type: 'text', required: true },
    { key: 'storage', label: 'السعة التخزينية', type: 'text', required: false },
    { key: 'condition', label: 'الحالة', type: 'select', required: true, options: [
      { label: 'جديد', value: 'new' },
      { label: 'ممتاز', value: 'excellent' },
      { label: 'جيد', value: 'good' },
    ]},
  ],

  mobile_phones: [
    { key: 'brand', label: 'الماركة', type: 'text', required: true },
    { key: 'model', label: 'الموديل', type: 'text', required: true },
    { key: 'storage', label: 'السعة التخزينية', type: 'text', required: true, placeholder: '128GB' },
    { key: 'condition', label: 'الحالة', type: 'select', required: true, options: [
      { label: 'جديد', value: 'new' },
      { label: 'ممتاز', value: 'excellent' },
      { label: 'جيد', value: 'good' },
      { label: 'متوسط', value: 'fair' },
    ]},
    { key: 'boxed', label: 'مع الصندوق والملحقات؟', type: 'checkbox', required: false },
  ],

  furniture: [
    { key: 'material', label: 'المادة', type: 'select', required: true, options: [
      { label: 'خشب', value: 'wood' },
      { label: 'معادن', value: 'metal' },
      { label: 'جلد', value: 'leather' },
      { label: 'قماش', value: 'fabric' },
      { label: 'أخرى', value: 'other' },
    ]},
    { key: 'color', label: 'اللون', type: 'text', required: true },
    { key: 'condition', label: 'الحالة', type: 'select', required: true, options: [
      { label: 'جديد', value: 'new' },
      { label: 'ممتاز', value: 'excellent' },
      { label: 'جيد', value: 'good' },
      { label: 'متوسط', value: 'fair' },
    ]},
    { key: 'dimensions', label: 'الأبعاد التقريبية', type: 'text', required: false, placeholder: 'طول × عرض × ارتفاع' },
  ],

  books: [
    { key: 'author', label: 'المؤلف', type: 'text', required: true },
    { key: 'publisher', label: 'الناشر', type: 'text', required: false },
    { key: 'language', label: 'اللغة', type: 'select', required: true, options: [
      { label: 'العربية', value: 'arabic' },
      { label: 'الإنجليزية', value: 'english' },
      { label: 'أخرى', value: 'other' },
    ]},
    { key: 'condition', label: 'الحالة', type: 'select', required: true, options: [
      { label: 'جديد', value: 'new' },
      { label: 'بحالة جيدة', value: 'good' },
      { label: 'بها بعض الآثار', value: 'fair' },
    ]},
  ],

  jobs: [
    { key: 'jobType', label: 'نوع الوظيفة', type: 'select', required: true, options: [
      { label: 'دوام كامل', value: 'full_time' },
      { label: 'دوام جزئي', value: 'part_time' },
      { label: 'عقد محدد المدة', value: 'contract' },
      { label: 'عمل حر', value: 'freelance' },
    ]},
    { key: 'experience', label: 'سنوات الخبرة المطلوبة', type: 'text', required: true, placeholder: '2-5 سنوات' },
    { key: 'qualification', label: 'المؤهل المطلوب', type: 'text', required: true, placeholder: 'بكالوريوس، دبلوم، إلخ' },
  ],

  services: [
    { key: 'serviceType', label: 'نوع الخدمة', type: 'text', required: true },
    { key: 'experience', label: 'سنوات الخبرة', type: 'text', required: false, placeholder: '5 سنوات' },
  ],

  'cars-sedan': [
    { key: 'brand', label: 'الماركة', type: 'text', required: true },
    { key: 'model', label: 'الموديل', type: 'text', required: true },
    { key: 'year', label: 'سنة الصنع', type: 'number', required: true },
    { key: 'mileage', label: 'المسافة المقطوعة (km)', type: 'number', required: true },
    { key: 'condition', label: 'الحالة', type: 'select', required: true, options: [
      { label: 'ممتازة', value: 'excellent' },
      { label: 'جيدة', value: 'good' },
      { label: 'تحتاج ترميم', value: 'needs_repair' },
    ]},
  ],

  'cars-suv': [
    { key: 'brand', label: 'الماركة', type: 'text', required: true },
    { key: 'model', label: 'الموديل', type: 'text', required: true },
    { key: 'year', label: 'سنة الصنع', type: 'number', required: true },
    { key: 'condition', label: 'الحالة', type: 'select', required: true, options: [
      { label: 'ممتازة', value: 'excellent' },
      { label: 'جيدة', value: 'good' },
    ]},
  ],

  'cars-bikes': [
    { key: 'brand', label: 'الماركة', type: 'text', required: true },
    { key: 'model', label: 'الموديل', type: 'text', required: true },
    { key: 'year', label: 'سنة الصنع', type: 'number', required: true },
    { key: 'condition', label: 'الحالة', type: 'select', required: true, options: [
      { label: 'ممتازة', value: 'excellent' },
      { label: 'جيدة', value: 'good' },
    ]},
  ],

  'furniture-bedroom': [
    { key: 'material', label: 'المادة', type: 'select', required: true, options: [
      { label: 'خشب', value: 'wood' },
      { label: 'معادن', value: 'metal' },
    ]},
    { key: 'color', label: 'اللون', type: 'text', required: true },
    { key: 'condition', label: 'الحالة', type: 'select', required: true, options: [
      { label: 'جديد', value: 'new' },
      { label: 'ممتاز', value: 'excellent' },
    ]},
  ],

  'furniture-living': [
    { key: 'type', label: 'نوع الأثاث', type: 'text', required: true, placeholder: 'أريكة، كنبة، إلخ' },
    { key: 'material', label: 'المادة', type: 'select', required: true, options: [
      { label: 'جلد', value: 'leather' },
      { label: 'قماش', value: 'fabric' },
    ]},
    { key: 'condition', label: 'الحالة', type: 'select', required: true, options: [
      { label: 'جديد', value: 'new' },
      { label: 'ممتاز', value: 'excellent' },
    ]},
  ],

  'clothing-men': [
    { key: 'type', label: 'نوع الملابس', type: 'text', required: true },
    { key: 'size', label: 'الحجم', type: 'select', required: true, options: [
      { label: 'S', value: 's' },
      { label: 'M', value: 'm' },
      { label: 'L', value: 'l' },
      { label: 'XL', value: 'xl' },
    ]},
    { key: 'condition', label: 'الحالة', type: 'select', required: true, options: [
      { label: 'جديد', value: 'new' },
      { label: 'مستخدم', value: 'used' },
    ]},
  ],

  'clothing-women': [
    { key: 'type', label: 'نوع الملابس', type: 'text', required: true },
    { key: 'size', label: 'الحجم', type: 'select', required: true, options: [
      { label: 'XS', value: 'xs' },
      { label: 'S', value: 's' },
      { label: 'M', value: 'm' },
      { label: 'L', value: 'l' },
    ]},
    { key: 'condition', label: 'الحالة', type: 'select', required: true, options: [
      { label: 'جديد', value: 'new' },
      { label: 'مستخدم', value: 'used' },
    ]},
  ],

  'other-pets': [
    { key: 'animalType', label: 'النوع', type: 'select', required: true, options: [
      { label: 'كلب', value: 'dog' },
      { label: 'قطة', value: 'cat' },
      { label: 'طائر', value: 'bird' },
      { label: 'سمكة', value: 'fish' },
      { label: 'أرنب', value: 'rabbit' },
      { label: 'هامستر', value: 'hamster' },
      { label: 'ببغاء', value: 'parrot' },
      { label: 'أخرى', value: 'other' },
    ]},
    { key: 'breed', label: 'السلالة', type: 'text', required: true },
    { key: 'age', label: 'العمر', type: 'text', required: true },
    { key: 'gender', label: 'الجنس', type: 'select', required: true, options: [
      { label: 'ذكر', value: 'male' },
      { label: 'أنثى', value: 'female' },
    ]},
    { key: 'healthStatus', label: 'الحالة الصحية', type: 'select', required: false, options: [
      { label: 'صحي', value: 'healthy' },
      { label: 'مطعم', value: 'vaccinated' },
    ]},
    { key: 'vaccinated', label: 'مطعّم؟', type: 'checkbox', required: false },
  ],

  'other-books': [
    { key: 'title', label: 'اسم الكتاب', type: 'text', required: true },
    { key: 'author', label: 'المؤلف', type: 'text', required: true },
    { key: 'condition', label: 'الحالة', type: 'select', required: true, options: [
      { label: 'جديد', value: 'new' },
      { label: 'بحالة جيدة', value: 'good' },
    ]},
  ],
};

export function getCategoryFields(categoryName: string): FieldConfig[] {
  const normalizedName = categoryName.toLowerCase().replace(/\s+/g, '_');
  return CATEGORY_FIELDS[normalizedName] || [];
}

export const PRICE_STATUS_OPTIONS = [
  { label: 'قابل للتفاوض', value: 'negotiable', emoji: '💬' },
  { label: 'سعر نهائي', value: 'final', emoji: '✓' },
  { label: 'مجاني', value: 'free', emoji: '🎁' },
];
