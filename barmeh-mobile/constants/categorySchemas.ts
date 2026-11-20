export interface CategoryField {
  key: string;
  labelAr: string;
  labelEn: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  required: boolean;
  options?: { labelAr: string; labelEn: string; value: string }[];
  suffixAr?: string;
  suffixEn?: string;
  placeholderAr?: string;
  placeholderEn?: string;
}

export const CATEGORY_SCHEMAS: { [key: string]: CategoryField[] } = {
  cars: [
    { key: 'make', labelAr: 'الماركة', labelEn: 'Make', type: 'text', required: true },
    { key: 'model', labelAr: 'الموديل', labelEn: 'Model', type: 'text', required: true },
    { key: 'year', labelAr: 'سنة الصنع', labelEn: 'Year', type: 'number', required: true },
    { key: 'mileage', labelAr: 'المسافة المقطوعة', labelEn: 'Mileage', type: 'number', required: true, suffixAr: 'كم', suffixEn: 'km' },
    { 
      key: 'fuel_type', labelAr: 'نوع الوقود', labelEn: 'Fuel Type', type: 'select', required: true,
      options: [
        { labelAr: 'بنزين', labelEn: 'Petrol', value: 'petrol' },
        { labelAr: 'ديزل', labelEn: 'Diesel', value: 'diesel' },
        { labelAr: 'هايبرد', labelEn: 'Hybrid', value: 'hybrid' },
        { labelAr: 'كهرباء', labelEn: 'Electric', value: 'electric' },
        { labelAr: 'غاز', labelEn: 'Gas', value: 'lpg' }
      ]
    },
    { 
      key: 'transmission', labelAr: 'ناقل الحركة', labelEn: 'Transmission', type: 'select', required: true,
      options: [
        { labelAr: 'أوتوماتيك', labelEn: 'Automatic', value: 'automatic' },
        { labelAr: 'يدوي (عادي)', labelEn: 'Manual', value: 'manual' }
      ]
    },
    { key: 'engine_power', labelAr: 'قوة المحرك', labelEn: 'Engine Power', type: 'number', required: false, suffixAr: 'حصان', suffixEn: 'HP' },
    { key: 'doors', labelAr: 'عدد الأبواب', labelEn: 'Doors', type: 'number', required: false },
    { key: 'color', labelAr: 'اللون الخارجي', labelEn: 'Exterior Color', type: 'text', required: false },
    { 
      key: 'condition', labelAr: 'الحالة', labelEn: 'Condition', type: 'select', required: true,
      options: [
        { labelAr: 'جديدة', labelEn: 'New', value: 'new' },
        { labelAr: 'مستعملة - ممتازة', labelEn: 'Used - Excellent', value: 'excellent' },
        { labelAr: 'مستعملة - جيدة', labelEn: 'Used - Good', value: 'good' },
        { labelAr: 'تحتاج إصلاح', labelEn: 'Needs Repair', value: 'needs_repair' }
      ]
    }
  ],
  'cars-parts': [
    { key: 'brand', labelAr: 'الماركة', labelEn: 'Brand', type: 'text', required: false },
    { key: 'part_type', labelAr: 'نوع القطعة', labelEn: 'Part Type', type: 'text', required: true },
    { 
      key: 'condition', labelAr: 'الحالة', labelEn: 'Condition', type: 'select', required: true,
      options: [
        { labelAr: 'جديدة', labelEn: 'New', value: 'new' },
        { labelAr: 'مستعملة - أصلية', labelEn: 'Used - Original', value: 'used_original' },
        { labelAr: 'مستعملة', labelEn: 'Used', value: 'used' }
      ]
    }
  ],
  'cars-maintenance': [
    { key: 'brand', labelAr: 'الماركة / النوع', labelEn: 'Brand / Type', type: 'text', required: true },
    { key: 'service_type', labelAr: 'نوع الخدمة / الزيت', labelEn: 'Service / Oil Type', type: 'text', required: true },
    { key: 'origin', labelAr: 'بلد المنشأ', labelEn: 'Origin', type: 'text', required: false }
  ],
  'cars-tires': [
    { key: 'brand', labelAr: 'الماركة', labelEn: 'Brand', type: 'text', required: true },
    { key: 'size', labelAr: 'المقاس', labelEn: 'Size', type: 'text', required: true },
    { key: 'production_year', labelAr: 'سنة الإنتاج', labelEn: 'Production Year', type: 'number', required: false },
    { 
      key: 'condition', labelAr: 'الحالة', labelEn: 'Condition', type: 'select', required: true,
      options: [
        { labelAr: 'جديدة', labelEn: 'New', value: 'new' },
        { labelAr: 'مستعملة', labelEn: 'Used', value: 'used' }
      ]
    }
  ],
  'cars-bikes': [
    { key: 'make', labelAr: 'الماركة', labelEn: 'Make', type: 'text', required: true },
    { key: 'model', labelAr: 'الموديل', labelEn: 'Model', type: 'text', required: true },
    { key: 'year', labelAr: 'سنة الصنع', labelEn: 'Year', type: 'number', required: true },
    { key: 'engine_size', labelAr: 'سعة المحرك', labelEn: 'Engine Size', type: 'number', required: true, suffixAr: 'CC', suffixEn: 'CC' },
    { 
      key: 'condition', labelAr: 'الحالة', labelEn: 'Condition', type: 'select', required: true,
      options: [
        { labelAr: 'جديدة', labelEn: 'New', value: 'new' },
        { labelAr: 'مستعملة - ممتازة', labelEn: 'Used - Excellent', value: 'excellent' },
        { labelAr: 'مستعملة - جيدة', labelEn: 'Used - Good', value: 'good' }
      ]
    }
  ],
  realestate: [
    { 
      key: 'property_type', labelAr: 'نوع العقار', labelEn: 'Property Type', type: 'select', required: true,
      options: [
        { labelAr: 'شقة', labelEn: 'Apartment', value: 'apartment' },
        { labelAr: 'منزل / فيلا', labelEn: 'House/Villa', value: 'house' },
        { labelAr: 'مكتب', labelEn: 'Office', value: 'office' },
        { labelAr: 'محل تجاري', labelEn: 'Shop', value: 'shop' },
        { labelAr: 'أرض', labelEn: 'Land', value: 'land' }
      ]
    },
    { key: 'area', labelAr: 'المساحة', labelEn: 'Area', type: 'number', required: true, suffixAr: 'م²', suffixEn: 'm²' },
    { key: 'rooms', labelAr: 'عدد الغرف', labelEn: 'Rooms', type: 'number', required: true },
    { key: 'bathrooms', labelAr: 'عدد الحمامات', labelEn: 'Bathrooms', type: 'number', required: false },
    { key: 'floor', labelAr: 'الطابق', labelEn: 'Floor', type: 'number', required: false },
    { key: 'furnished', labelAr: 'مفروش', labelEn: 'Furnished', type: 'boolean', required: true }
  ],
  'realestate-land': [
    { key: 'area', labelAr: 'المساحة', labelEn: 'Area', type: 'number', required: true, suffixAr: 'م²', suffixEn: 'm²' },
    { 
      key: 'land_type', labelAr: 'نوع الأرض', labelEn: 'Land Type', type: 'select', required: true,
      options: [
        { labelAr: 'زراعية', labelEn: 'Agricultural', value: 'agricultural' },
        { labelAr: 'سكنية', labelEn: 'Residential', value: 'residential' },
        { labelAr: 'تجارية', labelEn: 'Commercial', value: 'commercial' },
        { labelAr: 'صناعية', labelEn: 'Industrial', value: 'industrial' }
      ]
    },
    { key: 'legal_status', labelAr: 'الوضع القانوني', labelEn: 'Legal Status', type: 'text', required: false, placeholderAr: 'طابو أخضر، كاتب عدل...' }
  ],
  electronics: [
    { key: 'brand', labelAr: 'الماركة', labelEn: 'Brand', type: 'text', required: true },
    { key: 'model', labelAr: 'الموديل', labelEn: 'Model', type: 'text', required: true },
    { 
      key: 'condition', labelAr: 'الحالة', labelEn: 'Condition', type: 'select', required: true,
      options: [
        { labelAr: 'جديد بكرتونه', labelEn: 'New/Boxed', value: 'new' },
        { labelAr: 'مستعمل كأنه جديد', labelEn: 'Like New', value: 'like_new' },
        { labelAr: 'مستعمل - جيد', labelEn: 'Used - Good', value: 'good' }
      ]
    }
  ],
  mobiles: [
    { key: 'brand', labelAr: 'الماركة', labelEn: 'Brand', type: 'text', required: true },
    { key: 'model', labelAr: 'الموديل', labelEn: 'Model', type: 'text', required: true },
    { key: 'storage', labelAr: 'سعة التخزين', labelEn: 'Storage', type: 'select', required: true,
      options: [
        { labelAr: '64 جيجا', labelEn: '64 GB', value: '64gb' },
        { labelAr: '128 جيجا', labelEn: '128 GB', value: '128gb' },
        { labelAr: '256 جيجا', labelEn: '256 GB', value: '256gb' },
        { labelAr: '512 جيجا', labelEn: '512 GB', value: '512gb' },
        { labelAr: '1 تيرا', labelEn: '1 TB', value: '1tb' }
      ]
    },
    { 
      key: 'condition', labelAr: 'الحالة', labelEn: 'Condition', type: 'select', required: true,
      options: [
        { labelAr: 'جديد بكرتونه', labelEn: 'New/Boxed', value: 'new' },
        { labelAr: 'مستعمل كأنه جديد', labelEn: 'Like New', value: 'like_new' },
        { labelAr: 'مستعمل - جيد', labelEn: 'Used - Good', value: 'good' }
      ]
    }
  ],
  'mobiles-accessories': [
    { key: 'brand', labelAr: 'الماركة', labelEn: 'Brand', type: 'text', required: false },
    { 
      key: 'type', labelAr: 'نوع الإكسسوار', labelEn: 'Accessory Type', type: 'select', required: true,
      options: [
        { labelAr: 'شاحن / كبل', labelEn: 'Charger/Cable', value: 'charger' },
        { labelAr: 'سماعات', labelEn: 'Headphones', value: 'headphones' },
        { labelAr: 'غطاء (كفر)', labelEn: 'Case/Cover', value: 'case' },
        { labelAr: 'حماية شاشة', labelEn: 'Screen Protector', value: 'protector' },
        { labelAr: 'ساعة ذكية', labelEn: 'Smart Watch', value: 'smartwatch' },
        { labelAr: 'بطارية', labelEn: 'Battery', value: 'battery' },
        { labelAr: 'أخرى', labelEn: 'Other', value: 'other' }
      ]
    },
    { 
      key: 'condition', labelAr: 'الحالة', labelEn: 'Condition', type: 'select', required: true,
      options: [
        { labelAr: 'جديد', labelEn: 'New', value: 'new' },
        { labelAr: 'مستعمل بحالة ممتازة', labelEn: 'Used - Excellent', value: 'excellent' },
        { labelAr: 'مستعمل بحالة جيدة', labelEn: 'Used - Good', value: 'good' }
      ]
    }
  ],
  'electronics-laptops': [
    { key: 'brand', labelAr: 'الماركة', labelEn: 'Brand', type: 'text', required: true },
    { key: 'model', labelAr: 'الموديل', labelEn: 'Model', type: 'text', required: true },
    { key: 'processor', labelAr: 'المعالج', labelEn: 'Processor', type: 'text', required: true },
    { key: 'ram', labelAr: 'الرام (RAM)', labelEn: 'RAM', type: 'number', required: true, suffixAr: 'جيجا', suffixEn: 'GB' },
    { 
      key: 'condition', labelAr: 'الحالة', labelEn: 'Condition', type: 'select', required: true,
      options: [
        { labelAr: 'جديد', labelEn: 'New', value: 'new' },
        { labelAr: 'مستعمل بحالة ممتازة', labelEn: 'Used - Excellent', value: 'excellent' },
        { labelAr: 'مستعمل بحالة جيدة', labelEn: 'Used - Good', value: 'good' }
      ]
    }
  ],
  'electronics-tablets': [
    { key: 'brand', labelAr: 'الماركة', labelEn: 'Brand', type: 'text', required: true },
    { key: 'model', labelAr: 'الموديل', labelEn: 'Model', type: 'text', required: true },
    { 
      key: 'condition', labelAr: 'الحالة', labelEn: 'Condition', type: 'select', required: true,
      options: [
        { labelAr: 'جديد', labelEn: 'New', value: 'new' },
        { labelAr: 'مستعمل بحالة ممتازة', labelEn: 'Used - Excellent', value: 'excellent' },
        { labelAr: 'مستعمل بحالة جيدة', labelEn: 'Used - Good', value: 'good' }
      ]
    }
  ],
  furniture: [
    { key: 'type', labelAr: 'نوع القطعة', labelEn: 'Item Type', type: 'text', required: true },
    { key: 'material', labelAr: 'المادة المصنعة', labelEn: 'Material', type: 'text', required: false },
    { 
      key: 'condition', labelAr: 'الحالة', labelEn: 'Condition', type: 'select', required: true,
      options: [
        { labelAr: 'جديد', labelEn: 'New', value: 'new' },
        { labelAr: 'مستعمل بحالة ممتازة', labelEn: 'Used - Excellent', value: 'excellent' },
        { labelAr: 'مستعمل بحالة جيدة', labelEn: 'Used - Good', value: 'good' }
      ]
    }
  ],
  'furniture-appliances': [
    { key: 'brand', labelAr: 'الماركة', labelEn: 'Brand', type: 'text', required: true },
    { 
      key: 'condition', labelAr: 'الحالة', labelEn: 'Condition', type: 'select', required: true,
      options: [
        { labelAr: 'جديد', labelEn: 'New', value: 'new' },
        { labelAr: 'مستعمل بحالة ممتازة', labelEn: 'Used - Excellent', value: 'excellent' },
        { labelAr: 'مستعمل بحالة جيدة', labelEn: 'Used - Good', value: 'good' }
      ]
    }
  ],
  clothing: [
    { key: 'brand', labelAr: 'الماركة', labelEn: 'Brand', type: 'text', required: true },
    { key: 'size', labelAr: 'المقاس', labelEn: 'Size', type: 'text', required: true },
    { key: 'color', labelAr: 'اللون', labelEn: 'Color', type: 'text', required: true },
    { 
      key: 'condition', labelAr: 'الحالة', labelEn: 'Condition', type: 'select', required: true,
      options: [
        { labelAr: 'جديد بملصقاته', labelEn: 'New with tags', value: 'new_with_tags' },
        { labelAr: 'مستعمل كأنه جديد', labelEn: 'Used - Like New', value: 'excellent' },
        { labelAr: 'مستعمل - جيد', labelEn: 'Used - Good', value: 'good' }
      ]
    }
  ],
  jobs: [
    { key: 'job_title', labelAr: 'المسمى الوظيفي', labelEn: 'Job Title', type: 'text', required: true },
    { 
      key: 'job_type', labelAr: 'نوع العمل', labelEn: 'Job Type', type: 'select', required: true,
      options: [
        { labelAr: 'دوام كامل', labelEn: 'Full-time', value: 'full_time' },
        { labelAr: 'دوام جزئي', labelEn: 'Part-time', value: 'part_time' },
        { labelAr: 'عمل حر / مشروع', labelEn: 'Freelance', value: 'freelance' }
      ]
    }
  ],
  services: [
    { key: 'service_type', labelAr: 'نوع الخدمة', labelEn: 'Service Type', type: 'text', required: true, placeholderAr: 'اكتب الخدمة يلي بتقدمها (مثلاً: تصليح برادات)', placeholderEn: 'Type the service you offer (e.g. Fridge repair)' }
  ],
};
