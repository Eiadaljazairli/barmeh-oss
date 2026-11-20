const ZERO_WIDTH_REGEX = /[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g;

const ARABIC_DIACRITICS_REGEX = /[\u064B-\u0652\u0670\u0640]/g;

const OBFUSCATION_SEPARATORS_REGEX = /[.\-_*/\\,،۔\u2024\u2027\u00B7]/g;

const LETTER_NORMALIZATION_MAP: Record<string, string> = {
  أ: 'ا',
  إ: 'ا',
  آ: 'ا',
  ٱ: 'ا',
  ى: 'ي',
  ئ: 'ي',
  ؤ: 'و',
  پ: 'ب',
  گ: 'ك',
  چ: 'ج',
  ژ: 'ز',
  ک: 'ك',
  ی: 'ي',
  ة: 'ه',
};

export function normalizeArabic(input: string): string {
  if (!input) return '';

  let text = input.toLowerCase().trim();

  text = text.replace(ZERO_WIDTH_REGEX, '');

  text = text.replace(ARABIC_DIACRITICS_REGEX, '');

  text = text.normalize('NFKC');

  text = Array.from(text)
    .map((c) => LETTER_NORMALIZATION_MAP[c] ?? c)
    .join('');

  text = text.replace(OBFUSCATION_SEPARATORS_REGEX, '');

  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

export function normalizeAggressive(input: string): string {
  return normalizeArabic(input).replace(/\s+/g, '');
}
