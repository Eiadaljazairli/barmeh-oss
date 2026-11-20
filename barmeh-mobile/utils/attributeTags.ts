import { CATEGORY_SCHEMAS, CategoryField } from '../constants/categorySchemas';

const FIELD_INDEX: Record<string, CategoryField> = (() => {
  const idx: Record<string, CategoryField> = {};
  for (const schema of Object.values(CATEGORY_SCHEMAS)) {
    for (const field of schema) {
      if (!idx[field.key]) idx[field.key] = field;
    }
  }
  return idx;
})();

const OPTION_INDEX: Record<string, Record<string, { labelAr: string; labelEn: string }>> = (() => {
  const idx: Record<string, Record<string, { labelAr: string; labelEn: string }>> = {};
  for (const schema of Object.values(CATEGORY_SCHEMAS)) {
    for (const field of schema) {
      if (field.type !== 'select' || !field.options) continue;
      if (!idx[field.key]) idx[field.key] = {};
      for (const opt of field.options) {
        if (!idx[field.key][opt.value]) {
          idx[field.key][opt.value] = { labelAr: opt.labelAr, labelEn: opt.labelEn };
        }
      }
    }
  }
  return idx;
})();

const PRIORITY_KEYS: string[] = [
  'condition',
  'year',
  'bedrooms',
  'area',
  'transmission',
  'fuel_type',
  'mileage',
  'size',
  'part_type',
  'service_type',
  'brand',
  'make',
];

const MAX_TAGS = 3;

export interface AttributeTag {
  key: string;
  label: string;
}

export function extractTopTags(
  attributes: Record<string, string | number | boolean> | undefined,
  language: 'ar' | 'en' | string,
): AttributeTag[] {
  if (!attributes) return [];
  const isAr = language === 'ar';
  const tags: AttributeTag[] = [];

  for (const key of PRIORITY_KEYS) {
    if (tags.length >= MAX_TAGS) break;
    const raw = attributes[key];
    if (raw === undefined || raw === null || raw === '') continue;

    const field = FIELD_INDEX[key];
    if (!field) continue;

    let display = String(raw);
    if (field.type === 'select') {
      const merged = OPTION_INDEX[key]?.[String(raw)];
      if (merged) {
        display = isAr ? merged.labelAr : merged.labelEn;
      } else if (field.options) {
        const match = field.options.find((o) => o.value === String(raw));
        if (match) display = isAr ? match.labelAr : match.labelEn;
      }
    } else if (field.type === 'number') {
      const suffix = isAr ? field.suffixAr : field.suffixEn;
      const num = Number(raw);
      if (!isNaN(num)) {
        display = num.toLocaleString();
        if (suffix) display = `${display} ${suffix}`;
      }
    }

    tags.push({ key, label: display });
  }

  return tags;
}
